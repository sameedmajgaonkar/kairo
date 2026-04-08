import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { gemini } from "@/lib/ai";
import { HumanMessage, SystemMessage } from "langchain";

const REVIEW_SYSTEM_PROMPT = `You are a senior software engineer performing a code review. Analyze the provided codebase and return a structured review.

Your review must cover:
1. **Bugs & Issues** — Actual bugs, potential crashes, null pointer risks, incorrect logic
2. **Performance** — Unnecessary re-renders, missing memoization, N+1 problems, large bundle impacts
3. **Best Practices** — React/Next.js patterns, accessibility, TypeScript usage, error handling
4. **Security** — XSS risks, exposed secrets, insecure API calls, input validation gaps

For each finding, provide:
- severity: "critical" | "warning" | "info"
- category: "bug" | "performance" | "best-practice" | "security"
- file: the file path
- line: approximate line number (or null if general)  
- title: short one-line title
- description: clear explanation of the issue
- suggestion: how to fix it

Also provide an overall score from 0-100 and a one-paragraph summary.

Respond ONLY with valid JSON matching this schema:
{
  "score": number,
  "summary": string,
  "findings": Array<{
    severity: "critical" | "warning" | "info",
    category: "bug" | "performance" | "best-practice" | "security",
    file: string,
    line: number | null,
    title: string,
    description: string,
    suggestion: string
  }>
}`;

const EXPLAIN_SYSTEM_PROMPT = `You are a friendly, expert software engineer explaining code to a developer who wants to understand it deeply.

Your explanation must include:
1. **Purpose** — What this file does in 1-2 sentences
2. **How It Works** — Step-by-step walkthrough of the key logic
3. **Connections** — How it connects to other parts of the app (imports, exports, data flow)
4. **Key Concepts** — Any important patterns, hooks, or techniques used
5. **Potential Improvements** — 1-2 optional suggestions for making it better

Keep your tone clear and educational. Use code snippets where helpful. Format with markdown.`;

export const aiRouter = createTRPCRouter({
  reviewCode: protectedProcedure
    .input(
      z.object({
        files: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const filesContent = Object.entries(input.files)
        .map(([path, content]) => `--- ${path} ---\n${content}`)
        .join("\n\n");

      const response = await gemini.invoke([
        new SystemMessage(REVIEW_SYSTEM_PROMPT),
        new HumanMessage(
          `Review the following codebase:\n\n${filesContent}`
        ),
      ]);

      const text =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);

      // Extract JSON from the response (handle potential markdown wrapping)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          score: 0,
          summary: "Could not parse review results.",
          findings: [],
        };
      }

      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return {
          score: 0,
          summary: "Could not parse review results.",
          findings: [],
        };
      }
    }),

  explainFile: protectedProcedure
    .input(
      z.object({
        filePath: z.string(),
        fileContent: z.string(),
        projectFiles: z.record(z.string(), z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Build context about the rest of the project
      let projectContext = "";
      if (input.projectFiles) {
        const otherFiles = Object.entries(input.projectFiles)
          .filter(([path]) => path !== input.filePath)
          .map(([path]) => path)
          .join(", ");
        projectContext = `\n\nOther files in the project: ${otherFiles}`;
      }

      const response = await gemini.invoke([
        new SystemMessage(EXPLAIN_SYSTEM_PROMPT),
        new HumanMessage(
          `Explain this file: ${input.filePath}\n\n${input.fileContent}${projectContext}`
        ),
      ]);

      const text =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);

      return { explanation: text };
    }),
});
