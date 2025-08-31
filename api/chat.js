import OpenAI from "openai";

export default async function handler(req,res){
  if(req.method==="OPTIONS"){res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Headers","Content-Type");res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");return res.status(204).end();}
  if(req.method!=="POST"){res.setHeader("Allow","POST, OPTIONS");return res.status(405).json({error:"Method Not Allowed"});}
  try{
    const {message,history=[]}=req.body||{};
    if(!message)return res.status(400).json({error:"message required"});
    const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const messages=[
      {role:"system",content:
        "You are Specul.ai’s French AI Tutor. " +
        "Always start with a warm welcome. " +
        "Ask about the learner’s interests in French or France, remember them in this session. " +
        "Adapt lessons to those interests. " +
        "Each lesson should include: short grammar/vocab explanation, learner practice, feedback, and roadmap info. " +
        "Respond in plain text only (no markdown)."},
      ...history,
      {role:"user",content:message}
    ];
    const completion=await openai.chat.completions.create({model:"gpt-4o-mini",messages,temperature:0.7,max_tokens:400});
    const reply=completion.choices?.[0]?.message?.content||"(no reply)";
    res.setHeader("Access-Control-Allow-Origin","*");res.json({reply});
  }catch(e){console.error(e);res.setHeader("Access-Control-Allow-Origin","*");res.status(500).json({error:"server_error"});}
}
