# Stack: skill, agen, konektor, plugin

Yang **wajib** untuk workflow ini ditandai ✅. Sisanya opsional: dipakai di setup asal dan membantu, tapi tidak dibutuhkan untuk menjalankan alurnya.

## Aplikasi dan akun

| | Untuk apa |
| --- | --- |
| ✅ [Claude Code](https://claude.com/claude-code) (CLI atau desktop app) | Menjalankan seluruh alur |
| ✅ Node.js 20+ dan FFmpeg (ada di PATH) | Tools di `tools/`, potong audio, gabung video |
| ✅ Akun HeyGen berbayar | TTS dan avatar. Login OAuth lewat `npx hyperframes auth login`; kredensial disimpan di `~/.heygen/credentials`. Tidak perlu API key di repo |
| Python 3.10+ | Hanya kalau memakai TTS/model lokal dari skill `media-use` |

## Skill proyek (`.claude/skills/`)

Daftar sumbernya dikunci di [`skills-lock.json`](../skills-lock.json). Pasang ulang dengan CLI skills (`npx skills add <owner/repo>`), atau salin folder skill dari repo sumbernya ke `.claude/skills/`.

| Skill | Sumber | Peran |
| --- | --- | --- |
| ✅ `video-youtube` | repo ini | Alur brief → final (skill utama) |
| ✅ `hyperframes`, `hyperframes-cli`, `hyperframes-registry` | `heygen-com/hyperframes` | Kontrak render HTML → video, CLI check/snapshot/render |
| ✅ `media-use` | `heygen-com/hyperframes` | Helper HeyGen API (`lib/heygen.mjs`, dipakai `tools/`), SFX bawaan, logo, musik |
| `humanizer` | `blader/humanizer` | Merapikan kalimat script supaya tidak terdengar seperti AI |
| `explainer-video`, `diagram-animation`, `isometric-animation`, `whiteboard-animation` | `iart-ai/explainer-video-skills` | Referensi craft (abaikan instruksi Remotion di dalamnya) |
| `kinetic-typography` | `iart-ai/kinetic-typography-skills` | Referensi craft teks bergerak |
| `caption-animation`, `lower-thirds` | `iart-ai/tiktok-video-skills` | Referensi craft caption dan lower third |
| `talking-head-b-roll` | `iart-ai/b-roll-skills` | Referensi craft b-roll di atas presenter |
| `copywriting`, `content-strategy`, `marketing-psychology`, `social`, `video` | `coreyhaines31/marketingskills` | Judul, hook, deskripsi, CTA |

## Agen

| Agen | Peran |
| --- | --- |
| ✅ `bab-mockup-builder` ([`.claude/agents/`](../.claude/agents/bab-mockup-builder.md)) | Subagen per bab demo berat, paralel, tanpa render |
| `general-purpose` (bawaan Claude Code) | Riset luas atau tugas sampingan |
| Agen orkestrator gaya "project shepherd" (opsional, dari koleksi agen pihak ketiga) | Memandu alur dan evaluasi; alurnya sendiri sudah ada di skill `video-youtube` |

## Konektor dan MCP

| | Peran |
| --- | --- |
| ✅ Firecrawl (konektor claude.ai, atau MCP Firecrawl) | Scrape halaman YouTube referensi (judul, chapter, transcript), docs resmi, dan landing page CTA. Alternatif: skill/tool web fetch lain |
| Google Flow MCP (lokal, opsional) | Cadangan video bicara saat kredit HeyGen habis |

Konektor lain di akun (email, kalender, dokumen, desain, dll.) tidak dipakai workflow ini.

## Plugin Claude Code (opsional)

Dipakai di setup asal sebagai kualitas hidup, tidak wajib. Tambahkan marketplace-nya di `/plugin` lalu install:

| Plugin | Marketplace (GitHub) | Guna |
| --- | --- | --- |
| `superpowers` | `anthropics/claude-plugins-official` | Disiplin proses (brainstorm, debugging, verifikasi) |
| `impeccable` | `pbakaus/impeccable` | Hook kualitas desain UI (thumbnail, mockup) |
| `taste-skill` | `Leonxlnx/taste-skill` | Arah estetika frontend |
| `caveman` | `JuliusBrussee/caveman` | Gaya jawaban ringkas (hemat token) |
| `agent-skills` | `addyosmani/agent-skills` | Skill engineering umum |
| `mattpocock-skills` | `mattpocock/skills` | Skill engineering umum |
| `andrej-karpathy-skills` | `multica-ai/andrej-karpathy-skills` | Pedoman coding |
| `ecc` | `affaan-m/ECC` | Koleksi agen dan skill |

## Aset yang sengaja tidak disertakan

- Logo merek (Gmail, Slack, Notion, dll.): ambil lewat `npx hyperframes media-use resolve --type logo`.
- SFX: dipakai langsung dari `.claude/skills/media-use/audio/assets/sfx` (lihat `CREDITS.md` di sana).
- Musik: dari katalog HeyGen (API `audio/sounds`) atau sumber berlisensi lain.
- Wajah dan suara presenter: milik masing-masing pengguna, hanya ada di `video/` (diabaikan git).
