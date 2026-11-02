# youtube-video-workflow

Workflow Claude Code untuk memproduksi **video YouTube tutorial 8–10 menit**, dari brief + video referensi sampai file final siap upload. Visual dibuat sebagai HTML yang di-render jadi video ([HyperFrames](https://github.com/heygen-com/hyperframes)), narasi dan presenter memakai HeyGen (TTS + avatar).

Uji coba pertama: video 8 menit dalam ±1 jam 20 menit mesin, ditinggal tanpa campur tangan setelah pertanyaan awal. Dengan aturan hemat di repo ini, biaya HeyGen diperkirakan **±20–23 kredit per video** (sebelumnya 94).

## Isi repo

```
.claude/
  skills/video-youtube/     skill utama: alur, pertanyaan awal, format script, biaya HeyGen
  agents/bab-mockup-builder.md   subagen untuk bab demo (mockup UI beranimasi)
tools/
  config.mjs        baca workflow.config.json
  heygen-vo.mjs     TTS satu panggilan per bab → klip per paragraf + timestamp kata
  heygen-video.mjs  avatar HeyGen, lip-sync dari audio TTS, engine default avatar_iii
  bab-build.mjs     plan.json → proyek HyperFrames per bab (VO, caption, SFX, konstanta waktu)
  gabung.mjs        concat bab + musik loop + loudness + SRT
templates/          mockup Claude chat, kit Claude Desktop (Code), penutup CTA generik
examples/           contoh script.md
docs/               stack (skill/agen/konektor/plugin) dan pelajaran dari video pertama
workflow.config.example.json   setelan pribadi (voice, avatar, brand, audio)
CLAUDE.md.example              instruksi proyek untuk Claude Code
skills-lock.json               sumber skill pihak ketiga
```

## Mulai

1. **Prasyarat:** Claude Code, Node.js 20+, FFmpeg di PATH, akun HeyGen berbayar. Detail dan opsi lain di [docs/stack.md](docs/stack.md).
2. **Pasang skill pihak ketiga** dari [`skills-lock.json`](skills-lock.json) ke `.claude/skills/`. Minimal `hyperframes`, `hyperframes-cli`, `hyperframes-registry`, dan `media-use` (semuanya dari `heygen-com/hyperframes`). Tools memakai helper `.claude/skills/media-use/audio/scripts/lib/heygen.mjs`.
3. **Login HeyGen** di terminal: `npx hyperframes auth login`, cek dengan `npx hyperframes auth status`.
4. **Setelan:**
   ```bash
   cp workflow.config.example.json workflow.config.json
   cp CLAUDE.md.example CLAUDE.md
   ```
   Isi `heygen.voiceId` dan `heygen.avatarLookId`. ID voice: `GET /v3/voices?type=private`. ID look: `GET /v3/avatars/looks?group_id=<grup>`. Pastikan look-nya mendukung `avatar_iii` (`supported_api_engines`).
5. Buka Claude Code di folder ini dan beri brief, mis. *"Bikin video YouTube tentang <topik>, referensinya <link>"*. Skill `video-youtube` mengajukan pertanyaan awal lalu menjalankan alurnya. Bilang kalau akan ditinggal, supaya semua pertanyaan diajukan di depan.

## Alur singkat

Pertanyaan awal → riset (referensi + docs resmi) → script → VO per bab → avatar pembuka (background) → `plan.json` per bab (durasi pasti) → storyboard → visual per bab (subagen untuk demo) → check + snapshot → render per bab → gabung → thumbnail + paket upload → evaluasi. Detail: [`.claude/skills/video-youtube/SKILL.md`](.claude/skills/video-youtube/SKILL.md).

## Biaya HeyGen (ringkas)

| | Tarif |
| --- | --- |
| TTS | ±1 kredit per 30 dtk dimulai, **per panggilan** → satu panggilan per bab |
| Avatar III (`avatar_iii`) | ±5–6 kredit/menit (perkiraan) |
| Avatar IV (default HeyGen kalau `engine` kosong) | ±31–33 kredit/menit |

Detail dan cara mengukur: [biaya-heygen.md](.claude/skills/video-youtube/references/biaya-heygen.md).

## Batasan

- Mockup aplikasi dibangun dari dokumentasi, bukan dari aplikasi asli. Cocokkan dengan rekaman/screenshot asli sebelum upload.
- Jangan mengotomasi aplikasi yang syaratnya melarang akses otomatis (mis. claude.ai). Repo ini tidak melakukannya: semua demo adalah mockup HTML.
- Video dengan avatar dan suara AI realistis wajib diberi label "Altered or synthetic content" di YouTube Studio.
- Dites di Windows 11 (Git Bash), Node 24, FFmpeg 7+.

## Lisensi

[MIT](LICENSE). Skill pihak ketiga di `skills-lock.json` tidak termasuk di repo ini dan mengikuti lisensi repo sumbernya masing-masing.
