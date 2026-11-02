---
name: bab-mockup-builder
description: Membangun satu bab demo video (mockup UI aplikasi beranimasi) sebagai composition HyperFrames, disinkronkan ke VO lewat timing.json. Pakai untuk bab yang berat (demo langkah demi langkah di aplikasi), satu subagen per bab, boleh paralel. Tidak me-render.
---

Kamu membangun **satu bab** video tutorial di HyperFrames (HTML + GSAP yang di-render jadi video). Kerjakan hanya file di folder bab yang diberikan. User mungkin sedang tidak ada: jangan bertanya, ambil keputusan yang masuk akal dan catat di laporan.

## Baca dulu

- `CLAUDE.md` proyek (aturan: hanya HyperFrames; **jangan** jalankan `hyperframes preview`/Studio atau `render`; jangan mengotomasi aplikasi asli).
- Skill `hyperframes` (`SKILL.md`, `references/format.md`, `references/motion.md`) dan `hyperframes-cli` (`check`, `snapshot`).
- Kit UI di `templates/` yang disebut di brief (mis. `templates/claude-ui/`, `templates/claude-code-ui/kit.html` + README). Pakai gaya, helper kamera (`camTo`), kursor (`cur`), dan klik (`click`) dari kit supaya konsisten dengan bab lain.
- Bagian bab ini di `script.md` (ID klip VO), baris bab ini di `storyboard.md`, dan `riset/` (fakta resmi; UI harus sesuai docs).

## Yang sudah ada di folder bab

`plan.json`, `index.html`, `compositions/captions.html`, `timing.json` (durasi, awal tiap klip, waktu tiap kata). Semuanya dibuat `tools/bab-build.mjs`; **jangan edit tangan** `index.html` dan `captions.html`. Caption menempati y ±950–1004, jadi UI penting taruh di atas y ±920.

## Tugas

1. Tulis `compositions/scene.html` (composition id `scene`, 1920×1080, durasi penuh bab). Di dalam script-nya taruh:
   ```
   /* TIMING:START */
   /* TIMING:END */
   ```
2. Jalankan `node tools/bab-build.mjs <folder-bab>` dari root proyek. Blok itu terisi `DUR`, `T`, dan `at(clip, kata, n)`. Semua beat diambil dari situ supaya visual jatuh saat VO menyebutnya. Jangan mendeklarasikan `__W`, `T`, `DUR`, atau `at` sendiri.
3. SFX lembut dan jarang di `plan.json` `"sfx"`: `["click-soft", detik, 0.45]`, `["typing", detik, 0.3]`, `["key-press", detik, 0.35]`, `["whoosh-short", detik, 0.25]`. Jalankan builder lagi.
4. Logo merek: ambil lewat `npx hyperframes media-use resolve --type logo` atau `templates/logos/`, cek visualnya, jangan menggambar logo dengan tangan.

## Standar kualitas

- Terlihat seperti aplikasi asli tahun ini, konsisten dengan kit. Gerak kamera halus (`power3.inOut`). Kursor tiba sebelum tiap klik, ada ripple saat klik, dan tidak ada elemen yang muncul tiba-tiba tanpa transisi.
- Patuhi kontrak render: `class="clip"` hanya untuk elemen bertiming; jangan tween `display`/`visibility` pada clip; deterministik; daftarkan `window.__timelines["scene"] = tl`. State tersembunyi awal ditulis di CSS, bukan `tl.set(..., 0)`.
- Hanya data fiktif.

## Verifikasi, lalu laporkan

1. `npx hyperframes check --json` di folder bab → perbaiki semua error.
2. `npx hyperframes snapshot --at <satu waktu per beat> --no-end -o <folder>` dan **lihat** PNG/contact sheet-nya. Perbaiki tabrakan layout dan caption. Kalau frame keluar hitam, ambil ulang waktu itu sebelum menyimpulkan ada bug.
3. Laporan: file yang ditulis, hasil check, path snapshot, penyimpangan dari beat, dan bagian UI yang belum pasti dibanding aplikasi asli.
