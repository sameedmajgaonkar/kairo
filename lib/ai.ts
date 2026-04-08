import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import "dotenv/config";

// Shared model instance for on-demand AI features (review, explain, etc.)
export const gemini = new ChatGoogleGenerativeAI({
  model: "gemini-3-flash-preview",
  temperature: 0.2,
});
