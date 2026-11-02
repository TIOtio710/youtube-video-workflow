// Baca workflow.config.json dari root proyek (folder tempat perintah dijalankan) atau dari $WORKFLOW_CONFIG.
// Semua setelan personal (voice, avatar, brand, target audio) ada di file itu, bukan di kode tool.
import fs from "node:fs";
import path from "node:path";

const DEFAULTS = {
  language: "id",
  heygen: {
    voiceId: "",
    avatarLookId: "",
    avatarEngine: "avatar_iii",
    aspect: "16:9",
    ttsMaxChars: 4800,
  },
  brand: { accent: "#FFD600", dark: "#141413", light: "#faf9f5" },
  audio: { musicVolume: 0.14, loudnessLufs: -14, truePeakDb: -1.5 },
  paths: { sfx: ".claude/skills/media-use/audio/assets/sfx" },
};

const merge = (a, b) =>
  Object.fromEntries(
    Object.keys({ ...a, ...b }).map((k) =>
      [k, a[k] && typeof a[k] === "object" && !Array.isArray(a[k]) ? merge(a[k], b?.[k] ?? {}) : (b?.[k] ?? a[k])],
    ),
  );

export function loadConfig() {
  const file = process.env.WORKFLOW_CONFIG ?? path.join(process.cwd(), "workflow.config.json");
  const user = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
  return merge(DEFAULTS, user);
}

// Ambil nilai wajib; berhenti dengan pesan jelas kalau belum diisi.
export function need(value, key) {
  if (!value) throw new Error(`${key} belum diisi di workflow.config.json (lihat workflow.config.example.json)`);
  return value;
}
