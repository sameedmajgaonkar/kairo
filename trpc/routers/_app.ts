import { projectsRouter } from "@/modules/projects/server/procedures";
import { createTRPCRouter } from "../init";
import { messagesRouter } from "@/modules/messages/server/procedures";
import { aiRouter } from "@/modules/ai/server/procedures";
import { deployRouter } from "@/modules/deploy/server/procedures";

export const appRouter = createTRPCRouter({
  messages: messagesRouter,
  projects: projectsRouter,
  ai: aiRouter,
  deploy: deployRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
