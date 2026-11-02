# Format `script.md`

Script dibaca langsung oleh `tools/heygen-vo.mjs`. Aturannya:

- `## <judul bab>` = batas bab. Satu bab = satu panggilan TTS (dipecah otomatis kalau lebih dari `ttsMaxChars`).
- `- \`<id>\` <teks>` = satu paragraf VO dengan ID unik (mis. `k1`, `d4`). Satu paragraf = satu klip di timeline.
- Bagian avatar: tulis `Satu klip TTS (\`intro\`).` lalu paragraf dengan awalan `> `. Semua paragraf blok itu jadi **satu** klip, supaya `vo/intro.url.txt` bisa dipakai untuk lip-sync avatar.
- Tanda kutip dibuang sebelum TTS. Tulis angka dan jam sebagaimana diucapkan ("jam tujuh lewat tujuh"), karena caption diambil dari kata hasil TTS.
- Baris lain (catatan, judul kerja, durasi) diabaikan tool.

Contoh lengkap: [`examples/script.example.md`](../../../../examples/script.example.md).

## Panjang

Kecepatan TTS ±175 kata/menit (±2,9 kata/detik). Video 8–10 menit = ±1.200 kata VO, ditambah jeda demo. Durasi pasti baru diketahui setelah `bab-build.mjs`; atur jeda di `plan.json`, bukan menambah kata.

## `plan.json` per bab

```json
{ "video": "../..", "lead": 2.2, "clips": [["d1", 2.0], ["d2", 1.2]], "tail": 2.0, "sfx": [["click-soft", 5.4, 0.45]] }
```

`lead` = detik sebelum VO pertama (kartu bab), angka di `clips` = jeda sesudah klip, `sfx` = `[nama file, detik absolut, volume]`.

## Konstanta di `scene.html`

Taruh `/* TIMING:START */` dan `/* TIMING:END */` di dalam script scene. Builder mengisinya dengan `DUR`, `T` (detik mulai tiap klip), dan `at(clip, kata, n)` (detik mulai kata ke-n, huruf kecil tanpa tanda baca). Jangan mendeklarasikan nama `__W`, `T`, `DUR`, atau `at` sendiri.
