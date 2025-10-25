import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import {
  Command,
  END,
  MemorySaver,
  START,
  StateGraph,
} from "@langchain/langgraph";
import {
  AIMessage,
  createAgent,
  createMiddleware,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "langchain";
import {
  CODE_GEN_SYSTEM_PROMPT,
  PLANNER_SYSTEM_PROMPT,
  RESULT_ANALYZER_PROMPT,
} from "./prompt";
import { AgentState, FileSchema, ResultSchema } from "./schema";
import { createFiles, executeCommands, listFiles, readFiles } from "./tools";
import { Sandbox } from "@e2b/code-interpreter";
import * as z from "zod/v4";
import "dotenv/config";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-pro",
  temperature: 0,
});

const groq = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
});

const toolMonitoringMiddleware = createMiddleware({
  name: "ToolMonitoringMiddleware",
  wrapToolCall: (request, handler) => {
    console.log(`Executing tool: ${request.toolCall.name}`);
    console.log(`Arguments: ${JSON.stringify(request.toolCall.args)}`);

    try {
      const result = handler(request);
      console.log("Tool completed successfully");
      return result;
    } catch (e) {
      console.log(`Tool failed: ${e}`);
      throw e;
    }
  },
});

const agent = createAgent({
  model: groq,
  tools: [readFiles, listFiles, executeCommands],
  middleware: [toolMonitoringMiddleware],
});

async function planner(state: z.infer<typeof AgentState>) {
  console.log("Planning");
  const response = await agent.invoke({
    messages: [
      new SystemMessage(PLANNER_SYSTEM_PROMPT),
      new HumanMessage(
        state.userRequest +
          `To call tools use this sandboxId: ${state.sandboxId}`
      ),
    ],
  });
  console.log(response);
  return {
    plan: response.messages[response.messages.length - 1].content,
    status: "coding",
    messages: [...response.messages],
  };
}

async function shouldCallTools(state: z.infer<typeof AgentState>) {
  const lastMessage = state.messages[state.messages.length - 1];

  if (AIMessage.isInstance(lastMessage) && lastMessage.tool_calls?.length) {
    return "toolNode";
  }

  return "codeGenerator";
}

const toolsByName = {
  [createFiles.name]: createFiles,
  [readFiles.name]: readFiles,
  [executeCommands.name]: executeCommands,
  [listFiles.name]: listFiles,
};
async function toolNode(state: z.infer<typeof AgentState>) {
  const lastMessage = state.messages[state.messages.length - 1];

  if (lastMessage == null || !AIMessage.isInstance(lastMessage)) {
    return { messages: [] };
  }

  const result: ToolMessage[] = [];

  for (const toolCall of lastMessage.tool_calls ?? []) {
    const tool = toolsByName[toolCall.name]!;
    const observation = await (tool as any).invoke(toolCall);
    result.push(observation);
  }
  return { messages: result };
}

async function codeGenerator(state: z.infer<typeof AgentState>) {
  console.log("Generating code");

  const fileList = await listFiles.invoke({
    path: "./",
    sandboxId: state.sandboxId,
  });
  let prompt =
    "User Request " +
    state.userRequest +
    " Take this plan into consideration: " +
    state["plan"] +
    `Here is the folder structure: ${fileList}. Write files to appropriate path`;

  if (state.resultAnalysis.hasError) {
    prompt += `Make sure not to repeat this error or try to solve this error. Here is the solution: ${state.resultAnalysis.solution}`;
  }
  const response = await model
    .withStructuredOutput(FileSchema)
    .invoke([
      new SystemMessage(CODE_GEN_SYSTEM_PROMPT),
      new HumanMessage(prompt),
    ]);

  return { files: response, status: "executing" };
}

async function codeExecutor(state: z.infer<typeof AgentState>) {
  console.log("Executing code");
  await createFiles.invoke({
    files: state["files"],
    sandboxId: state["sandboxId"],
  });

  console.log("Create files in the sandbox");

  const sandbox = await Sandbox.connect(state.sandboxId);
  const result = { stderr: "", stdout: "", exitCode: 0 };

  console.log("Code executed in the sandbox");
  console.log(`https://${sandbox.getHost(3000)}`);

  return result.stderr
    ? {
        stderr: result.stderr,
        stdout: "",
        status: "failure",
        exitCode: result.exitCode,
      }
    : {
        stderr: "",
        stdout: result.stdout,
        status: "success",
        exitCode: result.exitCode,
      };
}

const MAX_ATTEMPTS = 3;

async function resultAnalyzer(state: z.infer<typeof AgentState>) {
  console.log("Analyzing results");

  const response = await model.withStructuredOutput(ResultSchema).invoke([
    new SystemMessage(RESULT_ANALYZER_PROMPT),
    new HumanMessage(
      `Exit code: ${state.exitCode} 
        stderr: ${state.stderr} Files: Paths: ${state.files
        .map((f) => `Path: ${f.path}`)
        .join(" ")}`
    ),
  ]);

  if (state.status === "success" && response.hasError === false) {
    return new Command({
      update: {
        finalReport: response.finalReport,
      },
      goto: END,
    });
  }
  const shouldRetry =
    response.hasError &&
    response.fixable &&
    state.correction_attempts < MAX_ATTEMPTS;
  return new Command({
    update: {
      resultAnalysis: response,
      correction_attempts: state.correction_attempts + 1,
      status: shouldRetry ? "coding" : "failure",
    },
    goto: shouldRetry ? "planner" : END,
  });
}

const graph = new StateGraph(AgentState)
  .addNode("planner", planner)
  .addNode("toolNode", toolNode)
  .addNode("codeGenerator", codeGenerator)
  .addNode("codeExecutor", codeExecutor)
  .addNode("resultAnalyzer", resultAnalyzer, {
    ends: ["planner", END],
  })
  .addEdge(START, "planner")
  .addConditionalEdges("planner", shouldCallTools, [
    "codeGenerator",
    "toolNode",
  ])
  .addEdge("planner", "codeGenerator")
  .addEdge("codeGenerator", "codeExecutor")
  .addEdge("codeExecutor", "resultAnalyzer");

export const codex = graph.compile({ checkpointer: new MemorySaver() });
