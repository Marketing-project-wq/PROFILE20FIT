// =============================================================
//  achievements.js — definisi lencana + popup "Congratulations"
//  Dipakai di dashboard (popup) & progress (grid lencana).
//  Sumber tunggal biar konsisten. Butuh i18n.js (window.L) lebih dulu.
// =============================================================
(function () {
  const DEFS = [
    { id:"firstcheckin", em:"🌱", t:{en:"First check-in",id:"Check-in pertama"}, s:{en:"Tracked a day",id:"Catat 1 hari"},        d:{en:"You logged your first day. The journey begins!",id:"Kamu mencatat hari pertamamu. Perjalanan dimulai!"}, cond:s=>s.tracked>=1 },
    { id:"streak3",      em:"🔥", t:{en:"3-day streak",id:"Beruntun 3 hari"},   s:{en:"Keep it up!",id:"Pertahankan!"},           d:{en:"3 days in a row — you're building a habit!",id:"3 hari berturut — kamu lagi bangun kebiasaan!"}, cond:s=>s.streak>=3 },
    { id:"streak7",      em:"🏆", t:{en:"Full week",id:"Satu minggu penuh"},    s:{en:"7 days in a row",id:"7 hari berturut"},    d:{en:"A full week of tracking. Incredible consistency!",id:"Satu minggu penuh mencatat. Konsistensi luar biasa!"}, cond:s=>s.streak>=7 },
    { id:"hydrated",     em:"💧", t:{en:"Hydrated",id:"Terhidrasi"},            s:{en:"8 glasses in a day",id:"8 gelas sehari"}, d:{en:"You hit 8 glasses of water. Well hydrated!",id:"Kamu capai 8 gelas air. Terhidrasi dengan baik!"}, cond:s=>s.anyWater8 },
    { id:"rested",       em:"😴", t:{en:"Well rested",id:"Istirahat cukup"},    s:{en:"7h+ sleep",id:"Tidur 7 jam+"},             d:{en:"7+ hours of sleep. Your body thanks you!",id:"Tidur 7 jam lebih. Tubuhmu berterima kasih!"}, cond:s=>s.anySleep7 },
    { id:"fasting",      em:"⏳", t:{en:"Fasting on",id:"Puasa aktif"},         s:{en:"Adopted a style",id:"Adopsi gaya puasa"}, d:{en:"You adopted an intermittent fasting style!",id:"Kamu mengadopsi gaya intermittent fasting!"}, cond:s=>s.hasFasting },
    { id:"mcu",          em:"🩺", t:{en:"Health checked",id:"Cek kesehatan"},   s:{en:"MCU analysed",id:"MCU dianalisa"},         d:{en:"Your medical check-up has been analysed!",id:"Medical check-up-mu sudah dianalisa!"}, cond:s=>s.hasMcu }
  ];

  function L(o){ return window.L ? window.L(o) : (o && o.en) || ""; }
  function seen(){ try{ return JSON.parse(localStorage.getItem("my20fit_ach_seen")||"[]"); }catch(e){ return []; } }
  function saveSeen(a){ try{ localStorage.setItem("my20fit_ach_seen", JSON.stringify(a)); }catch(e){} }

  function buildStats(days, extra){
    days = days || [];
    const isT = d => d.log && ((+d.log.water_glasses||0)>0 || (+d.log.sleep_hours||0)>0 || (d.cal||0)>0);
    const tracked = days.filter(isT).length;
    let streak = 0;
    for(let i=days.length-1;i>=0;i--){ if(isT(days[i])) streak++; else break; }
    const anyWater8 = days.some(d=>d.log && (+d.log.water_glasses||0)>=8);
    const anySleep7 = days.some(d=>d.log && (+d.log.sleep_hours||0)>=7);
    const base = { tracked, streak, anyWater8, anySleep7, hasFasting:false, hasMcu:false };
    return Object.assign(base, extra||{});
  }
  function earned(stats){ return DEFS.filter(x=>{ try{ return x.cond(stats); }catch(e){ return false; } }).map(x=>x.id); }

  // ---------- Popup "Congratulations" ----------
  let cssDone=false;
  function ensureCss(){
    if(cssDone) return; cssDone=true;
    const st=document.createElement("style");
    st.textContent=
      ".achpop-ov{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(10,9,8,.55);backdrop-filter:blur(3px);opacity:0;transition:opacity .25s}"+
      ".achpop-ov.on{opacity:1}"+
      ".achpop{position:relative;max-width:340px;width:100%;background:#fff;border-radius:22px;padding:30px 24px 24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.35);transform:scale(.8);transition:transform .35s cubic-bezier(.2,1.3,.4,1);overflow:hidden}"+
      ".achpop-ov.on .achpop{transform:scale(1)}"+
      ".achpop-badge{width:92px;height:92px;margin:0 auto 14px;border-radius:50%;background:radial-gradient(circle at 50% 35%,#fff5e6,#ffe1c2);display:flex;align-items:center;justify-content:center;font-size:46px;box-shadow:0 6px 18px rgba(196,17,1,.18);animation:achpPop .5s .15s both}"+
      "@keyframes achpPop{0%{transform:scale(.3) rotate(-20deg);opacity:0}60%{transform:scale(1.15) rotate(6deg)}100%{transform:scale(1) rotate(0);opacity:1}}"+
      ".achpop-h{font-family:'Anton',sans-serif;font-size:22px;letter-spacing:.5px;color:#C41101;text-transform:uppercase;margin:0 0 4px}"+
      ".achpop-t{font-weight:900;font-size:18px;color:#0A0908;margin:2px 0}"+
      ".achpop-d{color:#7a7268;font-size:14px;line-height:1.5;margin:6px 0 18px}"+
      ".achpop-btn{background:#C41101;color:#fff;border:0;border-radius:12px;padding:13px 26px;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit;width:100%}"+
      ".achpop-cf{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;opacity:.9;animation:achpFall linear forwards}"+
      "@keyframes achpFall{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(360px) rotate(540deg);opacity:0}}";
    document.head.appendChild(st);
  }
  function confetti(card){
    const cols=["#C41101","#C87000","#2A7A4F","#3b82f6","#f5c518","#e8619d"];
    for(let i=0;i<16;i++){
      const p=document.createElement("div"); p.className="achpop-cf";
      p.style.left=(6+Math.random()*88)+"%";
      p.style.background=cols[i%cols.length];
      p.style.animationDuration=(1.1+Math.random()*1.1)+"s";
      p.style.animationDelay=(Math.random()*.5)+"s";
      card.appendChild(p);
    }
  }
  let queue=[], showing=false;
  function render(def){
    ensureCss();
    const ov=document.createElement("div"); ov.className="achpop-ov";
    const card=document.createElement("div"); card.className="achpop";
    card.innerHTML=
      "<div class='achpop-badge'>"+def.em+"</div>"+
      "<div class='achpop-h'>"+L({en:"Congratulations!",id:"Selamat! 🎉"})+"</div>"+
      "<div class='achpop-t'>"+L(def.t)+"</div>"+
      "<div class='achpop-d'>"+L(def.d)+"</div>"+
      "<button class='achpop-btn'>"+L({en:"Awesome! 🎉",id:"Mantap! 🎉"})+"</button>";
    ov.appendChild(card); document.body.appendChild(ov);
    confetti(card);
    requestAnimationFrame(()=>ov.classList.add("on"));
    let closed=false;
    const close=()=>{ if(closed)return; closed=true; ov.classList.remove("on"); setTimeout(()=>{ ov.remove(); showing=false; next(); }, 300); };
    card.querySelector(".achpop-btn").addEventListener("click",close);
    ov.addEventListener("click",e=>{ if(e.target===ov) close(); });
    setTimeout(close, 6000);
  }
  function next(){ if(showing||!queue.length)return; showing=true; render(queue.shift()); }
  function celebrate(def){ queue.push(def); next(); }

  // Cek data -> rayakan lencana yang BARU keraih (bukan yang lama)
  function check(opts){
    opts=opts||{};
    const stats=buildStats(opts.days, { hasFasting: !!opts.hasFasting, hasMcu: !!opts.hasMcu });
    const got=earned(stats);
    const sn=seen();
    const fresh=got.filter(id=>sn.indexOf(id)===-1);
    saveSeen(Array.from(new Set(sn.concat(got))));
    // Pertama kali dijalankan di device ini: tandai semua yang sudah ada
    // sebagai "seen" TANPA popup (biar user lama gak dibanjiri notif sekaligus)
    if(!localStorage.getItem("my20fit_ach_init")){ localStorage.setItem("my20fit_ach_init","1"); return []; }
    fresh.forEach(id=>{ const def=DEFS.find(d=>d.id===id); if(def) celebrate(def); });
    return fresh;
  }

  window.Ach = { DEFS, buildStats, earned, check, celebrate };
})();
