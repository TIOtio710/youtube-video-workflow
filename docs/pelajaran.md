# Pelajaran dari video pertama

Uji coba: satu video tutorial 8 menit, dari brief sampai file final, dalam mode "ditinggal" (semua pertanyaan di awal, tanpa gate). Hasil: ±1 jam 20 menit mesin, 6 bab di-render terpisah, lalu digabung.

## Yang terbukti jalan

- **Script yang bisa dibaca mesin** (ID per paragraf) → tidak ada salin-tempel antar tahap.
- **Suara dulu, visual menyusul.** Timestamp per kata dari TTS dipakai untuk sinkron animasi (`at(clip, kata)`) dan caption.
- **Avatar lip-sync dari audio TTS yang sama** → caption avatar presisi, suara konsisten.
- **Durasi diketahui sebelum visual dibuat** → video yang kependekan dibetulkan dengan menambah jeda, bukan menulis ulang.
- **Subagen paralel untuk bab demo** + kit UI bersama → tampilan konsisten antar bab.
- **Snapshot per bab sebelum render** menangkap 3 bug serius yang lolos dari `check`.
- **Render per bab berantai di background** begitu bab lolos cek; rata-rata ±4× durasi video (bab dengan video avatar ±9×).

## Yang dulu mahal atau rusak (sudah diperbaiki di tools)

| Masalah | Perbaikan |
| --- | --- |
| TTS satu panggilan per paragraf (40 panggilan, ±41 kredit) | Satu panggilan per bab, dipotong pakai timestamp (±14 kredit) |
| Avatar tanpa field `engine` → Avatar IV (±6× Avatar III) | Engine eksplisit dari config, default `avatar_iii` |
| Penutup di-generate tiap video | Template penutup generik, dipakai ulang |
| Caption menumpuk (akhir grup NaN) | Diperbaiki di `bab-build.mjs` |
| Nama variabel scene bentrok dengan blok TIMING (`W`) | Builder memakai `__W` |
| `execFileSync` tidak mengembalikan stderr ffmpeg | `spawnSync` di `gabung.mjs` |
| Look avatar ternyata vertikal (pillarbox) | Pola kartu potret di template |
| Nama fitur produk sudah berganti di docs | Docs resmi wajib dibaca sebelum script |
| Logo dari resolver kadang rusak | Cek visual setiap logo |

## Masih terbuka

- Mockup UI dibangun dari teks docs, bukan screenshot. Minta rekaman/screenshot alur asli di pertanyaan awal.
- Musik katalog HeyGen pendek (23–110 dtk), jadi di-loop dengan crossfade. Variasikan track kalau terdengar berulang.
- Pencarian musik HeyGen belum dibungkus jadi tool (CLI `heygen` resmi belum ada untuk Windows; panggil `searchSounds()` dari `media-use/audio/scripts/lib/heygen.mjs`).
