// =============================================================
//  tour.js — Walkthrough per-halaman (muncul sekali per user)
//  - TIGA tur terpisah, di-scope KETAT per halaman:
//      dashboard.html -> "home"     (flag: tour_home_v1)
//      medical.html   -> "medical"  (flag: tour_medical_v1)
//      calories.html  -> "calories" (flag: tour_calories_v1)
//  - Deteksi halaman dari basename location.pathname. Kalau tak cocok,
//    TIDAK melakukan apa-apa (Medical tak akan pernah jalan dari Home, dst).
//  - Bilingual via window.L / I18N (helper t()).
//  - Sorot elemen target per langkah (aman kalau elemen tak ada -> skip sorot,
//    tooltip tetap muncul). Selesai/skip -> set flag halaman itu.
//  - window.startTour() memutar ulang tur halaman SAAT INI (dipakai dari Profil;
//    kalau halaman tak punya tur, fallback ke tur "home").
// =============================================================
(function () {
  const t = (o) => (window.L ? window.L(o) : (o.en || ""));

  const ICON = {
    chart:'<path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="8"/><rect x="12" y="6" width="3" height="12"/><rect x="17" y="13" width="3" height="5"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    medical:'<path d="M11 2a2 2 0 0 0-2 2v1a2 2 0 0 0-2 2v3a6 6 0 0 0 12 0V7a2 2 0 0 0-2-2V4a2 2 0 0 0-2-2"/><circle cx="20" cy="10" r="2"/>',
    cam:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    globe:'<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    trend:'<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>'
  };

  // ---- Definisi tiga tur ----
  const TOURS = {
    home: {
      flag: "tour_home_v1",
      steps: [
        {ic:"chart", sel:".trk-cust",
          title:{en:"Your Home is customizable now",id:"Home kamu sekarang bisa disesuaikan"},
          body:{en:"Tap Customize to add, remove and reorder your widgets — Hydration, Sleep, Fasting, Photo and more.",id:"Tap Customize untuk menambah, menghapus, dan mengatur urutan widget — Hydration, Sleep, Fasting, Photo, dan lainnya."}},
        {ic:"calendar", sel:"#locRow",
          title:{en:"Book directly from Home",id:"Book langsung dari Home"},
          body:{en:"You can now book your session right here on my.20fit.id — pick a location or a personal coach/doctor without leaving the app.",id:"Sekarang kamu bisa book sesi langsung di my.20fit.id — pilih lokasi atau coach/dokter personal tanpa keluar aplikasi."}}
      ]
    },
    medical: {
      flag: "tour_medical_v1",
      steps: [
        {ic:"cam", sel:".card.up",
          title:{en:"Upload your check-up",id:"Upload hasil check-up"},
          body:{en:"Snap or upload your MCU (PDF/JPG/PNG) from any facility — it's analysed automatically.",id:"Foto atau upload MCU kamu (PDF/JPG/PNG) dari fasilitas mana pun — langsung dianalisis otomatis."}},
        {ic:"medical", sel:"#result",
          title:{en:"AI analysis",id:"Analisis AI"},
          body:{en:"AI explains your results, flags what needs attention, and gives you eating & exercise plans.",id:"AI menjelaskan hasilmu, menandai yang perlu perhatian, plus kasih rencana makan & olahraga."}},
        {ic:"chart", sel:"#mcuHistoryCard",
          title:{en:"Your history",id:"Riwayat kamu"},
          body:{en:"Every check-up is saved here so you can compare your results over time.",id:"Setiap check-up tersimpan di sini biar kamu bisa membandingkan hasil dari waktu ke waktu."}},
        {ic:"globe", sel:null,
          title:{en:"Instant translation",id:"Terjemahan instan"},
          body:{en:"Read your results in English or Indonesian — switch anytime. Lab numbers stay unchanged.",id:"Baca hasilmu dalam Bahasa Inggris atau Indonesia — ganti kapan saja. Angka lab tidak diubah."}}
      ]
    },
    calories: {
      flag: "tour_calories_v1",
      steps: [
        {ic:"flame", sel:"#menuRecCard",
          title:{en:"New diet menus with real photos",id:"Menu diet baru dengan foto asli"},
          body:{en:"Browse diet menus with real food photos, recommended from your remaining macros today.",id:"Jelajahi menu diet dengan foto makanan asli, direkomendasikan dari sisa makro kamu hari ini."}},
        {ic:"trend", sel:"#foodSummary",
          title:{en:"Today's Food Summary",id:"Ringkasan Makan Hari Ini"},
          body:{en:"A new Health Meter scores your day and gives nutrient-gap suggestions on what to add.",id:"Health Meter baru menilai harimu dan memberi saran nutrisi yang masih kurang untuk ditambah."}}
      ]
    }
  };

  // ---- Pemetaan basename halaman -> kunci tur (SCOPE KETAT) ----
  const PAGE_MAP = {
    "": "home",
    "dashboard.html": "home",
    "medical.html": "medical",
    "calories.html": "calories"
  };
  function currentTourKey(){
    const page = (location.pathname.split("/").pop() || "").toLowerCase();
    return PAGE_MAP[page] || null;
  }

  let uid = "";
  const keyFor = (flag) => flag + (uid ? "_" + uid : "");

  let STEPS = [], i = 0, activeFlag = "";

  function injectCSS(){
    if(document.getElementById("tourcss"))return;
    const s=document.createElement("style");s.id="tourcss";
    s.textContent=`
      .tour-ov{position:fixed;inset:0;background:rgba(10,9,8,.62);z-index:9000;backdrop-filter:blur(2px)}
      .tour-hi{position:relative;z-index:9001;outline:3px solid #C41101;outline-offset:3px;border-radius:12px;animation:tpulse 1.2s infinite}
      @keyframes tpulse{0%,100%{box-shadow:0 0 0 0 rgba(196,17,1,.35)}50%{box-shadow:0 0 0 8px rgba(196,17,1,.18)}}
      .tour-card{position:fixed;left:50%;bottom:calc(88px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:#fff;border-radius:20px;max-width:340px;width:calc(100% - 32px);padding:24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4);z-index:9002;animation:tpop .25s ease}
      @keyframes tpop{from{transform:translateX(-50%) translateY(12px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
      .tour-ic{width:74px;height:74px;border-radius:20px;background:rgba(196,17,1,.10);display:flex;align-items:center;justify-content:center;margin:0 auto 14px}
      .tour-ic svg{width:36px;height:36px;fill:none;stroke:#C41101;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
      .tour-step{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9E8E7A;font-weight:700}
      .tour-card h3{font-size:20px;font-weight:900;margin:6px 0 8px;color:#0A0908}
      .tour-card p{color:#6b6256;font-size:14px;line-height:1.55;margin:0 0 16px}
      .tour-dots{display:flex;gap:5px;justify-content:center;margin-bottom:16px;flex-wrap:wrap}
      .tour-dots i{width:7px;height:7px;border-radius:50%;background:#E1D9CD}
      .tour-dots i.on{background:#C41101;width:18px;border-radius:4px}
      .tour-btns{display:flex;gap:10px}
      .tour-btns button{flex:1;padding:12px;border-radius:11px;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit}
      .tour-skip{background:#F0EDE5;border:0;color:#8A7C68}
      .tour-next{background:#C41101;border:0;color:#fff}
    `;
    document.head.appendChild(s);
  }

  function clearHi(){
    document.querySelectorAll(".tour-hi").forEach(e=>e.classList.remove("tour-hi"));
  }
  function highlight(step){
    clearHi();
    if(!step.sel) return;                 // langkah tanpa target -> tooltip saja
    const el=document.querySelector(step.sel);
    if(!el) return;                       // target tak ada -> jangan patahkan halaman
    el.classList.add("tour-hi");
    try{ el.scrollIntoView({block:"center",behavior:"smooth"}); }catch(e){}
  }

  function render(){
    const s=STEPS[i];
    document.getElementById("tIc").innerHTML='<svg viewBox="0 0 24 24">'+ICON[s.ic]+'</svg>';
    document.getElementById("tStep").textContent=(i+1)+" / "+STEPS.length;
    document.getElementById("tTitle").textContent=t(s.title);
    document.getElementById("tBody").textContent=t(s.body);
    document.getElementById("tDots").innerHTML=STEPS.map((_,k)=>'<i class="'+(k===i?"on":"")+'"></i>').join("");
    document.getElementById("tNext").textContent = (i===STEPS.length-1) ? t({en:"Got it!",id:"Mengerti!"}) : t({en:"Next",id:"Lanjut"});
    document.getElementById("tSkip").textContent = t({en:"Skip",id:"Lewati"});
    highlight(s);
  }
  function close(){
    clearHi();
    const ov=document.getElementById("tourOv"); if(ov)ov.remove();
    const card=document.getElementById("tourCard"); if(card)card.remove();
    try{ if(activeFlag) localStorage.setItem(keyFor(activeFlag),"1"); }catch(e){}
  }
  function next(){ if(i>=STEPS.length-1){close();return;} i++; render(); }

  function open(key){
    const tour = TOURS[key];
    if(!tour) return;                     // tak ada tur untuk kunci ini
    injectCSS();
    STEPS = tour.steps;
    activeFlag = tour.flag;
    i=0;
    // Backdrop gelap (spotlight) — elemen ter-highlight diangkat di atasnya via z-index.
    const ov=document.createElement("div");ov.className="tour-ov";ov.id="tourOv";
    document.body.appendChild(ov);
    // Kartu tooltip terpisah, selalu di atas backdrop & elemen ter-highlight.
    const card=document.createElement("div");card.className="tour-card";card.id="tourCard";
    card.innerHTML=
      '<div class="tour-ic" id="tIc"></div>'+
      '<div class="tour-step" id="tStep"></div>'+
      '<h3 id="tTitle"></h3><p id="tBody"></p>'+
      '<div class="tour-dots" id="tDots"></div>'+
      '<div class="tour-btns"><button class="tour-skip" id="tSkip" onclick="__tourClose()"></button>'+
      '<button class="tour-next" id="tNext" onclick="__tourNext()"></button></div>';
    document.body.appendChild(card);
    render();
  }

  window.__tourNext = next;
  window.__tourClose = close;
  // Putar ulang manual: tur halaman saat ini; kalau halaman tak punya tur, fallback "home".
  window.startTour = function(){ open(currentTourKey() || "home"); };

  // Auto-show sekali per USER per device, HANYA di halaman yang cocok.
  async function maybeAuto(){
    const key = currentTourKey();
    if(!key) return;                      // halaman tak punya tur -> diam
    const tour = TOURS[key];
    try{ if(window.Auth&&Auth.getUser){ const u=await Auth.getUser(); if(u&&u.id) uid=u.id; } }catch(e){}
    let done=false; try{ done=localStorage.getItem(keyFor(tour.flag))==="1"; }catch(e){}
    if(done) return;
    setTimeout(()=>open(key), 700);       // kasih waktu nav & data ke-load
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",maybeAuto); else maybeAuto();
})();
