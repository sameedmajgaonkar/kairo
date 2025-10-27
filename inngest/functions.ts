import { Sandbox } from "@e2b/code-interpreter";
import "dotenv/config";
import * as z from "zod/v4";
import { inngest } from "./client";
import { AgentState } from "./schema";
import { kairo } from "./agent/agent";
import prisma from "@/lib/prisma";

let kairo_response: z.infer<typeof AgentState>;
let sandboxUrl: string;

export const codeGeneration = inngest.createFunction(
  { id: "code-generation" },
  { event: "code.generation" },
  async ({ event, step }) => {
    // Create a sandbox using prebuilt template

    // Run codex agent
    await step.run("run-code-generation-graph", async () => {
      const sandbox = await Sandbox.create("dk2p5fs1dibg7w57xpdc", {
        timeoutMs: 3600000,
      });
      const host = sandbox.getHost(3000);
      sandboxUrl = `https://${host}`;
      const response = await kairo.invoke(
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
      kairo_response = response;
    });

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    await step.run("save-result", async () => {
      if (!event.data.projectId) {
        throw new Error("Missing projectId in event data");
      }
      if (kairo_response.resultAnalysis.hasError) {
        return await prisma.message.create({
          data: {
            projectId: event.data.projectId,
            content: "Something went wrong. Please try again!",
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      return await prisma.message.create({
        data: {
          projectId: event.data.projectId,
          role: "ASSISTANT",
          content: kairo_response.finalReport,
          type: "RESULT",
          fragment: {
            create: {
              title: "Fragment",
              sandboxUrl,
              files: kairo_response.files,
            },
          },
        },
      });
    });
    return { message: kairo_response.messages, sandboxUrl };
  }
);
