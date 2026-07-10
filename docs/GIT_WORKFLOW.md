# Git Workflow — 20FIT Health Profile

Aturan alur kerja git untuk repo ini, selaras dengan PRD 20FIT Health Profile
(Fase 0 — Stabilisasi: hardening keamanan, audit endpoint, monitoring produksi).
Semua perubahan — dari siapa pun, termasuk AI assistant — **wajib** mengikuti alur ini.

## Model Branch

| Branch | Fungsi | Deploy |
|---|---|---|
| `main` | **Production.** Kode yang sudah terverifikasi di staging. | Railway production (otomatis dari `main`) |
| `staging` | **Pre-produksi.** Tempat semua perubahan diuji lebih dulu. | Railway staging environment (opsional) |
| `claude/*`, `feature/*`, `fix/*` | Branch kerja per tugas/perintah. | Tidak di-deploy |

## Alur Wajib (Staging-First)

```
perintah/tugas baru
      │
      ▼
branch kerja (claude/* atau feature/*)   ← semua perubahan dikerjakan di sini
      │  push + Pull Request
      ▼
staging                                   ← review + uji fungsional di sini
      │  HANYA jika ada perintah eksplisit "deploy ke produksi"
      ▼
main (production)
```

Aturan:

1. **Tidak ada commit langsung ke `main`.** Semua perubahan masuk lewat
   branch kerja → PR → `staging` terlebih dahulu.
2. **Merge `staging` → `main` (deploy produksi) hanya dilakukan atas perintah
   eksplisit** dari pemilik produk (mis. "deploy ke produksi"). Tanpa perintah
   itu, perubahan berhenti di `staging`.
3. Satu perintah/tugas = satu branch kerja = satu PR, dengan pesan commit yang
   deskriptif. Ini menjaga riwayat git tetap rapi dan mudah di-rollback.
4. Setiap PR harus lolos CI (secret scan + syntax check) sebelum di-merge.
5. Rollback: revert commit merge di `staging`/`main`, jangan force-push,
   kecuali untuk pembersihan riwayat secret yang disepakati bersama.

## Aturan Secret (WAJIB)

1. **Token, API key, dan password tidak boleh pernah ter-commit ke repo** —
   baik di kode, dokumentasi, file HTML export (Bruno/Postman), maupun screenshot.
2. Secret disimpan di:
   - **Railway → Variables** untuk runtime server (production/staging).
   - **GitHub → Settings → Secrets and variables → Actions** untuk CI/CD.
   - **`.env` lokal** (sudah di-`.gitignore`) untuk development.
   Daftar lengkap nama secret ada di [`docs/GITHUB_SECRETS.md`](GITHUB_SECRETS.md).
3. Satu-satunya key yang boleh tampil di kode frontend adalah
   **Supabase anon key** (memang publik, dilindungi Row Level Security).
   `service_role` key, token Fitco/Arena/Xendit/WAQI, dan SMTP pass: **server-only**.
4. Export dokumentasi API (file seperti `20FITdocumentation*.html`) berisi token
   live dan sudah diblokir lewat `.gitignore`. Jangan pernah memaksa (`git add -f`).
5. CI menjalankan **gitleaks** di setiap push/PR. Kalau scan gagal, perbaiki
   (hapus secret, rotasi tokennya) sebelum merge — jangan di-bypass.

## Referensi PRD

Cakupan fitur, prioritas (Must/Should/Could), dan roadmap mengikuti dokumen
**PRD 20FIT Health Profile (Juli 2026)**. Perubahan di luar cakupan PRD perlu
persetujuan pemilik produk sebelum dikerjakan.
