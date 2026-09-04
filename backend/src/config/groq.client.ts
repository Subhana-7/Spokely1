import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

export async function chatWithGroq(prompt: string) {
  const response = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a teacher who creates SHORT daily language tasks. Keep prompts max 1–2 lines. Avoid essays. For reading/listening, generate 5 short questions only.",
      },
      { role: "user", content: prompt },
    ],
  });

  return response.choices[0]?.message?.content;
}
