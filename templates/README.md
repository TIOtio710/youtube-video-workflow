# Templates

| Folder | Isi |
| --- | --- |
| `claude-ui/` | Mockup Claude (chat): sidebar, home, chat, kursor, zoom ala Screen Studio. Ganti prompt dan jawaban di `compositions/claude.html`; kalau panjang teks berubah, sesuaikan posisi tombol aksi dan target zoom. |
| `claude-code-ui/` | Kit mockup Claude Desktop tab Code (Scheduled tasks, form, detail, sesi run) + Slack. Bukan composition, tapi potongan CSS/markup/helper untuk ditempel ke `scene.html`. Baca README-nya. |
| `outro-cta/` | Bab penutup ajakan generik dengan avatar kartu potret. Dibuat sekali, dipakai ulang tanpa generate. |

Aset biner (SFX, logo merek) tidak disertakan:

- `claude-ui/index.html` memakai `assets/sfx/*.mp3`. Salin dari `.claude/skills/media-use/audio/assets/sfx/` ke `templates/claude-ui/assets/sfx/`.
- Logo: `npx hyperframes media-use resolve --type logo --intent "<merek> logo" --project <folder-bab>`.

Mockup dibangun dari dokumentasi resmi pada November 2026. Aplikasi aslinya bisa berubah; cocokkan dulu sebelum dipakai di video.
