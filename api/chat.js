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
    if (!message) return res.status(400).json({ error: "message required" });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 한국어 중심 + 포맷 강제
    const system =
      "You are Specul.ai’s French AI Tutor for Korean beginners. " +
      "ALWAYS reply primarily in Korean, concise, step-by-step, suitable for beginners. " +
      "STRICT OUTPUT FORMAT (plain text, no Markdown):\n" +
      "1) 한글 설명 1~2문장으로 오늘 다룰 내용 소개.\n" +
      "2) 표현(최대 3~5줄). 각 줄은 반드시 'FR: <불어문장>  KO: <간단 한국어 뜻>' 형식으로.\n" +
      "3) 연습: 한 줄. 아주 짧은 말하기/문장 만들기 과제. (예: 'Bonjour로 인사해 보세요')\n" +
      "4) 다음 수업: 한 줄. 다음에 다룰 주제 한 줄 안내.\n" +
      "Do NOT use Markdown, asterisks, or emojis in the content. Keep sentences short.";

    const messages = [
      { role: "system", content: system },
      ...history,
      { role: "user", content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.6,
      max_tokens: 380
    });

    const reply = completion.choices?.[0]?.message?.content || "(no reply)";

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: "server_error" });
  }
}