import { createClient } from "jsr:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(o:any,s=200)=>new Response(JSON.stringify(o),{status:s,headers:{...cors,"Content-Type":"application/json"}});
const LOGO="https://media.20fit.id/wp-content/uploads/2026/05/Copy-of-new-logo-20fit-putih-3.png";
async function sendEmail(to:string,kind:string){
  const key=Deno.env.get("MAILTRAP_API_KEY"); if(!key){console.log("[DEV] fasting email "+kind+" -> "+to);return{sent:false};}
  const url=Deno.env.get("MAILTRAP_API_URL")||"https://send.api.mailtrap.io/api/send";
  const from=Deno.env.get("MAIL_FROM_EMAIL")||"no-reply@20fit.id";
  const open=kind==="open";
  const subject=open?"🍽️ Your eating window is open":"⏰ Your eating window is closing";
  const head=open?"Eating window is OPEN":"Eating window is CLOSING";
  const msg=open?"It's time to eat. Break your fast with a balanced, mindful meal and hit your calorie & protein targets.":"Your eating window is closing. Wrap up your last meal and get ready to start fasting until your next window.";
  const html="<div style='font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0A0908'><div style='background:#0A0908;padding:16px;border-radius:12px;text-align:center'><img src='"+LOGO+"' alt='20fit' style='height:30px'></div><h2 style='color:#C41101;margin:18px 0 6px'>"+head+"</h2><p style='line-height:1.6;font-size:15px'>"+msg+"</p><p style='font-size:13px;color:#888'>You are receiving this because you turned on Intermittent Fasting reminders in your 20fit Health Profile. You can turn them off anytime in the app.</p></div>";
  const r=await fetch(url,{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({from:{email:from,name:"20fit"},to:[{email:to}],subject,html,category:"FASTING"})});
  if(!r.ok)return{sent:false,error:"Mailtrap "+r.status+": "+(await r.text()).slice(0,200)};
  return{sent:true};
}
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
  try{
    const sb=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    let b:any={}; try{b=await req.json();}catch(e){}
    if(b.action==="test"){ if(!b.email)return json({error:"email wajib"},400); const r=await sendEmail(b.email,b.kind==="close"?"close":"open"); return json({ok:true,test:r}); }
    const WINDOW=14;
    const now=new Date(); const utcMin=now.getUTCHours()*60+now.getUTCMinutes(); const wibMin=(utcMin+420)%1440;
    const wibDate=new Date(now.getTime()+420*60000).toISOString().slice(0,10);
    const q=await sb.from("my20fit_fasting").select("*").eq("notify_email",true);
    const rows=q.data||[]; let sent=0; const log:string[]=[];
    for(const row of rows){
      if(!row.email||!row.start_time)continue;
      const p=String(row.start_time).split(":"); const openMin=(+p[0])*60+(+p[1]); const eat=(row.eat_hours||8); if(eat>=24)continue; const closeMin=(openMin+eat*60)%1440;
      const dOpen=((wibMin-openMin)%1440+1440)%1440; const dClose=((wibMin-closeMin)%1440+1440)%1440;
      if(dOpen<WINDOW && row.last_open_date!==wibDate){ const r=await sendEmail(row.email,"open"); if(r.sent){sent++;} await sb.from("my20fit_fasting").update({last_open_date:wibDate}).eq("auth_user_id",row.auth_user_id); log.push(row.email+":open"); }
      else if(dClose<WINDOW && row.last_close_date!==wibDate){ const r=await sendEmail(row.email,"close"); if(r.sent){sent++;} await sb.from("my20fit_fasting").update({last_close_date:wibDate}).eq("auth_user_id",row.auth_user_id); log.push(row.email+":close"); }
    }
    return json({ok:true,checked:rows.length,sent,wibMin,wibDate,log});
  }catch(e){return json({error:String((e&&(e as any).message)||e)},500);}
});
