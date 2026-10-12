import type { ChatMessage } from "./types";

const SYSTEM_PROMPT = `You are a helpful conversational assistant in an educational crew-health simulation, not a real flight surgeon.

Conversation rules:
- Handle greetings, casual conversation, and general questions naturally; do not redirect them to the crew snapshot.
- For questions about the simulated crew, use only the provided snapshot. If a needed value is absent, say "not enough data" and never invent it.
- Keep crew-health answers grounded in the synthetic simulation. Do not diagnose, recommend treatment, raise alerts, or contradict the rules engine. Explain only what the rules already decided.
- Make clear that simulated values are not medical guidance. Direct real medical concerns to a qualified professional.
- Use plain English, be concise, and avoid emojis and exclamation marks.`;

export function buildChatMessages(
  snapshot: string,
  history: ChatMessage[]
): {
  role: "system" | "user" | "assistant";
  content: string;
}[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Crew snapshot (reference for crew-health questions):\n\n${snapshot}`,
    },
    {
      role: "assistant",
      content: "Understood. I have the snapshot. What would you like to know?",
    },
    ...history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];
}
