# Handoff: HRD Anonymous Health & Fatigue Dashboard (my.20fit × HRIS module)

## Overview

An admin module for HR staff at a ~5,000-employee company. HR monitors the workforce's
**health and fatigue** at an aggregate level and can export reports — but must **never** see
individual employee identities. Data comes from four sources: connected wearables
(Garmin/Fitbit/Apple/Samsung/Oura), the annual medical check-up (MCU), HRIS attendance
and working-hours data, and the my.20fit training platform.

Three screens, one bilingual UI (Indonesian / English, switchable at runtime), fully responsive
from ~390px phones to 1360px desktop.

## About the Design Files

`Dashboard HRD Kesehatan.dc.html` in this bundle is a **design reference created in HTML** —
a working prototype that shows intended look, copy, and behaviour. It is **not production code
to copy directly**. The task is to **recreate this design in the target codebase's existing
environment** (React, Vue, Next.js, SwiftUI, native, etc.) using its established component
library, styling approach, routing, and data layer. If no environment exists yet, choose the
framework most appropriate for the product and implement the design there.

The prototype's own runtime (a template + logic-class wrapper) is scaffolding — ignore it.
What matters is the layout, the numbers' meaning, the interaction model, and the privacy rules.

## Fidelity

**High-fidelity.** Final colours, typography, spacing, copy (both languages), thresholds, and
interaction states are all specified below and should be reproduced faithfully. The sample
figures are realistic placeholders — replace them with real API data, keep the presentation.

---

## Core domain rules

These are the rules the whole module hangs on. Enforce them **server-side**, not just in the UI.

1. **No identities.** No names, employee IDs (NIK), photos, or per-person rows anywhere in this
   module, at any zoom level, in any export.
2. **Minimum group size 5.** Any department, work group, or report row covering fewer than
   5 people is suppressed and shown as an explicit "hidden" placeholder (see below) — never
   silently dropped, so HR can tell data exists but is protected.
3. **One score polarity.** Every 0–100 score in the module is a **health score: higher is
   healthier.** There is no fatigue-polarity number anywhere. 
   Bands: **≥ 80 good (green) · 68–79 needs attention (amber) · < 68 poor (red)**.
4. **Audit log.** Opening the module and every export are recorded with HR account, scope
   (division), and timestamp. Surfaced in the footer and the export dialog.
5. **Individual medical results** stay with the company clinic and the employee. HR sees only
   percentages of participants outside the normal range.

### Health score derivation

**Division health score** = mean of six MCU panel scores. Each panel score starts at 100 and
falls with the share of participants whose findings are outside the normal range:

| Panel | Formula (findings are % of participants) |
|---|---|
| Anthropometry | `100 − (overweight × 0.9 + obesity × 2.0)` |
| Blood pressure | `100 − (highBP × 1.9 + lowBP × 1.1)` |
| Lipid profile | `100 − cholesterol × 1.6` |
| Blood glucose | `100 − glucose × 3.0` |
| Blood count | `100 − anaemia × 2.0` |
| Lifestyle | `100 − smokers × 1.1` |

Each panel clamps to 0–100 and rounds; the division score is the rounded mean of the six.
Weights encode clinical severity (an obese share hurts more than an overweight share, a
diabetic share more than a cholesterol share). Keep them configurable server-side.

**Company fatigue/health index** (the 12-week trend and the KPI cards) is a separate per-employee
0–100 score averaged upward, composed of:

| Input | Weight | Source |
|---|---|---|
| Sleep duration (14-day average) | 30% | wearable |
| Sleep schedule consistency (bedtime variance) | 15% | wearable |
| Recovery — HRV & resting HR trend | 20% | wearable |
| Overtime hours | 20% | HRIS attendance |
| Night shift pattern | 10% | HRIS roster |
| Daily physical activity (steps, active minutes) | 5% | wearable |

The module previously included mental-health / wellness metrics (mood score, stress score,
daily self-report). **These were deliberately removed.** Do not reintroduce them. Only physical
and clinically measurable metrics appear.

---

## Screens / Views

Shared chrome on all three screens:

**Header** — white, `1px solid #E2E0D9` bottom border, `16px 20px 0` padding.
Left: mono eyebrow `HRIS Nusantara · Modul Kesehatan & Kelelahan` (10.5px, `#8A9096`,
letter-spacing 0.14em, uppercase) above `h1` "Analisis Kelelahan Karyawan" (21px/600, −0.01em).
Right, in a wrapping row (gap 8px): an **ID / EN** segmented control (12px, active segment
`#1F5C4D` on white, 6px radius, 1px `#E2E0D9` border, overflow hidden), a **period select**
(30 hari / 90 hari / tahun berjalan, 13px, 7px 10px padding), and a primary **Export laporan**
button (`#1F5C4D`, white text, 13px/500, 8px 14px, 6px radius).

**Tabs** — 4px gap, horizontally scrollable, 13px/500, `10px 14px 12px` padding, active tab
`#16191B` with a 2px `#1F5C4D` bottom border, inactive `#8A9096` and transparent border.
Tabs: Ringkasan / Detail Departemen / Laporan (Overview / Department detail / Reports).

**Privacy banner** — `#EFF3F0` background, `1px solid #DDE4DF` bottom border, `14px 20px`.
An 18px circled "i" (1.5px `#1F5C4D` border) plus 12.5px `#37504A` text, line-height 1.5:

> Mode anonim aktif. Nama, NIK, dan foto karyawan tidak ditampilkan di modul ini. Data hanya
> dapat dilihat sebagai agregat departemen atau kelompok kerja dengan minimal 5 orang.
> Kelompok di bawah 5 orang otomatis disembunyikan untuk mencegah identifikasi.

EN: "Anonymous mode is on. Employee names, ID numbers, and photos are not shown in this module.
Data is available only as department or work-group aggregates with at least 5 people. Groups
under 5 people are hidden automatically to prevent re-identification."

**Footer** — `18px 20px 28px`, top border `#E2E0D9`, 11px `#A0A49F`, line-height 1.6:
"Data diperbarui 6 Agustus 2026, 07:00 WIB. Akses modul ini tercatat dalam log audit. Modul
kesehatan tunduk pada kebijakan privasi data karyawan No. 14/HR/2026."

**Page frame** — content is centred, `max-width: 1360px`, background `#F2F1EC`, page background
`#E8E7E1`, drop shadow `0 24px 60px -30px rgba(0,0,0,0.45)`. Everything below reflows by
`flex-wrap` + `min-width: 0` and `repeat(auto-fit, minmax(...))` grids — there is no viewport
toggle and no breakpoint-specific layout code.

---

### 1. Ringkasan (Overview)

Purpose: HR's daily monitoring view. Five numbered bands, `20px` padding, `26px` gap.

**Status strip** — a 4-cell grid (`minmax(150px, 1fr)`, 1px gaps over a `#E2E0D9` background so
the gaps read as hairlines, 8px radius, overflow hidden). Each cell: white, `11px 14px`, a 10px
uppercase mono label (`#A0A49F`, 0.1em) over a 12.5px value.
Cells: Diperbarui `6 Agu 2026, 07:00 WIB` · Cakupan data `4.612 dari 5.000 karyawan` ·
Peringatan aktif `3 departemen melewati ambang` (red `#C05B45`) · Grup disembunyikan
`3 grup (< 5 orang)` (`#8A9096`).

**Band headers** (every band) — a row with a mono two-digit number (`11px`, `#A0A49F`), an `h2`
(15px/600), and a 11.5px `#8A9096` subtitle, over a `1px solid #DEDCD4` bottom border with 8px
padding-bottom.

**01 Kondisi hari ini** — "Indikator utama seluruh perusahaan".
Grid `minmax(180px, 1fr)`, 12px gap. Two KPI cards (white, 1px `#E2E0D9`, 10px radius, 16px pad):

| Card | Value | Delta line |
|---|---|---|
| Karyawan risiko tinggi | `628` / `dari 5.000` | `▲ 12,6% dari total tenaga kerja` (red) |
| Rata-rata tidur harian | `6:12` / `jam` | `▼ 18 menit vs bulan lalu` (amber `#C99A3B`) |

Card anatomy: 11.5px `#6B7278` label (min-height 32px) with a 15px circled "i" affordance
(1px `#CFCDC5`, 9.5px/700 `#A0A49F`) pushed right; then a 30px/600 mono value (−0.02em) with a
12px unit baseline-aligned; then the 11.5px delta line.

**Hover tooltip (both cards).** On `mouseenter` the card shows an absolutely-positioned panel
(`left/right: 12px`, `top: calc(100% - 6px)`, z-index 20, background `#1C2926`, 1px `#2E3F3A`,
8px radius, 14px pad, shadow `0 18px 40px -18px rgba(0,0,0,0.6)`) containing:
a 9.5px uppercase mono kicker "Yang diukur" (`#8FA69E`, 0.1em) · a 12px `#F2F1EC` explanation ·
a `#3A4A45` hairline · a list of indicator rows (11px `#C9CFCC` label, mono `#8FA69E` value) ·
another hairline · a 11px `#A9B5B1` threshold line. Hidden again on `mouseleave`.
Only one tooltip is open at a time (single `tip` state holding the card index).

Content — *Karyawan risiko tinggi*: "Karyawan yang indeks kesehatannya 55 atau kurang selama
minimal dua minggu berturut-turut." Rows: Indeks kesehatan ≤ 55 `628` · Tidur < 6 jam `71%` ·
Lembur > 10 jam/minggu `58%` · Shift malam berturut ≥ 4 `44%`. Threshold: "Peringatan terkirim
bila porsi risiko tinggi departemen melewati 15%."
*Rata-rata tidur harian*: "Rata-rata waktu tidur per malam dari perangkat wearable yang
terhubung, 14 hari terakhir." Rows: Garmin Connect `1.840` · Fitbit `920` · Apple Health `760` ·
Lainnya (Samsung, Oura) `590`. Threshold: "Ambang: < 6 jam memicu peringatan bila bertahan 2 minggu."

**02 Kesehatan populasi** — "Gabungan wearable dan medical check-up tahunan".
- Card grid `minmax(210px, 1fr)`: 4 cards — Langkah harian rata-rata `7.940 langkah`
  (bar 79%, green, note "Target perusahaan 10.000") · Overweight + obesitas `36 %` (amber) ·
  Tekanan darah ≥ 140/90 `14 %` (red, note "Disarankan pemeriksaan ulang") ·
  Tekanan darah < 90/60 `7 %` (amber, note "329 karyawan · sering disertai anemia").
  Anatomy: 11.5px label (min-height 30px), 24px/600 mono value + 11.5px unit, a 5px track
  (`#F0EFE9`, 3px radius) with a coloured fill, then an 11px `#8A9096` note.
- **Kondisi kesehatan umum** card — "Persentase dari 4.700 peserta MCU 2025". Findings grouped
  by check-up panel in a `minmax(290px, 1fr)` grid, `22px 30px` gaps. Each group has a 10px
  uppercase mono `#1F5C4D` title plus a 10.5px `#A0A49F` panel note over a `#DEDCD4` rule, then
  rows: 12.5px label + 10.5px `#A0A49F` clinical criteria, a 66px mini bar, and a right-aligned
  15px/600 mono percentage with an 10.5px count beneath.
  Groups and rows (criteria in parentheses): **Antropometri** — overweight (BMI 25–29,9) 26% /
  1.222 · obesitas (BMI ≥ 30) 10% / 470 · berat normal (BMI 18,5–24,9) 58% / 2.726.
  **Tekanan darah** — darah tinggi (≥ 140/90) 14% / 658 · darah rendah (< 90/60) 7% / 329.
  **Profil lipid** — kolesterol total tinggi (≥ 240 mg/dL) 21% / 987.
  **Gula darah** — gula darah puasa tinggi (≥ 126 mg/dL) 7% / 329.
  **Darah lengkap** — anemia (Hb < 12 P / < 13 L) 12% / 564 · asam urat tinggi (≥ 7 mg/dL) 9% / 423.
  **Gaya hidup** — perokok aktif (self-report saat MCU) 23% / 1.081.

**03 Tren & sebaran risiko** — main column (`flex: 3 1 340px`) + rail (`flex: 1 1 260px`), 20px gap,
both `min-width: 0`.

Main column, in order:
1. **Indeks kesehatan perusahaan (12 minggu)** — caption "0–100 · makin tinggi makin sehat".
   A 170px bar row (5px gaps, `#E2E0D9` baseline). Values W1→W12:
   `73 72 72 71 70 70 69 68 68 67 66 68`; bar height = value%; colour green `#6FA083` ≥ 72,
   amber `#D6A63F` ≥ 66, else red `#C05B45`. 10px mono value above each bar, 9.5px `W1…W12`
   labels below.
2. **Skor kesehatan per departemen** — legend chips (Risiko tinggi `#C05B45` / Sedang `#D6A63F` /
   Aman `#6FA083`). One row per department: name + mono headcount; a 9px stacked risk bar
   (high/mid/low shares) with an 11px note "21% risiko tinggi · 260 orang"; a 19px/600 mono
   health score coloured by band; and a **Lihat** button that opens that division's detail screen.
   Then the suppression row, at 0.65 opacity: "Direksi & Sekretariat" / "Disembunyikan — kelompok
   kurang dari 5 orang".
3. **Peta panas kesehatan divisi** — "Skor per panel MCU · 100 = paling sehat". Horizontally
   scrollable (`min-width: 620px`) matrix: a 130px name column, then six panel columns
   (Antropometri, Tekanan darah, Profil lipid, Gula darah, Darah lengkap, Gaya hidup) and a
   wider **Skor divisi** column (`flex: 1.2`). Cells are 28px tall, 3px radius, mono 10.5px,
   with the score-band fill: `≥ 85 #4C8C6A` (white text) · `≥ 75 #8FB39A` (`#16302A`) ·
   `≥ 65 #DDB472` (`#2A2E30`) · `≥ 55 #C97A5F` (white) · else `#B04B36` (white). Below: a legend
   (85–100 sangat baik / 75–84 baik / 65–74 perlu perhatian / di bawah 65 buruk) and the note
   explaining that 100 means every participant is within the normal range and that the division
   score is the mean of the six panels.
4. **Sebaran tingkat risiko** — a 30px stacked bar plus legend rows with counts and percentages:
   Risiko tinggi 628 / 13% · Perlu perhatian 1.544 / 31% · Aman 2.440 / 49% ·
   Data belum cukup 388 / 7% (`#CFCDC5`).

Rail, in order:
1. **Cara indeks kesehatan dihitung** — "Skor 0–100 per karyawan, 100 paling sehat, lalu
   dirata-ratakan per departemen." The six weighted inputs from the table above (label + 10.5px
   source line + right-aligned mono weight). Below a divider: **Perangkat terhubung** with
   "Sinkron 06:45 WIB" and a dot+name+count list — Garmin Connect 1.840, Fitbit 920,
   Apple Health 760, Samsung Health 410, Oura Ring 180 (amber dot), Belum terhubung 890
   (`#CFCDC5`) — then a full-width secondary "Kelola integrasi" button.
2. **Faktor pendorong utama** — Lembur lebih dari 10 jam/minggu 64% · Tidur kurang dari 6 jam 51% ·
   Shift malam berturut-turut 37% · Kurang aktivitas fisik 26%. Label + mono percentage over a
   6px `#F0EFE9` track with a `#1F5C4D` fill.
3. **Ambang peringatan** — "3 aktif"; sub "Sistem mengirim notifikasi saat ambang terlampaui,
   tanpa menyebut individu." Three toggle rows: Skor kesehatan divisi rendah `< 68 / 100` ·
   Porsi risiko tinggi `> 15%` · Tidur rata-rata rendah `< 6 jam`. Toggle: 38×22px pill,
   `#1F5C4D` on / `#D8D6CE` off, 16px white knob, `justify-content` flips, `all .18s ease`.
   Then a full-width "Atur ambang" secondary button.
4. **Peringatan terbaru** — dot + text + mono timestamp: "Operasional Pabrik di bawah ambang skor
   kesehatan (65 < 68)." Hari ini, 07:00 · "Logistik & Gudang: porsi risiko tinggi naik ke 18%
   (ambang 15%)." Kemarin, 07:00 · "Customer Service: tidur rata-rata turun di bawah 6 jam selama
   2 minggu." 3 Agustus · "Keuangan kembali ke kategori baik setelah program gizi kantin." 29 Juli.
5. **Sumber data** — Wearable (jam/cincin) 82% · Aktivitas fisik (wearable) 78% ·
   Absensi & jam kerja 100% · Medical check-up 2025 94%.

**04 Aktivitas fisik & olahraga** — "Dari wearable yang terhubung, 4 minggu terakhir".
Left card (`flex: 2 1 300px`): **Frekuensi olahraga per minggu** — a 130px bar chart over five
buckets `0× 24%` (red) · `1× 21%` (`#C97A5F`) · `2× 23%` (amber) · `3–4× 22%` (`#6FA083`) ·
`5× atau lebih 10%` (`#4C8C6A`). Right card (`flex: 1 1 240px`): **Rincian aktivitas** —
Memenuhi anjuran WHO `32%` (note: "150–300 menit aktivitas sedang atau 75–150 menit aktivitas
berat per minggu, plus latihan kekuatan 2× seminggu") · Menit aktif per minggu `118` ·
Langkah harian `7.940` · Tidak pernah olahraga `24%` (red) ·
Sesi latihan tercatat di my.20fit `4,6` (green, "Rata-rata per karyawan aktif / bulan").

**05 Risiko kesehatan per departemen** — "Berdasarkan medical check-up tahunan 2025".
- Four stratification cards (3px coloured left border): Risiko kardiometabolik rendah `2.914 / 62%`
  (green) · Risiko sedang `1.320 / 28%` (amber, "Satu hingga dua temuan · disarankan konsultasi
  gizi") · Risiko tinggi `466 / 10%` (red, "Tiga temuan atau lebih · rujukan klinik perusahaan") ·
  Belum mengikuti MCU `300 / 6%` (`#CFCDC5`, "Jadwal susulan dibuka September 2026").
- **Temuan MCU per departemen** — horizontally scrollable table (`min-width: 1180px`).
  Columns: Departemen (`flex 2.4`, with a mono sub-line "partisipasi 96% · 1.190"), then eight
  finding columns — Overweight, Obesitas, Darah tinggi, Darah rendah, Kolesterol, Gula darah,
  Anemia, Perokok — each a centred mono percentage over a 4px mini bar, coloured green/amber/red
  against per-column thresholds `[22,28] [8,12] [10,15] [5,8] [18,24] [5,8] [10,14] [15,30]`
  (below warn = green, ≥ warn = amber, ≥ bad = red); then Skor risiko (`flex 1.1`, 17px/600 mono)
  and Kategori (`flex 1.3`, a 10.5px pill — red `#F7E7E2`, amber `#F7EEDC`, green `#E7F0E9`).
  A suppression row closes the table, then the footnote explaining the 0–100 score and that
  individual results are only accessible to the company doctor and the employee.

---

### 2. Detail Departemen (Department detail)

Purpose: drill into one division. Everything on the screen is derived from the selected division.

**Header row** — a text "← Kembali ke ringkasan" button, the division name (20px/600), a mono
sub-line "1.240 karyawan · 30 hari terakhir"; right, a white bordered card showing
"Indeks kesehatan divisi" + a 26px/600 mono score, "/ 100", and the band label (Baik ≥ 80 /
Perlu perhatian ≥ 68 / Buruk).

**Division picker** — a card with "Pilih divisi" and the note "Data tetap agregat — tanpa nama
karyawan"; a `<select>` (max-width 380px, 13.5px, 10px 12px, 6px radius) whose options read
`"Operasional Pabrik · skor 65"`; beside it a primary "Unduh laporan divisi" button that opens
the export dialog. Changing the select re-renders the whole screen.

**Three cards** (`minmax(260px, 1fr)`, 16px gap):
1. **Durasi tidur rata-rata** — a 26px/600 mono figure (e.g. `6j 13m`), then five distribution
   rows (`< 5 jam`, `5–6`, `6–7`, `7–8`, `> 8 jam`): a 62px mono label, a 14px `#F0EFE9` track
   with a coloured fill, and a 34px right-aligned mono percentage. Both the average and the
   spread shift with the division.
2. **Tanda vital & aktivitas** — rows of label + 10.5px reference range + a 17px/600 mono value,
   coloured by band: Detak jantung istirahat (Normal 60–75 bpm) · HRV (Rendah di bawah 45 ms) ·
   Langkah per hari (Target 10.000) · Sesi olahraga per minggu (Anjuran 3×) ·
   Absen sakit per orang / tahun (Rata-rata nasional 2,4).
3. **Hasil medical check-up** — sub "Persentase karyawan di luar rentang normal. Sumber: MCU
   tahunan 2025, divisi terpilih." First a six-chip panel-score strip (`flex: 1 1 60px` each,
   5px radius, band-coloured background, a 9px uppercase label over a 15px/600 mono score) for
   Antropometri / Tekanan darah / Lipid / Gula darah / Darah lengkap / Gaya hidup; then the nine
   finding rows for that division (overweight, obesitas, darah tinggi, darah rendah, kolesterol,
   gula darah puasa, anemia, perokok aktif, partisipasi MCU) as label + mono percentage over a
   6px track.

**Kelompok kerja** — "Kode kelompok, bukan identitas individu". A `minmax(200px, 1fr)` grid of
group cards on `#FBFBF8` with a 1px `#EFEEE8` border: a mono code (`GRP-OP-01` … division-coded:
OP, LG, CS, SL, IT, FN, RD, HR), a label (Shift pagi / Shift sore / Shift malam / Supervisor lini),
a 24px/600 mono score with the group size beside it, and a note "Tidur 6j 34m · olahraga 1,8×/mgg".
A dashed placeholder card closes the grid: "2 kelompok disembunyikan (kurang dari 5 orang)".

**Tindak lanjut yang disarankan** — up to four recommendations, each a coloured dot plus a 13px
title and a 12px body, generated from that division's findings. Rules:
`highBP ≥ 15%` → blood-pressure re-checks (red) · `overweight + obesity ≥ 35%` → targeted
nutrition and exercise programme (amber) · `smokers ≥ 25%` → cessation programme, naming the
worst group code (red) · `anaemia ≥ 12%` → follow-up ferritin screening (amber). A green
"Naikkan cakupan wearable divisi ini" item always closes the list.

**Export panel** — "Unduh laporan divisi ini" with the selected division named on the right, and
the note that the report contains every chart and table on the page under the same anonymity
rules. A `minmax(220px, 1fr)` grid of six selectable section cards (checkbox square 16px, 3px
radius, `#1F5C4D` when checked; card border turns `#1F5C4D` and background `#F4F8F6` when
selected): Skor kesehatan & panel MCU · Temuan MCU lengkap · Tidur & pemulihan · Aktivitas fisik ·
Kelompok kerja · Tindak lanjut yang disarankan. Below: a PDF / Excel / CSV segmented control, a
primary "Buat & unduh" button, and a live summary "4 dari 6 bagian dipilih · PDF · agregat".

**Export dialog** — a fixed overlay `rgba(22,25,27,0.55)`, centred card (max-width 420px, 12px
radius, 22px pad, shadow `0 30px 70px -25px rgba(0,0,0,0.5)`): a mono kicker "Siap diunduh",
the generated filename (`MCU_GRP-LG_2026-08.xlsx` — `MCU_<divisionCode>_<YYYY-MM>.<ext>`, with
Excel → `xlsx`), a 12px explanation that no names or ID numbers are included, a manifest list
(Divisi, Karyawan, Skor kesehatan, Bagian disertakan, Format, Grup disembunyikan), Batal /
Unduh buttons, and the audit note "Setiap unduhan dicatat dalam log audit beserta akun HR,
divisi, dan waktu."

---

### 3. Laporan (Reports)

Two columns: builder + archive + history (`flex: 2 1 320px`) and a preview rail (`flex: 1 1 260px`).

**Susun laporan** — "Laporan mengikuti aturan anonimitas yang sama: agregat, minimal 5 orang per
baris." Three selects in a `minmax(190px, 1fr)` grid: Periode (Bulanan — Juli 2026 / Kuartal —
Q2 2026), Cakupan (Semua departemen / Departemen terpilih), Format (PDF / Excel (.xlsx) / CSV).
Then a primary "Buat laporan" button. (No module chips — deliberately removed.)

**Arsip bulanan** — "Skor kesehatan perusahaan per bulan". A scrollable table (`min-width: 520px`)
with columns Bulan / Skor / Perubahan / Tercakup / (action). Eight snapshots, newest first:

| Bulan | Skor | Perubahan | Tercakup |
|---|---|---|---|
| Agustus 2026 | 68 | ▲ 2 | 4.612 |
| Juli 2026 | 66 | ▼ 1 | 4.580 |
| Juni 2026 | 67 | ▼ 2 | 4.534 |
| Mei 2026 | 69 | ▼ 2 | 4.498 |
| April 2026 | 71 | ▲ 1 | 4.402 |
| Maret 2026 | 70 | ▼ 2 | 4.361 |
| Februari 2026 | 72 | ▼ 1 | 4.290 |
| Januari 2026 | 73 | — | 4.188 |

Score colour by band; change ▲ green / ▼ red / — grey. Each row's **Unduh ▾** button opens a
per-row dropdown (absolute, right-aligned, min-width 170px, 8px radius, 6px pad, shadow
`0 16px 36px -16px rgba(0,0,0,0.35)`) offering PDF `.pdf` / Excel `.xlsx` / CSV `.csv` /
PowerPoint (ringkasan) `.pptx`. Only one menu open at a time; the caret flips to ▴.
Note beneath: each month is a separate stored snapshot, so past reports can be re-downloaded
without being affected by newer data.

**Riwayat laporan** — previously generated files: Laporan Bulanan — Juni 2026 (PDF, "Dibuat 2 Juli
2026 · 5.000 karyawan") · Rekap Kuartal — Q2 2026 (XLSX, 8 departemen) · Laporan Bulanan — Mei
2026 (PDF, 4.960 karyawan) · Ekstrak MCU 2025 (agregat) (CSV, anonim). Same **Unduh ▾** menu.

**Pratinjau** — a document mock on `#FBFBF8`: mono kicker "HRIS Nusantara", title "Laporan
Kesehatan & Kelelahan Karyawan", meta "Juli 2026 · 5.000 karyawan · Anonim", a rule, then
key/value rows — Indeks kesehatan `68 / 100`, Risiko tinggi `628 (12,6%)`, Tidur rata-rata
`6:12`, Departemen dianalisis `8`, Grup disembunyikan `3` — a rule, and the footer "Dokumen ini
tidak memuat identitas karyawan. Distribusi terbatas pada HR & manajemen."

---

## Interactions & Behavior

| Interaction | Behaviour |
|---|---|
| Tab click | Switches screen; no route change in the prototype — use real routes (`/health`, `/health/division/:code`, `/health/reports`). |
| ID / EN toggle | Swaps every string, including number separators (`4.612` in ID, `4,612` in EN) and decimal commas (`4,6` vs `4.6`). |
| KPI card hover | Opens the indicator tooltip; closes on mouse leave. Needs a tap/focus equivalent on touch and keyboard. |
| Department row "Lihat" | Sets the selected division and navigates to the detail screen. |
| Division `<select>` | Re-derives heading, headcount, score, sleep, vitals, MCU findings, panel chips, work groups, and recommendations. |
| Alert threshold toggles | Optimistic switch; persist per HR account. |
| Export section cards | Toggle inclusion; the summary line and manifest update live. |
| Format segmented control / row menus | Sets the export format; filename extension follows. |
| "Buat & unduh" / "Unduh" | Opens the confirm dialog; confirming triggers the real export job and writes an audit entry. |
| Heatmap & wide tables | Scroll horizontally inside their own card — the page itself never scrolls sideways. |

**Responsive behaviour.** No media queries. Columns are `flex` with `min-width: 0` and small
flex bases (300–340px main, 240–260px rails); card groups use `repeat(auto-fit, minmax(…, 1fr))`.
At ~390px everything stacks in one column and only the two wide tables scroll. Verified: zero
horizontal overflow at 390px.

**Accessibility to add in implementation** (the prototype does not cover it): keyboard access to
the tooltips and dropdown menus, `aria-expanded` on the Unduh buttons, focus trap and Esc in the
export dialog, and non-colour cues for the heatmap bands (the numbers already carry the value).

## State Management

Prototype state, all local:

| State | Type | Purpose |
|---|---|---|
| `lang` | `"id" \| "en"` | Language |
| `screen` | `"dash" \| "detail" \| "report"` | Active tab (replace with routing) |
| `dept` | `number` | Selected division index |
| `tip` | `number \| null` | Which KPI tooltip is open |
| `alerts` | `boolean[3]` | Alert threshold switches |
| `dlPick` | `boolean[6]` | Export section selection |
| `dlFormat` | `"PDF" \| "Excel" \| "CSV"` | Export format |
| `exportOpen` | `boolean` | Export dialog |
| `dlMenu` | `number \| null` | Open history row menu |
| `archMenu` | `number \| null` | Open archive row menu |

Data the real implementation needs to fetch: company KPIs and the 12-week index series; the
department list with headcount, risk shares, and MCU findings; the population-health and
general-conditions aggregates; activity/exercise distributions; per-division detail (sleep
distribution, vitals, MCU panel scores, work groups); alert configuration; the monthly archive
index; and generated-report metadata. All aggregate endpoints must apply the group-size-5
suppression before returning.

## Design Tokens

**Colour**

| Token | Hex | Use |
|---|---|---|
| Page background | `#E8E7E1` | Outside the frame |
| Frame background | `#F2F1EC` | Content area |
| Surface | `#FFFFFF` | Cards, header |
| Surface subtle | `#FBFBF8` | Nested cards (work groups, preview) |
| Border | `#E2E0D9` | Card and control borders |
| Border strong | `#DEDCD4` | Band header rules |
| Divider | `#EFEEE8` | Row separators |
| Divider faint | `#F4F3EE` | Grouped-list rows |
| Track | `#F0EFE9` | Bar tracks |
| Text | `#16191B` | Primary |
| Text secondary | `#6B7278` | Labels |
| Text muted | `#8A9096` | Meta |
| Text faint | `#A0A49F` | Footnotes, kickers |
| Primary | `#1F5C4D` | Buttons, active states, bar fills |
| Primary hover | `#143D33` | Link hover |
| Primary tint | `#EDF3F0` / `#F4F8F6` | Selected chips and cards |
| Info band | `#EFF3F0` bg, `#DDE4DF` border, `#37504A` text | Privacy banner |
| Bad | `#C05B45` | Red state |
| Bad deep | `#B04B36` | Heatmap worst band |
| Bad soft | `#C97A5F` | Heatmap second band |
| Warn | `#D6A63F` / `#C99A3B` | Amber fill / amber text |
| Warn soft | `#DDB472` | Heatmap mid band |
| Good | `#6FA083` / `#4C8C6A` | Green fill / green text |
| Good soft | `#8FB39A` | Heatmap good band |
| Neutral data | `#CFCDC5` | "No data" segments |
| Tooltip surface | `#1C2926` bg, `#2E3F3A` border, `#8FA69E` kicker, `#C9CFCC` rows, `#A9B5B1` footnote | KPI tooltips |
| Badge backgrounds | `#F7E7E2` / `#F7EEDC` / `#E7F0E9` | Category pills |
| Dark strip | `#16191B` bg, `#9DA3A6` text | Reserved dark chrome |
| Overlay | `rgba(22,25,27,0.55)` | Dialog scrim |

**Type** — `IBM Plex Sans` (400/500/600/700) for UI, `IBM Plex Mono` (400/500/600) for every
number, code, timestamp, and column header. Scale in use: 30/26/24/21/20/19/17/15/14/13.5/13/
12.5/12/11.5/11/10.5/10/9.5/9px. Tracking: `-0.02em` on large mono figures, `-0.01em` on the h1,
`0.06–0.14em` on uppercase mono kickers. `text-wrap: pretty` on long paragraphs.

**Spacing** — 2 / 3 / 4 / 5 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 22 / 26 / 28 / 30px.
Card padding 16–18px, page padding 20px, band gap 26px, column gap 20px, card grid gap 12px.

**Radius** — 2 (legend swatch) / 3 (bars, heat cells) / 4 / 5 / 6 (buttons, inputs) / 8 (menus,
nested cards) / 10 (cards) / 11–20 (pills) / 12 (dialog) / 50% (dots).

**Shadow** — frame `0 24px 60px -30px rgba(0,0,0,0.45)`; tooltip `0 18px 40px -18px rgba(0,0,0,0.6)`;
dropdown `0 16px 36px -16px rgba(0,0,0,0.35)`; dialog `0 30px 70px -25px rgba(0,0,0,0.5)`.

**Bar heights** — 4 (table mini) / 5 (card) / 6 (rail) / 8 / 9 (risk stack) / 14 (sleep) /
26–28 (heat cell) / 30 (stacked split) px.

## Assets

None. No images, no icon font, no SVG illustration — the "i" affordances are text in a bordered
circle and the trend arrows are the characters ▲ ▼ ▴ ▾ ✓. Fonts load from Google Fonts
(IBM Plex Sans, IBM Plex Mono); self-host them in production.

If a logo or brand mark is needed, use the existing 20fit brand assets from your codebase —
none are included here.

## Files

- `Dashboard HRD Kesehatan.dc.html` — the full prototype: all three screens, both languages,
  every interaction described above. Sample data lives in the logic class near the top
  (`DEPTS`, `MCU`, `MCU_THRESHOLDS`, `DEPT_CODES`, `TREND`) and the derivations in
  `panelScores()`, `kpiData()`, and `renderVals()`.
- `README.md` — this document.
