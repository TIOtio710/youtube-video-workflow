# outro-cta: penutup ajakan generik

Bab penutup: avatar sebagai kartu potret, lalu 3 panel (tawaran, 3 manfaat, kartu ajakan), lalu avatar penuh dengan pill "link di deskripsi". Teks diatur lewat variabel komposisi (`brand`, `offer`, `b1`–`b3`, `ctaTitle`, `ctaLine`). Panel muncul di pecahan durasi bab, jadi tidak bergantung pada kata VO.

Buat sekali, lalu **pakai ulang di setiap video tanpa generate HeyGen lagi**. Teks penutup jangan menyebut topik video.

## Pemakaian pertama

1. Tulis bab penutup di `script.md` sebagai blok avatar:
   ```
   ## 09 · Penutup [AVATAR]

   Satu klip TTS (`outro`).

   > …ajakan kamu, generik, ±45–55 detik…
   ```
2. `node tools/heygen-vo.mjs video/<slug>` → `vo/outro.wav` + `vo/outro.url.txt`.
3. `node tools/heygen-video.mjs video/<slug> --audio vo/outro.url.txt --name outro` → `heygen/outro.mp4`.
4. Salin template ke `video/<slug>/bab/09-penutup/`, taruh `heygen/outro.mp4` sebagai `assets/avatar.mp4`.
5. `node tools/bab-build.mjs video/<slug>/bab/09-penutup`, lalu samakan `data-duration` pada `<video id="av">` dengan `DUR` di blok TIMING.
6. Isi teks: ubah nilai `default` di `data-composition-variables` (dan teks di dalam elemen bertanda `data-var-text`).
7. Mau panel jatuh tepat di kata tertentu? Ganti `frac(0.35)` dengan `at("outro", "kata")`.

## Pemakaian ulang

Simpan `vo/outro.*`, `assets/avatar.mp4`, dan `scene.html` yang sudah diisi di satu folder template pribadi (di luar repo kalau berisi wajah/suara asli). Di video baru: salin `vo/outro.*` ke `video/<slug>/vo/` (supaya `heygen-vo.mjs` melewatinya) dan salin folder babnya. Biaya: 0 kredit.

## Avatar vertikal

Banyak look HeyGen berukuran 720×1280. Output 16:9 jadi pillarbox, sehingga wrapper `#avw` dipotong dengan `clip-path: inset(0% 34.2% 0% 34.2% round 30px)`. Kalau look kamu memang 16:9, hapus `clipPath` dan atur ulang skala/posisi.
