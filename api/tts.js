// /api/tts.js  — Vercel Serverless Function
// POST { text: string, lang?: 'ko-KR' | 'en-US' | 'fr-FR' }
// returns: { audio: base64-mp3 }

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
    const { text, lang = "fr-FR" } = await readJSON(req);
    if (!text || typeof text !== "string") {
      return json(res, 400, { error: "text is required" });
    }

    // 언어별 Voice ID 매핑(환경변수에서 읽기)
    const voiceMap = {
      "fr-FR": process.env.ELEVENLABS_VOICE_FR,
      "en-US": process.env.ELEVENLABS_VOICE_EN,
      "ko-KR": process.env.ELEVENLABS_VOICE_KO
    };
    const voiceId = voiceMap[lang] || process.env.ELEVENLABS_VOICE_FR;
    if (!process.env.ELEVENLABS_API_KEY || !voiceId) {
      return json(res, 500, { error: "missing_elevenlabs_config" });
    }

    const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=0`;
    const body = {
      // 멀티랭 모델 권장 (ko/en/fr 모두 지원)
      model_id: "eleven_multilingual_v2",
      text,
      voice_settings: {
        stability: 0.4,
        similarity_boost: 0.85,
      }
    };

    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "accept": "audio/mpeg",
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const errTxt = await safeText(r);
      return json(res, 502, { error: "tts_failed", detail: errTxt });
    }

    const buf = Buffer.from(await r.arrayBuffer());
    const b64 = buf.toString("base64");

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(200).json({ audio: b64 });
  } catch (e) {
    console.error(e);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: "server_error" });
  }
}

function json(res, code, obj){ res.setHeader("Content-Type","application/json"); res.status(code).json(obj); }
async function readJSON(req){
  const chunks=[]; for await (const c of req) chunks.push(c);
  const s = Buffer.concat(chunks).toString("utf8");
  return s ? JSON.parse(s) : {};
}
async function safeText(r){ try { return await r.text(); } catch { return ""; } }
