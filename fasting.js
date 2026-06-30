// =============================================================
//  fasting.js — Intermittent Fasting (dipakai di calories & dashboard)
//  - Daftar style, pilih/adopsi, hitung status puasa/makan + countdown
//  - Pilihan disimpan di localStorage "my20fit_if" = {id, start "HH:MM"}
// =============================================================
(function () {
  const STYLES = [
    {id:"16:8", fast:16, eat:8,  name:{en:"16:8 · Leangains",id:"16:8 · Leangains"},
      desc:{en:"Fast 16h, eat within 8h. The most popular & sustainable.",id:"Puasa 16 jam, makan dalam 8 jam. Paling populer & gampang dijalani."}},
    {id:"14:10",fast:14, eat:10, name:{en:"14:10 · Beginner",id:"14:10 · Pemula"},
      desc:{en:"Fast 14h, eat 10h. Gentle way to start.",id:"Puasa 14 jam, makan 10 jam. Cocok buat yang baru mulai."}},
    {id:"18:6", fast:18, eat:6,  name:{en:"18:6",id:"18:6"},
      desc:{en:"Fast 18h, eat 6h. For those already used to it.",id:"Puasa 18 jam, makan 6 jam. Buat yang udah terbiasa."}},
    {id:"20:4", fast:20, eat:4,  name:{en:"20:4 · Warrior",id:"20:4 · Warrior"},
      desc:{en:"Fast 20h, eat in a 4h window. Advanced.",id:"Puasa 20 jam, makan dalam jendela 4 jam. Tingkat lanjut."}},
    {id:"omad", fast:23, eat:1,  name:{en:"OMAD · One Meal",id:"OMAD · Sekali Makan"},
      desc:{en:"One meal a day. For the experienced.",id:"Satu kali makan sehari. Buat yang sudah mahir."}},
    {id:"5:2",  fast:0,  eat:24, weekly:true, name:{en:"5:2",id:"5:2"},
      desc:{en:"Eat normally 5 days, low-calorie (~500–600 kcal) on 2 days.",id:"Makan normal 5 hari, rendah kalori (~500–600 kkal) di 2 hari."}}
  ];
  function fmt(min){min=((min%1440)+1440)%1440;return String(Math.floor(min/60)).padStart(2,"0")+":"+String(min%60).padStart(2,"0");}
  function styleById(id){return STYLES.find(s=>s.id===id)||null;}
  // Saran jumlah makan dalam jendela (buat bagi kalori per makan)
  function mealsFor(id){return ({"14:10":3,"16:8":3,"18:6":2,"20:4":2,"omad":1,"5:2":3})[id]||3;}
  // Penyesuaian target kalori total per style (style lebih ketat = defisit lebih besar)
  function factor(id){return ({"14:10":0.97,"16:8":0.90,"18:6":0.88,"20:4":0.85,"omad":0.82,"5:2":1})[id]||1;}
  function adjustGoal(base){const c=get();if(!c)return base;return Math.max(1200,Math.round(base*factor(c.id)/10)*10);}
  function get(){try{return JSON.parse(localStorage.getItem("my20fit_if")||"null");}catch(e){return null;}}
  function set(o){localStorage.setItem("my20fit_if",JSON.stringify(o));}
  function clear(){localStorage.removeItem("my20fit_if");}
  function state(){
    const c=get(); if(!c)return null;
    const s=styleById(c.id); if(!s)return null;
    if(s.weekly)return {style:s,chosen:c,weekly:true};
    const [sh,sm]=String(c.start||"12:00").split(":").map(Number);
    const startM=sh*60+sm, endM=startM+s.eat*60;
    const now=new Date(); const mins=now.getHours()*60+now.getMinutes();
    const a=((startM%1440)+1440)%1440, span=s.eat*60;
    let diff=((mins-a)%1440+1440)%1440;          // menit sejak window mulai
    const eating = diff < span;
    let until = eating ? (span-diff) : (1440-diff);
    if(until<=0)until=1;
    return {style:s,chosen:c,eating:eating,untilMin:until,window:{start:fmt(startM),end:fmt(endM)}};
  }
  // ---------- Pengingat / notifikasi ----------
  const LOGO="https://media.20fit.id/wp-content/uploads/2026/05/Copy-of-new-logo-20fit-putih-3.png";
  let timers=[];
  function tt(o){ return (window.L?window.L(o):o.en); }
  function notifEnabled(){ try{return localStorage.getItem("if_notify")==="1";}catch(e){return false;} }
  function setNotif(v){ try{localStorage.setItem("if_notify",v?"1":"0");}catch(e){} }
  function fire(title,body){
    try{
      const now=Date.now(); const last=+(localStorage.getItem("if_lastfire")||0);
      if(now-last<90000)return; localStorage.setItem("if_lastfire",String(now));
      const opt={body:body,icon:LOGO,badge:LOGO,tag:"if-meal"};
      if(navigator.serviceWorker && navigator.serviceWorker.ready){
        navigator.serviceWorker.ready.then(function(r){r.showNotification(title,opt);}).catch(function(){ new Notification(title,opt); });
      } else { new Notification(title,opt); }
    }catch(e){}
  }
  function arm(){
    timers.forEach(clearTimeout); timers=[];
    if(!notifEnabled())return;
    if(!("Notification" in window) || Notification.permission!=="granted")return;
    const st=state(); if(!st||st.weekly)return;
    const eatingNow=st.eating;
    const ms=Math.max(1000, st.untilMin*60*1000 + 2000);
    const t=setTimeout(function(){
      if(eatingNow) fire("⏰ "+tt({en:"Eating window closed",id:"Jendela makan ditutup"}), tt({en:"Time to start fasting — see you next window!",id:"Waktunya mulai puasa — sampai jendela berikutnya!"}));
      else fire("🍽️ "+tt({en:"Eating window is open!",id:"Jendela makan dibuka!"}), tt({en:"You can eat now. Eat mindfully 💪",id:"Kamu boleh makan sekarang. Makan dengan sadar ya 💪"}));
      arm();
    }, ms);
    timers.push(t);
  }
  async function enableReminders(){
    if(!("Notification" in window))return false;
    let p=Notification.permission;
    if(p==="default"){ try{ p=await Notification.requestPermission(); }catch(e){ p=Notification.permission; } }
    if(p!=="granted")return false;
    setNotif(true); arm(); return true;
  }
  function disableReminders(){ setNotif(false); timers.forEach(clearTimeout); timers=[]; }

  // daftar service worker + arm saat load
  try{ if("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(function(){}); }catch(e){}
  setTimeout(function(){ if(notifEnabled()) arm(); }, 1500);

  window.Fasting = { STYLES, styleById, mealsFor, factor, adjustGoal, get, set, clear, state, fmt, notifEnabled, enableReminders, disableReminders, armReminders:arm };
})();
