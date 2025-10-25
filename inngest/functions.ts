import { Sandbox } from "@e2b/code-interpreter";
import "dotenv/config";
import * as z from "zod/v4";
import { inngest } from "./client";
import { AgentState } from "./schema";
import { codex } from "./agent/agent";
import prisma from "@/lib/prisma";

let codex_response: z.infer<typeof AgentState>;

export const codeGeneration = inngest.createFunction(
  { id: "code-generation" },
  { event: "code.generation" },
  async ({ event, step }) => {
    // Create a sandbox using prebuilt template

    const sandbox = await Sandbox.create("codex-nextjs-test-1718", {
      timeoutMs: 3600000,
    });

    await step.run("run-code-generation-graph", async () => {
      const response = await codex.invoke(
        {
          messages: [],
          userRequest: event.data.value,
          sandboxId: sandbox.sandboxId,
          plan: "",
          files: [],
          stdout: "",
          stderr: "",
          exitCode: 0,
          correction_attempts: 0,
          resultAnalysis: {
            fixable: false,
            solution: "",
            hasError: false,
            finalReport: "",
          },
          status: "planning",
          finalReport: "",
        },
        { configurable: { thread_id: "1" } }
      );
      codex_response = response;
    });

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const host = sandbox.getHost(3000);
    const sandboxUrl = `https://${host}`;
    /**
     * TODO : Langgraph
     */
    // TODO: add error message to db and save codex_responses in the db
    // Add files
    await step.run("save-result", async () => {
      if (codex_response.resultAnalysis.hasError) {
        return await prisma.message.create({
          data: {
            content: "Something went wrong. Please try again!",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      return await prisma.message.create({
        data: {
          role: "ASSISTANT",
          content: codex_response.finalReport,
          type: "RESULT",
          fragment: {
            create: {
              title: "Fragment",
              sandboxUrl,
              files: codex_response.files,
            },
          },
        },
      });
    });
    return { message: codex_response.messages, sandboxUrl };
  }
);
