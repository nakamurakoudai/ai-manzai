const choices={enjoy:['very','yes','neutral','no'],again:['yes','maybe','no'],submit:['yes','maybe','no'],scene:['alone','friends','work','family','other'],ease:['easy','normal','hard']};

const allowedOrigin='https://micolabo.jp';

function originAllowed(request){
 const origin=request.headers.get('Origin');
 return origin===allowedOrigin||origin===new URL(request.url).origin;
}

function cors(request){
 return {'Vary':'Origin',...(originAllowed(request)?{'Access-Control-Allow-Origin':request.headers.get('Origin')}:{})};
}

export function onRequestOptions({request}){
 if(!originAllowed(request))return new Response(null,{status:403});
 return new Response(null,{status:204,headers:{...cors(request),'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}});
}

export async function onRequestPost({request,env}){
 const reply=(obj,status=200)=>Response.json(obj,{status,headers:{'Cache-Control':'no-store',...cors(request)}});
 if(!env.SURVEY_DB)return reply({error:'アンケートは準備中です。'},503);
 if(!originAllowed(request))return reply({error:'送信元が不正です。'},403);
 try{
 const raw=await request.text();
 if(raw.length>64000)return reply({error:'回答が長すぎます。'},400);
 const data=JSON.parse(raw);
 if(!data||typeof data!=='object'||Array.isArray(data))return reply({error:'回答形式が不正です。'},400);
 const entries=[];
 for(const [q,a] of Object.entries(data)){
 if(q==='favorite'){
 if(!Array.isArray(a)||!a.length||a.length>1000||a.some(x=>typeof x!=='string')||new Set(a).size!==a.length||(a.includes('__none__')&&a.length!==1))return reply({error:'作品の選択を確認してください。'},400);
 const r=await fetch(new URL('/scripts/catalog.json',request.url),{cache:'no-store'});
 if(!r.ok)throw Error('catalog');
 const catalog=await r.json();
 if(!Array.isArray(catalog))throw Error('catalog');
 const valid=new Set(catalog.map(x=>x.id));
 if(a.some(x=>x!=='__none__'&&!valid.has(x)))return reply({error:'作品一覧が更新されました。ページを再読み込みしてください。'},400);
 for(const id of a)entries.push(['favorite',id]);
 }else{
 if(!Object.hasOwn(choices,q)||!choices[q].includes(a))return reply({error:'回答を確認してください。'},400);
 entries.push([q,a]);
 }
 }
 if(!entries.length)return reply({error:'回答を確認してください。'},400);
 await env.SURVEY_DB.batch(entries.map(([q,a])=>env.SURVEY_DB.prepare('INSERT INTO survey_counts(question,answer,count) VALUES(?,?,1) ON CONFLICT(question,answer) DO UPDATE SET count=count+1').bind(q,a)));
 return reply({ok:true});
 }catch(e){
 return reply({error:'送信できませんでした。時間をおいてお試しください。'},503);
 }
}
