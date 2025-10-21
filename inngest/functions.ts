import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createAgent, tool } from "langchain";
import { inngest } from "./client";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Sandbox } from "@e2b/code-interpreter";
import { getSandbox } from "./utils";
import { z } from "zod";
import { PROMPT } from "./prompt";

export const codeGeneration = inngest.createFunction(
  { id: "code-generation" },
  { event: "code.generation" },
  async ({ event, step }) => {
    // Create a sandbox using prebuilt template

    const sandboxId = await step.run("get-sandboxId", async () => {
      const sandbox = await Sandbox.create("codex-nextjs-test-1718");
      return sandbox.sandboxId;
    });

    // A G E N T
    // Terminal tool
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    const terminalTool = tool(
      async ({ command }) => {
        step.run("terminal", async () => {
          const buffer = { stdout: "", stderr: "" };

          try {
            const sandbox = await getSandbox(sandboxId);
            const result = await sandbox.commands.run(command, {
              onStderr(data) {
                buffer.stderr += data;
              },
              onStdout(data) {
                buffer.stdout += data;
              },
            });

            return result.stdout;
          } catch (e) {
            console.error(
              `Command failed: ${e} \n\n stdout: ${buffer.stdout} \n\n stderr: ${buffer.stderr}`
            );
            return `Command failed: ${e} \n\n stdout: ${buffer.stdout} \n\n stderr: ${buffer.stderr}`;
          }
        });
      },
      {
        name: "terminal",
        description: "Use this tool to run commands in the terminal",
        schema: z.object({
          command: z.string().describe("command to run"),
        }),
      }
    );

    const createOrUpdateFilesTool = tool(
      async ({ files }) => {
        const newFiles = await step.run("Create or Update Files", async () => {
          try {
            const updatedFiles: Record<string, string> = {};
            const sandbox = await getSandbox(sandboxId);
            for (const file of files) {
              await sandbox.files.write(file.path, file.content);
              updatedFiles[file.path] = file.content;
            }
            return updatedFiles;
          } catch (e) {
            console.error("Error" + e);
            return "Error" + e;
          }
        });
      },
      {
        name: "create_or_update_files",
        description: "Use this tool to create or update files in the sandbox",
        schema: z.object({
          files: z.array(
            z.object({
              path: z.string().describe("Path of the file"),
              content: z.string().describe("Content of the file"),
            })
          ),
        }),
      }
    );

    const readFilesTool = tool(
      async ({ files }) => {
        return await step.run("Read Files", async () => {
          try {
            const sandbox = await getSandbox(sandboxId);
            const contents = [];
            for (const file of files) {
              const content = await sandbox.files.read(file);
              contents.push({ path: file, content });
            }
            return JSON.stringify(contents);
          } catch (e) {}
        });
      },
      {
        name: "read_files",
        description: "Use this tool to read files from the sandbox",
        schema: z.object({
          files: z.array(z.string()),
        }),
      }
    );

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-pro",
      temperature: 0.1,
    });

    const agent = createAgent({
      model,
      tools: [terminalTool, createOrUpdateFilesTool, readFilesTool],
    });
    const messages = [
      new SystemMessage(PROMPT),
      new HumanMessage(event.data.value),
    ];
    const response = await agent.invoke({ messages });

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });
    return { message: response, sandboxUrl };
  }
);
