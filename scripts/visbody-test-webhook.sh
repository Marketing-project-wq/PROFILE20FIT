#!/usr/bin/env bash
# Uji jalur webhook Visbody TANPA timbangan dan TANPA Visbody.
#
# Gunanya: membuktikan VISBODY_WEBHOOK_SECRET di Railway sudah benar dan route-nya
# hidup, SEBELUM melibatkan tim Visbody. Signature dihitung persis seperti yang
# diharapkan server (HMAC-SHA256 atas "<timestamp>.<raw body>").
#
# PERINGATAN — INI MENULIS SATU BARIS UJI KE DATABASE.
#   Barisnya ditandai jelas (scan_id berawalan "TEST-") dan TIDAK terhubung ke akun
#   siapa pun (auth_user_id NULL), jadi tidak muncul di halaman member mana pun.
#   Hapus setelah selesai — perintahnya dicetak di akhir.
#
# PAKAI:
#   VISBODY_WEBHOOK_SECRET='ws_xxx' ./scripts/visbody-test-webhook.sh https://my.20fit.id
#   VISBODY_WEBHOOK_SECRET='ws_xxx' ./scripts/visbody-test-webhook.sh https://profile20fit-staging.up.railway.app

set -euo pipefail

BASE="${1:-}"
if [ -z "$BASE" ] || [ -z "${VISBODY_WEBHOOK_SECRET:-}" ]; then
  echo "Pakai: VISBODY_WEBHOOK_SECRET='ws_xxx' $0 <base-url>" >&2
  exit 1
fi
BASE="${BASE%/}"

TS="$(date +%s)"
SCAN_ID="TEST-$(date +%Y%m%d%H%M%S)-$RANDOM"
NOW_ISO="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"

# Body sengaja TANPA user_info.third_uid: itu keadaan sebenarnya saat member baru
# turun dari timbangan dan belum memindai QR.
BODY=$(printf '{"event_id":"EVT-%s","scan_id":"%s","device_sn":"TEST-DEVICE","scan_time":"%s","measured_items":{"body_composition":"completed"}}' \
  "$SCAN_ID" "$SCAN_ID" "$NOW_ISO")

SIG="sha256=$(printf '%s.%s' "$TS" "$BODY" | openssl dgst -sha256 -hmac "$VISBODY_WEBHOOK_SECRET" -r | cut -d' ' -f1)"

echo "== 1. Signature BENAR (harus 200 {\"code\":0}) =="
curl -sS -o /tmp/vb_ok.txt -w "HTTP %{http_code}  " -X POST "$BASE/api/visbody/webhook" \
  -H "Content-Type: application/json" \
  -H "x-visbody-timestamp: $TS" \
  -H "x-visbody-signature: $SIG" \
  --data "$BODY"
cat /tmp/vb_ok.txt; echo; echo

echo "== 2. Signature SALAH (harus 401) =="
curl -sS -o /tmp/vb_bad.txt -w "HTTP %{http_code}  " -X POST "$BASE/api/visbody/webhook" \
  -H "Content-Type: application/json" \
  -H "x-visbody-timestamp: $TS" \
  -H "x-visbody-signature: sha256=0000000000000000000000000000000000000000000000000000000000000000" \
  --data "$BODY"
cat /tmp/vb_bad.txt; echo; echo

echo "== 3. Signature panjangnya beda (harus 401, BUKAN 500) =="
curl -sS -o /tmp/vb_short.txt -w "HTTP %{http_code}  " -X POST "$BASE/api/visbody/webhook" \
  -H "Content-Type: application/json" \
  -H "x-visbody-timestamp: $TS" \
  -H "x-visbody-signature: sha256=pendek" \
  --data "$BODY"
cat /tmp/vb_short.txt; echo; echo

echo "== 4. Timestamp 10 menit lalu / replay (harus 401) =="
OLD=$((TS - 600))
OLDSIG="sha256=$(printf '%s.%s' "$OLD" "$BODY" | openssl dgst -sha256 -hmac "$VISBODY_WEBHOOK_SECRET" -r | cut -d' ' -f1)"
curl -sS -o /tmp/vb_old.txt -w "HTTP %{http_code}  " -X POST "$BASE/api/visbody/webhook" \
  -H "Content-Type: application/json" \
  -H "x-visbody-timestamp: $OLD" \
  -H "x-visbody-signature: $OLDSIG" \
  --data "$BODY"
cat /tmp/vb_old.txt; echo; echo

cat <<EOF
----------------------------------------------------------------
Yang diharapkan: 1 -> 200 {"code":0}   2,3,4 -> 401

Kalau 1 membalas 401: VISBODY_WEBHOOK_SECRET di Railway belum terisi atau beda.
Kalau semuanya 404:   deploy belum membawa route /api/visbody/*.

Cek barisnya masuk (Supabase SQL Editor):
  select scan_id, device_sn, status, auth_user_id, created_at
  from public.my20fit_visbody_scan where scan_id like 'TEST-%';

HAPUS baris uji setelah selesai:
  delete from public.my20fit_visbody_scan where scan_id like 'TEST-%';
----------------------------------------------------------------
EOF
