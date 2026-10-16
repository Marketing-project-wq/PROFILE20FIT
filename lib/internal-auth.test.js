// Jalankan: node --test lib/
const test = require("node:test");
const assert = require("node:assert");
const { makeInternalAuth } = require("./internal-auth");

function run(guard, authorization) {
  const req = { headers: authorization ? { authorization: authorization } : {} };
  const out = { status: 200, next: false };
  const res = { status: function (s) { out.status = s; return { json: function () {} }; } };
  guard(req, res, function () { out.next = true; });
  return { status: out.status, next: out.next, caller: req.caller };
}

test("valid token -> next() with caller", function () {
  const r = run(makeInternalAuth("portal:abc123,other:zzz999"), "Bearer abc123");
  assert.deepStrictEqual(r, { status: 200, next: true, caller: "portal" });
});

test("wrong token, wrong length, missing header, no Bearer -> 401", function () {
  const g = makeInternalAuth("portal:abc123");
  for (const h of ["Bearer abc124", "Bearer abc", "", "abc123"]) {
    const r = run(g, h);
    assert.strictEqual(r.status, 401, h);
    assert.strictEqual(r.next, false, h);
  }
});

test("INTERNAL_TOKENS unset or malformed -> everything 401", function () {
  for (const raw of [undefined, "", "notoken", ":abc123", "portal:"]) {
    assert.strictEqual(run(makeInternalAuth(raw), "Bearer abc123").status, 401, String(raw));
    assert.strictEqual(run(makeInternalAuth(raw), "Bearer ").status, 401, String(raw));
  }
});
