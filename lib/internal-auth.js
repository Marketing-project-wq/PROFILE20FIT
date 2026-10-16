// Guard /internal/*: hanya untuk panggilan antar-service di dalam project Railway, pakai service token.
// INTERNAL_TOKENS="portal:<hex>,<caller>:<hex>". Tidak di-set = semua ditolak (401).
const crypto = require("crypto");

function parseTokens(raw) {
  return String(raw || "").split(",").map(function (pair) {
    const i = pair.indexOf(":");
    if (i < 1) return null;
    return { caller: pair.slice(0, i).trim(), token: Buffer.from(pair.slice(i + 1).trim()) };
  }).filter(function (t) { return t && t.token.length; });
}

function makeInternalAuth(raw) {
  const tokens = parseTokens(raw);
  return function internalAuth(req, res, next) {
    const h = req.headers.authorization || "";
    const got = Buffer.from(h.startsWith("Bearer ") ? h.slice(7) : "");
    // Panjang dicek dulu: timingSafeEqual melempar error kalau panjangnya beda.
    const hit = tokens.find(function (t) { return t.token.length === got.length && crypto.timingSafeEqual(t.token, got); });
    if (!hit) return res.status(401).json({ ok: false, error: "unauthorized" });
    req.caller = hit.caller;
    next();
  };
}

module.exports = { makeInternalAuth };
