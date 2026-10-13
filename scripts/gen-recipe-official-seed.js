// Generate db/seed-recipe-official.sql dari katalog statik js/recipes.js (120 resep).
// SEKALI JALAN untuk mengisi tabel my20fit_recipe_official (migration 034). Idempoten:
// pakai INSERT ... ON CONFLICT (id) DO NOTHING -> aman dijalankan ulang, tak menimpa
// edit admin yang sudah ada di DB.
//
//   node scripts/gen-recipe-official-seed.js > db/seed-recipe-official.sql
//
'use strict';
var path = require('path');
var LIST = (require(path.join('..', 'js', 'recipes.js')).LIST) || [];

function q(v) {
  if (v == null) return 'NULL';
  return "'" + String(v).replace(/'/g, "''") + "'";
}
function num(v) { return (typeof v === 'number' && isFinite(v)) ? String(v) : 'NULL'; }
function arr(a) {
  if (!Array.isArray(a) || !a.length) return "'{}'::text[]";
  return 'ARRAY[' + a.map(function (x) { return q(x); }).join(',') + ']::text[]';
}

var cols = ['id', 'name_en', 'name_id', 'kcal', 'p', 'c', 'f', 'diet_types', 'category', 'q',
  'emoji', 'tint', 'ingredients_en', 'ingredients_id', 'steps_en', 'steps_id', 'servings',
  'cook_minutes', 'prep_minutes', 'equipment', 'prep_note', 'common_mistake', 'sort_order'];

var out = [];
out.push('-- Seed my20fit_recipe_official dari js/recipes.js — DIGENERATE oleh');
out.push('-- scripts/gen-recipe-official-seed.js. Jangan edit tangan; regen kalо katalog statik berubah.');
out.push('-- ON CONFLICT DO NOTHING: aman diulang, tak menimpa edit admin.');
out.push('');

LIST.forEach(function (r, i) {
  var nm = r.nm || {}, ing = r.ing || {}, st = r.steps || {};
  var vals = [
    q(r.id), q(nm.en), q(nm.id), num(r.kcal), num(r.p), num(r.c), num(r.f),
    arr(r.types), q(r.cat), q(r.q), q(r.emoji), q(r.tint),
    q(ing.en), q(ing.id), q(st.en), q(st.id),
    num(r.servings), num(r.cookMinutes), num(r.prepMinutes),
    q(r.equipment), q(r.prepNote), q(r.commonMistake), num(i),
  ];
  out.push('insert into public.my20fit_recipe_official (' + cols.join(', ') + ')');
  out.push('values (' + vals.join(', ') + ')');
  out.push('on conflict (id) do nothing;');
  out.push('');
});

process.stdout.write(out.join('\n'));
