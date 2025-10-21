import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { inngest } from "./client";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox } from "./utils";
export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    // Create a sandbox using prebuilt template

    const sandboxId = await step.run("get-sandboxId", async () => {
      const sandbox = await Sandbox.create("codex-nextjs-test-1718");
      return sandbox.sandboxId;
    });

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0,
    });
    const messages = [
      new SystemMessage("You are a coding agent for nextjs application."),
      new HumanMessage(event.data.value),
    ];
    const response = await model.invoke(messages);

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });
    return { message: response.content, sandboxUrl };
  }
);
