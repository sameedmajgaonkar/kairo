import * as z from "zod/v4";
import { tool } from "langchain";
import { Sandbox } from "@e2b/code-interpreter";
import { FileSchema } from "./schema";

export const createFiles = tool(
  async ({ files, sandboxId }) => {
    try {
      const sandbox = await Sandbox.connect(sandboxId);
      await sandbox.files.write(files);
      return "Successfully wrote all the files";
    } catch (e) {
      return `Error writing to files ${e}`;
    }
  },
  {
    name: "create_files",
    description: "Use this tool to create and write to files",
    schema: z.object({
      files: FileSchema,
      sandboxId: z.string().describe("ID of the sandbox"),
    }),
  }
);

export const executeCommands = tool(
  async ({ command, sandboxId }) => {
    try {
      const sandbox = await Sandbox.connect(sandboxId);
      await sandbox.commands.run(command);
      return `Command ${command} executed Successfully`;
    } catch (e) {
      return `Error in executing the command ${command}`;
    }
  },
  {
    name: "execute_commands",
    description:
      "Use this tool to install dependencies in the sandbox e.g. npm install dependency name --yes ",
    schema: z.object({
      command: z.string(),
      sandboxId: z.string().describe("ID of the sandbox"),
    }),
  }
);

export const readFiles = tool(
  async ({ path, sandboxId }) => {
    const sandbox = await Sandbox.connect(sandboxId);
    const fileContent = await sandbox.files.read(path);
    return `Path: ${path} Content: ${fileContent}`;
  },
  {
    name: "read_files",
    description: "Use this tool to get files from the sandbox",
    schema: z.object({
      path: z.string().describe("Path of the file"),
      sandboxId: z.string().describe("ID of the sandbox"),
    }),
  }
);
export const listFiles = tool(
  async ({ path, sandboxId }) => {
    const sandbox = await Sandbox.connect(sandboxId);
    const fileList = await sandbox.files.list(path);
    return `Path: ${path} List of Files with their names and path: ${fileList.map(
      (f) => `Name: ${f.name} Path:${f.path}`
    )}`;
  },
  {
    name: "list_files",
    description: "Use this tool to get a list of files from the sandbox",
    schema: z.object({
      path: z.string().describe("Path to the directory"),
      sandboxId: z.string().describe("ID of the sandbox"),
    }),
  }
);
