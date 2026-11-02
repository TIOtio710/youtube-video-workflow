# claude-code-ui: kit mockup Claude Desktop (tab Code) + Slack

Potongan UI dari bab demo sebuah video tutorial (fitur scheduled tasks Claude). Isinya replika Claude Desktop tab **Code** (titlebar, sidebar Chat/Cowork/Code, halaman Scheduled tasks, menu Local/Cloud, form "New scheduled task", halaman detail task, sesi run dengan tool call), notifikasi Windows, jendela Slack (DM dari app Claude), kursor, kamera, dan overlay editor (catatan kuning, badge, kartu bab).

`kit.html` bukan composition. Itu salinan apa adanya dari `scene.html` bab 02 yang sudah lolos `hyperframes check` dan snapshot, dipecah jadi 3 bagian: CSS, markup, helper JS. Gaya, warna, font, dan radius sama dengan `templates/claude-ui/` (krem `#faf9f5`, sidebar `#f2f0e8`, aksen `#d97757`, serif UISerif = Georgia, sans Inter, Slack pakai Lato).

Mockup dibangun dari teks dokumentasi resmi, bukan screenshot. Cocokkan dulu dengan aplikasi asli sebelum dipakai.

## Cara pakai di bab baru

1. Siapkan bab dengan `plan.json`, lalu jalankan `node tools/bab-build.mjs <folder-bab>` sekali (membuat `index.html`, `captions.html`, `timing.json`, `assets/vo`, `assets/sfx`).
2. Ambil logo resmi ke `<folder-bab>/assets/logos/` lewat `npx hyperframes media-use resolve --type logo --intent "slack logo" --project <folder-bab>` (logo merek tidak disertakan di repo). Cek hasilnya secara visual: ada logo yang datang rusak (viewBox salah, tanpa warna). Google Drive dan Linear belum punya file logo, jadi chip-nya pakai ikon generik (folder, kotak). Jangan gambar logo merek dengan tangan.
3. Buat `compositions/scene.html`:
   ```html
   <template>
     <style> …bagian 1 dari kit.html… </style>
     …bagian 2 (markup), hapus layar yang tidak dipakai…
     <script> …bagian 3 (helper + kerangka timeline)… </script>
   </template>
   ```
   Root wajib `id="root" data-composition-id="scene"`, timeline didaftarkan sebagai `window.__timelines["scene"]`. Blok `/* TIMING:START */ … /* TIMING:END */` harus ada di dalam IIFE script.
4. Jalankan builder lagi supaya blok TIMING terisi (`DUR`, `T`, `__W`, `at()`).
5. Tulis beat. Semua waktu dari `T.<klip>` dan `at("<klip>", "kata", n)` (kata huruf kecil tanpa tanda baca; `apa-apa` dan `run-nya` tetap pakai tanda hubung). Jangan pakai angka tebakan.
6. SFX klik/ketik dimasukkan ke `plan.json` `"sfx"` sebagai angka detik absolut (hitung dari `at()`), lalu builder dijalankan ulang.
7. `npx hyperframes check --json`, lalu `npx hyperframes snapshot --at …`. Jangan jalankan preview/Studio atau render (aturan proyek).

## Struktur dan koordinat

Semua UI aplikasi ada di dalam `#cam` (1920×1080). Target klik kursor ditulis dalam koordinat `#cam` (koordinat layar saat kamera skala 1). Halaman (`.page`) ada di `left:300; top:40`, jadi koordinat absolut = koordinat halaman + (300, 40).

| Elemen | Pusat klik (abs) | Catatan |
| --- | --- | --- |
| Tab mode Code (sidebar) | 241, 124 | `#seg-code`, sudah aktif |
| Sidebar Scheduled | 92, 217 | `#nav-sched`, tandai aktif dengan `backgroundColor:"#e8e5db"` |
| New task (daftar) | 1690, 126 | `#ls-new` |
| Menu Local / Cloud | 1500, 194 / 1500, 272 | `#menu-new`, `#mi-local`, `#mi-cloud` |
| Form: Name | 1110, 190 | `#f-name .val` diketik pakai `charify` + `typeAt` |
| Form: Instructions | 1110, 330 | `#prompt` (`#pr-a` + `#pr-b > #hl` untuk kalimat yang disorot) |
| Form: model selector | 1469, 532 | `#f-model`, menu `#menu-model` (Sonnet di 1394, 412) |
| Trigger Schedule / GitHub / API | 806, 646 / 1110, 646 / 1414, 646 | `.tcard`, sorot dengan `.sel` |
| Frekuensi (dropdown) | 770, 706 | `#menu-freq`: Hourly 763, Daily 801, Weekdays 839, Weekly 877 (y) |
| Field jam | 965, 706 | `#f-time` (`.old` 09:00, `.val` diketik) |
| Chip connector × | x = chip.left + width − 20 + 300, y 804 | lebar chip tetap di CSS (`#ch-*`), geser chip berikutnya dengan `x` |
| Create | 1512, 86 | `#f-create`, `.on` di-fade saat form lengkap |
| Detail: Run now | 1700, 118 | `#d-run`; baris history `#d-runrow` di 1110, 485 |
| Notifikasi Slack | 1700, 955 | `#toast`, dipakai saat kamera skala 1 |

Sesi run (`#pg-session`): kolom transkrip x 710–1510 abs. Teks Claude `.s-tx` (serif), tool call `.tool` (logo, nama tebal, argumen abu-abu, `.spin` lalu `.res` hijau). Status "Working…" `#s-status` digeser `y` ke bawah item terakhir.

Slack (`#slack` di dalam `#cam`, z di atas aplikasi): pesan `#sk-msg` mulai y 426 abs, isi `#sk-body`. Sorotan baris pakai `<span class="mk">` lalu tween `backgroundSize` ke `"100% 60%"`; hilangkan dengan tween `"--mka": 0`.

## Helper (bagian 3)

- `camTo(cx, cy, s)`: target kamera supaya titik (cx, cy) di tengah frame dengan skala s. Titik dijepit otomatis supaya tepi frame tidak kosong. Pakai `camGo(tl, cx, cy, s, at, dur)` (power3.inOut).
- `go(tl, x, y, arrive, dur)`: kursor **tiba** di (x, y) tepat di detik `arrive`. Klik 0,02–0,08 dtk sesudahnya dengan `click(tl, x, y, at)` (ripple + kursor mengecil). Ganti panah ke tangan dengan opacity `#cur-arrow` / `#cur-hand`.
- `press`, `pop` (menu muncul), `showIn`, `fadeOut`, `swapPage(tl, from, to, at)`.
- Mengetik: `const sp = charify(el)` memecah teks jadi span per huruf (layout tetap, tidak reflow), `typeAt(tl, sp, times, caretOff)` memunculkan huruf + caret. `linTimes(n, t0, t1)` untuk jeda rata. Untuk prompt yang dibacakan VO, petakan tiap kata ke waktu kata VO (lihat blok d4 di scene.html bab 02). Cara ini tidak bergantung pada `onUpdate`, jadi aman saat di-seek acak.
- Overlay editor (`.note` kuning, `#badge`, `#card`) ada di luar `#cam`, ukuran layar. Posisinya dihitung dari keadaan kamera saat itu: layar = 960 + (abs − cx)·s, 540 + (abs − cy)·s.

## Aturan yang dipegang

- Tidak ada `class="clip"` di scene ini; semua muncul/hilang lewat opacity di timeline. Kalau menambah klip bertimer, ikuti kontrak HyperFrames (jangan tween display/visibility pada `.clip`).
- Tidak ada CSS `transform` di elemen yang di-tween GSAP (badge dipusatkan lewat wrapper flex).
- `#cam` dan halaman memakai `data-layout-ignore` / `data-layout-allow-overlap` karena layar ditumpuk dan kamera men-zoom.
- Data fiktif: Alex (user), Rina/CV Sumber Kemasan, Budi/PT Maju Retail, Dewi/Keuangan, workspace Slack "Acme Studio".
- Caption burned-in ada di y ≈ 940–1016. Simpan UI penting di atas y 920 pada skala kamera yang sedang aktif.

## Yang belum pasti dibanding aplikasi asli

- Tata letak persis form "New scheduled task" versi Desktop (posisi tombol Create, bentuk pilihan trigger, dropdown preset) disusun dari teks dokumentasi resmi, bukan screenshot. Preset "Weekdays" tidak disebut eksplisit di docs (docs menyebut hourly/daily/weekly).
- Warna saklar on/off dan halaman detail task: tebakan (dibuat oranye aksen Claude).
- Label model tanpa nomor versi ("Opus · High", "Sonnet · High"); effort ditampilkan di label selector.
- Tampilan sesi run Claude Code (gaya tool call) disederhanakan.
- Slack: tema aubergine standar, teks UI bahasa Inggris.

Kalau ada rekaman layar manual dari user, sesuaikan kit ini dan catat perubahannya di sini.
