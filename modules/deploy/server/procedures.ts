import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { Sandbox } from "@e2b/code-interpreter";
import prisma from "@/lib/prisma";

const SANDBOX_TEMPLATE_ID = "dk2p5fs1dibg7w57xpdc";
const SANDBOX_TIMEOUT_MS = 3600000; // 1 hour

export const deployRouter = createTRPCRouter({
  deployToVercel: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1),
        projectName: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const vercelToken = process.env.VERCEL_TOKEN;

      if (!vercelToken) {
        throw new Error(
          "VERCEL_TOKEN is not configured. Add it to your .env file."
        );
      }

      // Fetch the latest codebase from the database
      const latestMessage = await prisma.message.findFirst({
        where: {
          projectId: input.projectId,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: { isNot: null },
        },
        orderBy: { createdAt: "desc" },
        include: { fragment: true },
      });

      if (!latestMessage?.fragment?.files) {
        throw new Error(
          "No generated code found. Please generate code before deploying."
        );
      }

      const filesMap = latestMessage.fragment.files as Record<string, string>;
      const files = Object.entries(filesMap).map(([path, data]) => ({
        path,
        data,
      }));

      if (files.length === 0) {
        throw new Error(
          "No files found in the latest generation. Please generate code before deploying."
        );
      }

      // Create a fresh sandbox for deployment
      const sandbox = await Sandbox.create(SANDBOX_TEMPLATE_ID, {
        timeoutMs: SANDBOX_TIMEOUT_MS,
      });

      try {
        // Restore the codebase into the fresh sandbox
        await sandbox.files.write(files);

        const safeProjectName = input.projectName
          .replace(/[^a-z0-9-]/gi, "-")
          .toLowerCase();

        // Write vercel.json to configure project name
        await sandbox.files.write(
          "/home/user/vercel.json",
          JSON.stringify({ name: safeProjectName })
        );

        // Run Vercel CLI from inside the sandbox
        const result = await sandbox.commands.run(
          `npx --yes vercel deploy --yes --prod --token=${vercelToken}`
        );

        if (result.error || result.exitCode !== 0) {
          throw new Error(
            `Vercel CLI Error: ${result.stderr || result.stdout}`
          );
        }

        // Extract the deployed URL from stdout
        const output = result.stdout + "\n" + result.stderr;
        const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.vercel\.app/i);

        if (!urlMatch) {
          throw new Error(
            "Deployed successfully, but could not extract the URL from Vercel CLI output.\nOutput: " +
            output
          );
        }

        return {
          url: urlMatch[0],
          projectName: input.projectName,
        };
      } catch (err: any) {
        throw new Error(`Deployment failed: ${err.message}`);
      }
    }),
});
