import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { inngest } from "./client";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0,
    });
    const messages = [
      new SystemMessage("You are a coding agent for nextjs application."),
      new HumanMessage(event.data.value),
    ];
    const response = await model.invoke(messages);

    return { message: response.content };
  }
);
