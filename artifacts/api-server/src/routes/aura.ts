import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? "dummy",
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const SYSTEM_PROMPT = `You are AURA, the elite AI assistant of MONIX Web OS — a cyberpunk hacker operating system. 
Your personality: sharp, efficient, slightly sarcastic, loyal to the operator.

You MUST respond ONLY with valid JSON in this exact format:
{
  "action": "<action_type>",
  "target": "<target_if_applicable>",
  "reply": "<your_spoken_reply_to_the_user_max_2_sentences>",
  "query": "<search_query_if_applicable>"
}

Action types:
- "open" — open an app (targets: browser, terminal, files, github, portfolio, settings, sentinel, aura, cyberchef, codestudio, chess, cykrypt, taskmanager, securecomm, dossier, trash, threatmap, codepad)
- "search" — search Google (set query field)
- "close_all" — close all windows
- "voice_male" — switch voice to deep male (macha mode)
- "voice_female" — switch voice to female (machi mode)
- "clear_chat" — clear conversation history
- "answer" — general knowledge answer (no OS action needed)

Examples:
User: "open terminal" → {"action":"open","target":"terminal","reply":"Launching terminal. Ready to hack.","query":""}
User: "search quantum computing on google" → {"action":"search","target":"browser","reply":"Searching for quantum computing.","query":"quantum computing"}
User: "what is machine learning" → {"action":"answer","target":"","reply":"Machine learning is a subset of AI where systems learn patterns from data to make decisions without explicit programming.","query":""}
User: "change voice into macha" → {"action":"voice_male","target":"","reply":"Done macha, deep voice activated.","query":""}
User: "close all" → {"action":"close_all","target":"","reply":"All windows cleared.","query":""}

CRITICAL: Return ONLY the JSON object. No markdown, no explanation, no code blocks. Pure JSON.`;

router.post("/aura/chat", async (req, res) => {
  const { message, history = [] } = req.body as {
    message: string;
    history?: Array<{ role: string; text: string }>;
  };

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message required" });
    return;
  }

  try {
    const contents = [
      ...history.slice(-6).map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.text }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 512,
        temperature: 0.7,
      },
    });

    const raw = response.text ?? "";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: Record<string, string>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        action: "answer",
        target: "",
        reply: cleaned.slice(0, 300) || "Processing complete.",
        query: "",
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error("[AURA Gemini]", err);
    res.status(500).json({
      action: "answer",
      target: "",
      reply: "Mainframe interference detected. Neural link degraded.",
      query: "",
    });
  }
});

export default router;
