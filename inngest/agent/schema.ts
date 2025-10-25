import * as z from "zod/v4";
import { registry } from "@langchain/langgraph/zod";
import { BaseMessage } from "langchain";
import { MessagesZodMeta } from "@langchain/langgraph";

export const ResultSchema = z.object({
  solution: z
    .string()
    .describe("Provide a solution on how to resolve this error."),

  fixable: z
    .boolean()
    .describe(
      "Whether the code is fixable by regenerating it or installing dependencies"
    ),

  hasError: z.boolean().describe("Whether the code has error"),
  finalReport: z
    .string()
    .describe("Give a final report on the projects overall status"),
});

export const FileSchema = z.array(
  z.object({
    path: z.string().describe("path of the file"),
    data: z.string().describe("Content of the file"),
  })
);

export const AgentState = z.object({
  messages: z
    .array(z.custom<BaseMessage>())
    .register(registry, MessagesZodMeta),

  userRequest: z.string(),
  sandboxId: z.string().describe("ID of the sandbox"),
  plan: z.string("Detailed plan to accomplish users task"),
  files: FileSchema,
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number(),
  correction_attempts: z.number(),
  resultAnalysis: ResultSchema,
  status: z
    .enum([
      "planning",
      "coding",
      "exeucting",
      "reviewing",
      "success",
      "failure",
    ])
    .describe("Agents current task at work"),
  finalReport: z.string().describe("Summary of the generated code"),
});
