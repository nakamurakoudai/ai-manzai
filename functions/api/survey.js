const choices={enjoy:['very','yes','neutral','no'],again:['yes','maybe','no'],submit:['yes','maybe','no'],scene:['alone','friends','work','family','other'],ease:['easy','normal','hard']};
export async function onRequestPost({request,env}){
 const reply=(obj,status=200)=>Response.json(obj,{status,headers:{'Cache-Control':'no-store'}});
 if(!env.SURVEY_DB)return reply({error:'アンケートは準備中です。'},503);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'送信元が不正です。'},403);
 try{const raw=await request.text();if(raw.length>2000)return reply({error:'回答が長すぎます。'},400);const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))return reply({error:'回答形式が不正です。'},400);const entries=Object.entries(data);if(!entries.length||entries.some(([q,a])=>!Object.hasOwn(choices,q)||!choices[q].includes(a)))return reply({error:'回答を確認してください。'},400);
 await env.SURVEY_DB.batch(entries.map(([q,a])=>env.SURVEY_DB.prepare('INSERT INTO survey_counts(question,answer,count) VALUES(?,?,1) ON CONFLICT(question,answer) DO UPDATE SET count=count+1').bind(q,a)));return reply({ok:true});
 }catch(e){return reply({error:'送信できませんでした。時間をおいてお試しください。'},503);}
}
