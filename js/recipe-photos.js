/* recipe-photos.js — utilitas foto resep (resolve, apply thumb, lazy load).
   TIDAK berisi data resep; hanya memanggil /api/foodphoto untuk mendapatkan URL foto. */
(function () {
  "use strict";
  var IMG_CACHE_KEY = "my20fit_foodimg_v8";
  function _imgCache(){ try { return JSON.parse(localStorage.getItem(IMG_CACHE_KEY) || "{}"); } catch(e){ return {}; } }
  function _saveImg(c){ try { localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(c)); } catch(e){} }
  function resolveImg(rec){
    if(!rec || !rec.id) return Promise.resolve(null);
    var c=_imgCache();
    if(c[rec.id]) return Promise.resolve(c[rec.id]);
    function done(url){ if(url){ c=_imgCache(); c[rec.id]=url; _saveImg(c); } return url||null; }
    var q = rec.pq || (rec.nm && rec.nm.en) || rec.q || "";
    var mdb = rec.q || "";
    var desc = (rec.ing && rec.ing.en) ? String(rec.ing.en).replace(/\n/g, ", ") : "";
    var tokP = (window.Auth && Auth.token) ? Promise.resolve(Auth.token()).catch(function(){return null;}) : Promise.resolve(null);
    return tokP.then(function(tok){
      var h = {}; if(tok) h["Authorization"] = "Bearer " + tok;
      return fetch("/api/foodphoto?id="+encodeURIComponent(rec.id)+"&q="+encodeURIComponent(q)+"&mdb="+encodeURIComponent(mdb)+"&desc="+encodeURIComponent(desc), { headers: h })
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(j){ return done(j && j.ok && j.url ? j.url : null); })
        .catch(function(){ return done(null); });
    }).catch(function(){ return done(null); });
  }
  function _setBg(el, url){ if(!el||!url) return; el.style.backgroundImage = "url('" + url + "')"; el.classList.add("has-photo"); el.textContent = ""; }
  function applyThumb(el, rec){
    if(!el || !rec) return;
    resolveImg(rec).then(function(u){ _setBg(el, u); }).catch(function(){});
  }
  var _io = null, _ioMap = (typeof WeakMap !== "undefined") ? new WeakMap() : null;
  function _ensureIO(){
    if(_io || typeof IntersectionObserver === "undefined") return _io;
    _io = new IntersectionObserver(function(ents){
      ents.forEach(function(en){
        if(en.isIntersecting){ var el=en.target; _io.unobserve(el); var rec=_ioMap && _ioMap.get(el); if(rec) applyThumb(el, rec); }
      });
    }, { rootMargin: "200px" });
    return _io;
  }
  function applyThumbLazy(el, rec){
    if(!el || !rec) return;
    var io = _ensureIO();
    if(!io || !_ioMap){ applyThumb(el, rec); return; }
    _ioMap.set(el, rec); io.observe(el);
  }
  window.RecipePhotos = { resolveImg: resolveImg, applyThumb: applyThumb, applyThumbLazy: applyThumbLazy };
})();
