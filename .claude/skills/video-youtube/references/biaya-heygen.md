# Biaya HeyGen (akun langganan, kredit premium)

Diukur di satu akun langganan, November 2026. Angka bisa beda per plan: ukur ulang lewat saldo `GET /v3/users/me` (`subscription.credits.premium_credits.remaining`) sebelum dan sesudah generate. API tidak menyediakan riwayat pemakaian; rinciannya ada di dashboard web HeyGen.

| Pos | Tarif | Sumber |
| --- | --- | --- |
| TTS (`/v3/voices/speech`) | ±1 kredit per **30 dtk dimulai, per panggilan** (2,7 dtk = 1, 37 dtk = 2) | Terukur |
| Avatar IV (default HeyGen kalau `engine` kosong) | ±31–33 kredit/menit | Terukur |
| Avatar III (`engine: avatar_iii`) | ±1/6 Avatar IV → perkiraan ±5–6 kredit/menit | Rasio tarif resmi Digital Twin (0,0167 vs 0,1 kredit/dtk) |

## Konsekuensi

- **TTS per bab, bukan per paragraf.** 40 panggilan pendek ±41 kredit; 6 panggilan per bab ±14 kredit untuk suara yang sama.
- **Selalu kirim `engine` eksplisit.** Tanpa field itu HeyGen memakai Avatar IV (±6× lebih mahal). Tool memakai `heygen.avatarEngine` di config (default `avatar_iii`).
- **Cek dulu look-nya mendukung engine itu:** `GET /v3/avatars/looks?group_id=…` → `supported_api_engines`.
- **Penutup/CTA generik dipakai ulang** tanpa generate.
- **Transisi avatar:** semua kalimat transisi dalam satu bab script → satu TTS + satu avatar, lalu dipotong. ±10 dtk × 5 transisi ≈ ±5–7 kredit dengan Avatar III.
- Avatar III bisa lebih kaku daripada IV. Cek lip-sync di snapshot. Kalau tidak layak, tanya user sebelum naik engine.

## Contoh

| Video 8 menit | Kredit |
| --- | --- |
| Avatar IV pembuka + penutup (94 dtk), TTS 40 panggilan | 94 (terukur) |
| Avatar III pembuka 1 menit, TTS 6 panggilan, penutup dipakai ulang | ±20–23 (proyeksi) |

## Rasio look

Banyak look "Motion"/Digital Twin berukuran 720×1280 (vertikal). Output 16:9 dari HeyGen jadi pillarbox. Tampilkan avatar sebagai kartu potret: `clip-path: inset(0% 34.2% 0% 34.2% round 30px)` pada wrapper video, lalu geser/skalakan wrapper (lihat `templates/outro-cta/`).
