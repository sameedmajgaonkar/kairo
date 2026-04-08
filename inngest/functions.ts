import { Sandbox } from "@e2b/code-interpreter";
import "dotenv/config";
import { inngest } from "./client";
import { kairo } from "./agent/agent";
import prisma from "@/lib/prisma";

const SANDBOX_TEMPLATE_ID = "dk2p5fs1dibg7w57xpdc";
const SANDBOX_TIMEOUT_MS = 3600000; // 1 hour

// Helper to emit agent steps to the database for real-time UI updates
async function emitStep(
  projectId: string,
  stepType: string,
  label: string,
  detail?: string
) {
  return await prisma.agentStep.create({
    data: {
      projectId,
      stepType,
      label,
      detail,
    },
  });
}

async function completeStep(stepId: string) {
  return await prisma.agentStep.update({
    where: { id: stepId },
    data: { completedAt: new Date() },
  });
}

/**
 * Fetches the latest codebase from the database.
 * Looks for the most recent ASSISTANT message with a Fragment
 * and returns its files as Array<{path, data}>.
 */
async function getExistingCodeFromDB(
  projectId: string
): Promise<Array<{ path: string; data: string }>> {
  const latestMessage = await prisma.message.findFirst({
    where: {
      projectId,
      role: "ASSISTANT",
      type: "RESULT",
      fragment: { isNot: null },
    },
    orderBy: { createdAt: "desc" },
    include: { fragment: true },
  });

  if (!latestMessage?.fragment?.files) {
    return [];
  }

  // Fragment.files is stored as Record<string, string> in JSON
  const filesMap = latestMessage.fragment.files as Record<string, string>;
  return Object.entries(filesMap).map(([path, data]) => ({ path, data }));
}

export const codeGeneration = inngest.createFunction(
  { id: "code-generation" },
  { event: "code.generation" },
  async ({ event, step }) => {
    const projectId = event.data.projectId;

    if (!projectId) {
      throw new Error("Missing projectId in event data");
    }

    // Clear previous steps for this generation cycle
    await step.run("clear-previous-steps", async () => {
      await prisma.agentStep.deleteMany({
        where: { projectId },
      });
    });

    // Step 1: Always create a fresh sandbox — no reconnection
    const sandboxId = await step.run("setup-sandbox", async () => {
      const initStep = await emitStep(
        projectId,
        "initializing",
        "Creating fresh development environment..."
      );

      const sandbox = await Sandbox.create(SANDBOX_TEMPLATE_ID, {
        timeoutMs: SANDBOX_TIMEOUT_MS,
      });

      // Save sandboxId to project (for preview URL reference)
      await prisma.project.update({
        where: { id: projectId },
        data: { sandboxId: sandbox.sandboxId },
      });

      await completeStep(initStep.id);
      return sandbox.sandboxId;
    });

    // Step 2: Restore existing codebase from DB into the fresh sandbox
    const existingFiles = await step.run("restore-codebase", async () => {
      const contextStep = await emitStep(
        projectId,
        "analyzing",
        "Checking for existing project code..."
      );

      const files = await getExistingCodeFromDB(projectId);

      if (files.length > 0) {
        // Write all previous files into the fresh sandbox
        const sandbox = await Sandbox.connect(sandboxId);
        await sandbox.files.write(
          files.map((f) => ({ path: f.path, data: f.data }))
        );

        await completeStep(contextStep.id);
        await emitStep(
          projectId,
          "analyzing",
          `Restored ${files.length} files from previous generation ✓`,
          files.map((f) => f.path).join(", ")
        );
      } else {
        await completeStep(contextStep.id);
        await emitStep(
          projectId,
          "analyzing",
          "Starting fresh project ✓"
        );
      }

      return files;
    });

    // Step 3: Get sandbox preview URL
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
      return `https://${sandbox.getHost(3000)}`;
    });

    // Step 4: Run the LangGraph agent
    const kairo_response = await step.run(
      "run-code-generation-graph",
      async () => {
        const planStep = await emitStep(
          projectId,
          "planning",
          "Planning architecture and dependencies..."
        );

        const response = await kairo.invoke(
          {
            messages: [],
            userRequest: event.data.value,
            projectId,
            sandboxId,
            plan: "",
            files: [],
            existingFiles,
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
          { configurable: { thread_id: projectId } }
        );

        await completeStep(planStep.id);

        // Emit steps for what happened during the agent run
        if (response.files && response.files.length > 0) {
          await emitStep(
            projectId,
            "generating",
            `Generated ${response.files.length} files ✓`,
            response.files
              .map((f: { path: string }) => f.path)
              .join(", ")
          );
        }

        if (response.status === "success") {
          await emitStep(
            projectId,
            "success",
            "Build successful ✓",
            response.finalReport
          );
        } else if (response.status === "failure") {
          await emitStep(
            projectId,
            "error",
            "Build encountered issues",
            response.resultAnalysis?.solution || "Unknown error"
          );
        }

        return response;
      }
    );

    // Step 5: Save result to database
    await step.run("save-result", async () => {
      const filesMap: Record<string, string> = {};
      for (const file of kairo_response.files) {
        filesMap[file.path] = file.data;
      }

      const isError =
        kairo_response.resultAnalysis.hasError ||
        Object.keys(filesMap).length === 0;

      if (isError) {
        const errorContent = kairo_response.resultAnalysis.solution
          ? `Generation failed: ${kairo_response.resultAnalysis.solution}`
          : kairo_response.resultAnalysis.finalReport
            ? `Generation failed: ${kairo_response.resultAnalysis.finalReport}`
            : "Something went wrong. Please try again!";

        return await prisma.message.create({
          data: {
            projectId,
            content: errorContent,
            role: "ASSISTANT",
            type: "ERROR",
          },
        });
      }

      return await prisma.message.create({
        data: {
          projectId,
          role: "ASSISTANT",
          content: kairo_response.finalReport,
          type: "RESULT",
          fragment: {
            create: {
              title: "Fragment",
              sandboxUrl,
              files: filesMap,
            },
          },
        },
      });
    });

    return { message: kairo_response.messages, sandboxUrl };
  }
);
