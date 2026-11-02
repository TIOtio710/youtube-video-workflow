// Gabung render per bab jadi satu video final + musik latar + normalisasi loudness.
// Pakai: node tools/gabung.mjs <folder-video> <slug> [--music final/music/x.mp3] [--music-vol 0.14]
// Input: <folder>/final/bab/*.mp4 (urut nama: 00-..., 01-..., dst.)
// Output: <folder>/final/<slug>.mp4 (loudness dari config, default −14 LUFS / −1,5 dBTP), plus <slug>.srt dari timing tiap bab.
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { loadConfig } from "./config.mjs";

const args = process.argv.slice(2);
const [folder, slug] = args;
if (!folder || !slug) throw new Error("pakai: node tools/gabung.mjs <folder-video> <slug>");
const opt = (name, def) => (args.indexOf(name) >= 0 ? args[args.indexOf(name) + 1] : def);
const cfg = loadConfig();
const musicVol = Number(opt("--music-vol", String(cfg.audio.musicVolume)));
const LN = `loudnorm=I=${cfg.audio.loudnessLufs}:TP=${cfg.audio.truePeakDb}:LRA=11`;
const fin = path.join(folder, "final");
const tmp = path.join(fin, "_tmp");
fs.mkdirSync(tmp, { recursive: true });

const ff = (a) => execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...a], { stdio: ["ignore", "inherit", "pipe"] });
const probe = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());

// 1. Concat bab (stream copy: semua render memakai setelan sama).
const babs = fs.readdirSync(path.join(fin, "bab")).filter((f) => f.endsWith(".mp4")).sort();
if (!babs.length) throw new Error("final/bab kosong");
const list = path.join(tmp, "list.txt");
fs.writeFileSync(list, babs.map((b) => `file '${path.resolve(fin, "bab", b).replace(/\\/g, "/")}'`).join("\n"));
const concat = path.join(tmp, "concat.mp4");
ff(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", concat]);
const total = probe(concat);
console.log("bab:", babs.join(", "), `→ ${total.toFixed(2)} dtk`);

// 2. Musik: loop dengan crossfade 2 dtk sampai menutup durasi video, fade in/out.
const music = opt("--music", null) ?? (() => {
  const dir = path.join(fin, "music");
  const f = fs.existsSync(dir) && fs.readdirSync(dir).find((x) => /\.(mp3|wav|m4a)$/.test(x));
  return f ? path.join(dir, f) : null;
})();
let audioIn = ["-i", concat];
let filter;
if (music) {
  const md = probe(music);
  const xf = 2;
  const n = Math.max(1, Math.ceil((total + xf) / (md - xf)));
  const inputs = [];
  for (let i = 0; i < n; i++) inputs.push("-i", music);
  let chain = "";
  let last = "[1:a]";
  for (let i = 1; i < n; i++) {
    const out = `[m${i}]`;
    chain += `${last}[${i + 1}:a]acrossfade=d=${xf}:c1=tri:c2=tri${out};`;
    last = out;
  }
  const fadeOut = Math.max(0, total - 3).toFixed(2);
  filter =
    chain +
    `${last}atrim=0:${total.toFixed(3)},afade=t=in:d=1.5,afade=t=out:st=${fadeOut}:d=3,volume=${musicVol}[bgm];` +
    `[0:a][bgm]amix=inputs=2:duration=first:normalize=0[mix]`;
  audioIn = ["-i", concat, ...inputs];
  console.log(`musik: ${path.basename(music)} ×${n}, volume ${musicVol}`);
} else {
  filter = "[0:a]anull[mix]";
  console.log("musik: tidak ada");
}

// 3. Loudness 2 tahap: ukur, lalu normalisasi linear ke target config.
const premix = path.join(tmp, "premix.wav");
ff([...audioIn, "-filter_complex", filter, "-map", "[mix]", "-ar", "48000", premix]);
// ffmpeg menulis laporan ke stderr; spawnSync mengembalikannya juga saat sukses.
const ffErr = (a) => spawnSync("ffmpeg", ["-hide_banner", ...a], { encoding: "utf8" }).stderr ?? "";
const stderr = ffErr(["-i", premix, "-af", `${LN}:print_format=json`, "-f", "null", "-"]);
const m = JSON.parse(stderr.slice(stderr.lastIndexOf("{"), stderr.lastIndexOf("}") + 1) || "{}");
const ln = m.input_i
  ? `${LN}:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true`
  : LN;
const out = path.join(fin, `${slug}.mp4`);
ff(["-i", concat, "-i", premix, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-af", ln, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]);

// 4. Cek hasil.
const check = ffErr(["-i", out, "-af", "ebur128=peak=true:framelog=quiet", "-f", "null", "-"]);
const I = check.match(/I:\s+(-?[\d.]+) LUFS/g)?.pop();
const P = check.match(/Peak:\s+(-?[\d.]+) dBFS/g)?.pop();
console.log("final:", out, `${probe(out).toFixed(2)} dtk`, I, P);

// 5. SRT: kata dari timing.json tiap bab, digeser durasi bab sebelumnya, dipotong per frasa.
const srtTime = (t) => {
  const ms = Math.round(t * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
const cues = [];
let offset = 0;
for (const b of babs) {
  const timing = path.join(folder, "bab", b.replace(/\.mp4$/, ""), "timing.json");
  if (fs.existsSync(timing)) {
    const { words } = JSON.parse(fs.readFileSync(timing, "utf8"));
    let cur = [];
    const flush = () => {
      if (!cur.length) return;
      cues.push([offset + cur[0].start, offset + cur[cur.length - 1].end, cur.map((w) => w.text).join(" ")]);
      cur = [];
    };
    words.forEach((w, i) => {
      const prev = words[i - 1];
      if (prev && (prev.clip !== w.clip || w.start - prev.end > 0.6)) flush();
      cur.push(w);
      if (/[.!?]$/.test(w.text) || cur.length >= 10) flush();
    });
    flush();
  }
  offset += probe(path.join(fin, "bab", b));
}
fs.writeFileSync(path.join(fin, `${slug}.srt`), cues.map(([s, e, t], i) => `${i + 1}\n${srtTime(s)} --> ${srtTime(e)}\n${t}\n`).join("\n"));
console.log("srt:", cues.length, "baris");
