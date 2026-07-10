// =============================================================
//  tour.js — Walkthrough perkenalan (muncul sekali pertama kali)
//  - Bilingual via window.L / I18N
//  - Sorot tombol bottom-nav per langkah
//  - Selesai/skip -> localStorage "tour_done_v1"
//  - window.startTour() untuk putar ulang (dipakai dari Profil)
// =============================================================
(function () {
  const KEY = "tour_done_v1";
  let uid = "";
  const keyFor = () => KEY + (uid ? "_" + uid : "");
  const t = (o) => (window.L ? window.L(o) : (o.en || ""));

  const ICON = {
    wave:'<path d="M12 21a9 9 0 1 0-9-9"/><path d="M12 7v5l3 2"/>',
    chart:'<path d="M3 3v18h18"/><rect x="7" y="10" width="3" height="8"/><rect x="12" y="6" width="3" height="12"/><rect x="17" y="13" width="3" height="5"/>',
    weather:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19"/>',
    lungs:'<path d="M12 4v8"/><path d="M8 12c0 4-1 6-4 6-1 0-1-3-1-6 0-2 1-4 3-4 1 0 2 1 2 4z"/><path d="M16 12c0 4 1 6 4 6 1 0 1-3 1-6 0-2-1-4-3-4-1 0-2 1-2 4z"/>',
    moon:'<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
    check:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    medical:'<path d="M11 2a2 2 0 0 0-2 2v1a2 2 0 0 0-2 2v3a6 6 0 0 0 12 0V7a2 2 0 0 0-2-2V4a2 2 0 0 0-2-2"/><circle cx="20" cy="10" r="2"/>',
    flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    cam:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    trend:'<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>'
  };

  const STEPS = [
    {ic:"wave", nav:0, title:{en:"Welcome to 20FIT Health Profile!",id:"Selamat datang di 20FIT Health Profile!"},
      body:{en:"A quick tour to show you around. It only takes 30 seconds.",id:"Tur singkat buat kenalin fitur-fiturnya. Cuma 30 detik kok."}},
    {ic:"chart", nav:0, title:{en:"Your Stats",id:"Statistik Kamu"},
      body:{en:"BMI, weight and height are filled automatically from your profile.",id:"BMI, berat, dan tinggi terisi otomatis dari profil kamu."}},
    {ic:"weather", nav:0, title:{en:"Live Weather & Air Quality",id:"Cuaca & Kualitas Udara Live"},
      body:{en:"Real-time weather and AQI for your location — we tell you if it's good to train outdoors.",id:"Cuaca & AQI real-time sesuai lokasimu — kami kasih tau enaknya latihan di luar atau dalam."}},
    {ic:"lungs", nav:0, title:{en:"Breathing Exercise",id:"Latihan Pernapasan"},
      body:{en:"Guided breathing (4-7-8, Box, Relax) to calm down or recover.",id:"Pernapasan berpandu (4-7-8, Box, Rileks) buat tenang atau pemulihan."}},
    {ic:"moon", nav:0, title:{en:"Sleep & Water",id:"Tidur & Air Minum"},
      body:{en:"Log your bedtime & wake time, and tap glasses to track water.",id:"Catat jam tidur & bangun, dan ketuk gelas untuk lacak minum air."}},
    {ic:"check", nav:0, title:{en:"Daily Checklist",id:"Checklist Harian"},
      body:{en:"Healthy habits to tick off — the list changes every day & week.",id:"Kebiasaan sehat buat dicentang — daftarnya beda tiap hari & minggu."}},
    {ic:"medical", nav:1, title:{en:"Medical Record",id:"Rekam Medis"},
      body:{en:"Upload your check-up (PDF/photo). AI explains it, flags what needs attention, and gives eating + exercise plans.",id:"Upload hasil check-up (PDF/foto). AI menjelaskan, menandai yang perlu perhatian, plus kasih rencana makan & olahraga."}},
    {ic:"flame", nav:3, title:{en:"Calorie Tracker",id:"Pelacak Kalori"},
      body:{en:"Your daily calorie target is auto-calculated. Add food manually or scan it with your camera.",id:"Target kalori harianmu dihitung otomatis. Tambah makanan manual atau scan pakai kamera."}},
    {ic:"cam", nav:-1, title:{en:"Scan Food",id:"Scan Makanan"},
      body:{en:"Tap the red Scan button anytime to snap your meal and get instant calories.",id:"Ketuk tombol Scan merah kapan saja buat foto makananmu dan dapat estimasi kalori."}},
    {ic:"trend", nav:2, title:{en:"Progress",id:"Progress"},
      body:{en:"Weekly stats & achievements — coming soon!",id:"Statistik mingguan & achievement — segera hadir!"}},
    {ic:"user", nav:4, title:{en:"Profile & Language",id:"Profil & Bahasa"},
      body:{en:"Edit your details and log out here. Switch EN/ID anytime with the button on the top-right.",id:"Ubah data & logout di sini. Ganti EN/ID kapan saja lewat tombol di kanan atas."}}
  ];

  let i = 0, navEl = null;

  function injectCSS(){
    if(document.getElementById("tourcss"))return;
    const s=document.createElement("style");s.id="tourcss";
    s.textContent=`
      .tour-ov{position:fixed;inset:0;background:rgba(10,9,8,.62);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(2px)}
      .tour-card{background:#fff;border-radius:20px;max-width:340px;width:100%;padding:24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4);animation:tpop .25s ease}
      @keyframes tpop{from{transform:scale(.92);opacity:0}to{transform:scale(1);opacity:1}}
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
      .bnav a.tour-hi{background:rgba(196,17,1,.12);outline:2px solid #C41101;outline-offset:-2px;border-radius:10px}
      .scanfab.tour-hi{animation:tpulse 1s infinite}
      @keyframes tpulse{0%,100%{box-shadow:0 6px 20px rgba(196,17,1,.45)}50%{box-shadow:0 0 0 10px rgba(196,17,1,.25)}}
    `;
    document.head.appendChild(s);
  }

  function clearHi(){
    document.querySelectorAll(".bnav a.tour-hi,.scanfab.tour-hi").forEach(e=>e.classList.remove("tour-hi"));
  }
  function highlight(step){
    clearHi();
    if(step.nav===-1){ const fab=document.querySelector(".scanfab"); if(fab)fab.classList.add("tour-hi"); return; }
    if(step.nav>=0){ const a=document.querySelectorAll(".bnav a")[step.nav]; if(a)a.classList.add("tour-hi"); }
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
    if(navEl)navEl.style.zIndex="";
    const ov=document.getElementById("tourOv"); if(ov)ov.remove();
    try{ localStorage.setItem(keyFor(),"1"); }catch(e){}
  }
  function next(){ if(i>=STEPS.length-1){close();return;} i++; render(); }

  function open(){
    injectCSS();
    i=0;
    navEl=document.querySelector(".bnav"); if(navEl)navEl.style.zIndex="101"; // angkat nav di atas overlay
    const ov=document.createElement("div");ov.className="tour-ov";ov.id="tourOv";
    ov.innerHTML='<div class="tour-card">'+
      '<div class="tour-ic" id="tIc"></div>'+
      '<div class="tour-step" id="tStep"></div>'+
      '<h3 id="tTitle"></h3><p id="tBody"></p>'+
      '<div class="tour-dots" id="tDots"></div>'+
      '<div class="tour-btns"><button class="tour-skip" id="tSkip" onclick="__tourClose()"></button>'+
      '<button class="tour-next" id="tNext" onclick="__tourNext()"></button></div></div>';
    document.body.appendChild(ov);
    render();
  }

  window.__tourNext = next;
  window.__tourClose = close;
  window.startTour = open; // putar ulang manual

  // Auto-show sekali per USER per device (device baru / user baru -> tampil lagi)
  async function maybeAuto(){
    const page=(location.pathname.split("/").pop()||"dashboard.html").toLowerCase();
    if(page!=="dashboard.html" && page!=="" ) return;
    try{ if(window.Auth&&Auth.getUser){ const u=await Auth.getUser(); if(u&&u.id) uid=u.id; } }catch(e){}
    let done=false; try{ done=localStorage.getItem(keyFor())==="1"; }catch(e){}
    if(done) return;
    setTimeout(open, 700); // kasih waktu nav & data ke-load
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",maybeAuto); else maybeAuto();
})();
