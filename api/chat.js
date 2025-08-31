// /api/chat.js
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { message, history = [] } = req.body || {};
    if (!message) return res.status(400).json({ error: "message is required" });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const messages = [
      {
        role: "system",
        content:
          "You are a kind, concise kid-friendly tutor. " +
          "Respond in PLAIN TEXT only (no Markdown, no asterisks, no emojis). " + // ★ 마크다운 금지
          "Keep sentences short, spoken-friendly, safe."
      },
      ...history,
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 300
    });

    // 후처리: 혹시 남은 마크다운/기호 제거
    const raw = completion.choices?.[0]?.message?.content ?? "";
    const reply = raw
      .replace(/\*\*/g, "")
      .replace(/[`*_~]/g, "")
      .trim();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: "server_error" });
  }
}
