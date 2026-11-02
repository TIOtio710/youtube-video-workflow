---
name: video-youtube
description: Produksi video YouTube tutorial 8–10 menit dari brief + video referensi sampai file final, dengan HyperFrames (HTML → video), VO dan avatar HeyGen, dan render per bab. Pakai saat user memberi topik/brief/referensi video YouTube, minta "bikin video", "lanjut video berikutnya", atau minta revisi bab video yang sudah ada.
---

# Video YouTube: brief → final

Satu video = satu folder `video/<YYYY-MM-DD-slug>/`. Semua tahap ditulis ke file supaya bisa dilanjutkan, direvisi per bab, dan dievaluasi.

```
video/<slug>/
  brief.md  riset/  script.md  storyboard.md  workflow-log.md
  vo/            # klip TTS per paragraf + _raw/ (cache panggilan)
  heygen/        # avatar intro (+ transisi)
  bab/<nn-nama>/ # satu proyek HyperFrames per bab (plan.json → index.html)
  final/         # bab/*.mp4, <slug>.mp4, <slug>.srt, thumbnail.png, paket-upload.md
```

Setelan pribadi (voice, look avatar, brand, target audio) ada di `workflow.config.json` di root proyek. Tools membaca dari sana.

## Mode

- **Dengan gate** (default): berhenti untuk persetujuan user setelah outline, script, storyboard, dan preview per bab.
- **Ditinggal** (user bilang akan tidur/pergi): ajukan semua pertanyaan sekali di awal ([references/pertanyaan-awal.md](references/pertanyaan-awal.md)), lalu jalan sampai final tanpa berhenti. Gate dipindah ke akhir: user menonton final, revisi per bab. Izin generate HeyGen diminta sekali dengan batas kredit.

## Alur

1. **Pertanyaan awal** → `brief.md`. Pakai kartu di [references/pertanyaan-awal.md](references/pertanyaan-awal.md).
2. **Riset** → `riset/riset.md`:
   - Video referensi: judul, chapter, transcript, hook, pola CTA (scrape halaman YouTube cukup sekali).
   - **Docs resmi produk** yang didemokan. Wajib: nama fitur dan alur UI bisa berubah (contoh nyata: "Routines" berganti nama jadi "Scheduled tasks" tanpa banyak yang sadar).
   - Materi CTA (landing page) kalau ada upsell. Catat klaim yang boleh dipakai.
   - Amati-tiru: tiru struktur dan pola, jangan salin kalimat, aset, avatar, atau suara kreator lain.
3. **Outline + script** → `script.md` dengan format yang dibaca mesin ([references/format-script.md](references/format-script.md)). Kalimat ditulis seperti bicara; jalankan skill `humanizer` kalau terasa kaku.
4. **VO**: `node tools/heygen-vo.mjs video/<slug>` → satu panggilan TTS per bab, dipotong per paragraf dengan timestamp kata.
5. **Avatar** (background, mulai sedini mungkin karena antre ±12–17 menit per klip): `node tools/heygen-video.mjs video/<slug> --audio vo/intro.url.txt --name intro`. Engine default `avatar_iii` (hemat). Cek wajah dan lip-sync begitu jadi. Penutup: pakai ulang dari `templates/outro-cta/` kalau sudah pernah dibuat.
6. **Kerangka bab**: `plan.json` per bab → `node tools/bab-build.mjs video/<slug>/bab/<nn>`. Durasi tiap bab langsung pasti. Atur jeda di `plan.json` sampai total masuk target **sebelum** membuat visual.
7. **Storyboard** → `storyboard.md`: per bab, jenis visual (mockup UI, diagram, kinetic text, avatar) dan beat per kalimat VO.
8. **Visual** `bab/<nn>/compositions/scene.html`:
   - Semua waktu dari `T.<klip>` dan `at("<klip>", "kata", n)`, bukan angka tebakan.
   - Bab ringan dikerjakan sendiri. Bab demo berat didelegasikan ke subagen `bab-mockup-builder` (paralel, satu bab per subagen) dengan kit dari `templates/`.
   - Ikuti skill `hyperframes` (kontrak render). Skill `explainer-video`, `diagram-animation`, `kinetic-typography`, `lower-thirds` hanya referensi craft.
9. **Cek per bab**: `npx hyperframes check` (0 error) + `npx hyperframes snapshot --at <beat…>` dan **lihat gambarnya**. Snapshot menangkap bug yang lolos dari check (caption menumpuk, timeline diam).
10. **Render per bab**, satu render sekaligus, berantai di background begitu bab lolos cek: `npx hyperframes render -o final/bab/<nn-nama>.mp4 --quality looks`.
11. **Gabung**: `node tools/gabung.mjs video/<slug> <slug> --music final/music/<track>.mp3` → mp4 final, loudness sesuai config, SRT.
12. **Thumbnail + paket upload**: thumbnail 1280×720 dibuat sebagai proyek HyperFrames, lalu `snapshot --at 0.5`. Paket upload: 3 judul, deskripsi + chapter (dari durasi bab), tag, komentar sematkan, pengingat label konten sintetis.
13. **Evaluasi singkat** di `workflow-log.md`: apa yang lambat, mahal, atau rusak. Perbaiki tools-nya, bukan cuma videonya.

## Aturan tetap

- Render hanya lewat CLI HyperFrames, satu render sekaligus. Jangan menjalankan `hyperframes preview`/Studio di laptop lemah.
- **Jangan mengotomasi claude.ai atau aplikasi desktop Claude dengan script** (Playwright/CDP/bot). Consumer Terms melarang akses otomatis. Pilihan yang aman: mockup HTML, rekaman manual user, atau jalur resmi (API, `claude -p`).
- Mockup harus sesuai alur produk asli. Kalau tidak ada screenshot atau rekaman, tandai bagian yang belum pasti di daftar "wajib dicek" untuk user.
- Avatar dan suara AI realistis: ingatkan centang "Altered or synthetic content" di YouTube Studio.
- Narasi dominan, musik pelan (±16 dB di bawah VO), SFX lembut dan jarang.
- Biaya HeyGen: lihat [references/biaya-heygen.md](references/biaya-heygen.md). Jangan naik ke engine avatar yang lebih mahal tanpa izin user.

## Revisi

Revisi satu bab: ubah `scene.html`/`plan.json` (atau paragraf script lalu hapus wav klip itu dan `vo/_raw` bab terkait), jalankan builder, cek, render ulang bab itu saja, lalu `gabung.mjs` lagi.
