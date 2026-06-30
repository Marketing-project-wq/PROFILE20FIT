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
  window.Fasting = { STYLES, styleById, get, set, clear, state, fmt };
})();
