// Rakit kerangka satu bab HyperFrames dari plan.json: VO berurutan + jeda, caption, SFX, index.html.
// Pakai: node tools/bab-build.mjs <folder-bab>
//
// plan.json (di folder bab):
// {
//   "video": "../..",                       // folder video (berisi vo/)
//   "lead": 0.8,                             // detik sebelum VO pertama
//   "clips": [["d1", 1.0], ["d2", 0.6]],     // [id VO, jeda sesudahnya]; jeda boleh diganti {"at": 12.5} untuk start absolut
//   "tail": 1.2,                             // detik sesudah VO terakhir
//   "sfx": [["click", 3.2, 0.5]],            // [nama file di assets/sfx tanpa .mp3, detik, volume]
//   "captions": true
// }
//
// Hasil (semua digenerate ulang tiap jalan, jangan diedit tangan):
//   assets/vo/<id>.wav, assets/sfx/*.mp3, timing.json, compositions/captions.html, index.html
// Scene visual ditulis tangan di compositions/scene.html. Blok di antara
// /* TIMING:START */ dan /* TIMING:END */ di scene.html diisi ulang otomatis:
//   T.<id> = detik mulai klip,  at("<id>", "kata", n) = detik mulai kata ke-n di klip itu.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { loadConfig } from "./config.mjs";

const dir = process.argv[2];
if (!dir) throw new Error("folder bab wajib");
const plan = JSON.parse(fs.readFileSync(path.join(dir, "plan.json"), "utf8"));
const videoDir = path.resolve(dir, plan.video ?? "../..");
const cfg = loadConfig();
const kitSfx = path.resolve(process.cwd(), cfg.paths.sfx);

const dur = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const r3 = (n) => Math.round(n * 1000) / 1000;

fs.mkdirSync(path.join(dir, "assets/vo"), { recursive: true });
fs.mkdirSync(path.join(dir, "assets/sfx"), { recursive: true });
fs.mkdirSync(path.join(dir, "compositions"), { recursive: true });

// 1. Susun VO berurutan.
let t = plan.lead ?? 0.8;
const clips = [];
const words = [];
for (const [id, gap] of plan.clips) {
  if (gap && typeof gap === "object" && "at" in gap) t = gap.at;
  const src = path.join(videoDir, "vo", `${id}.wav`);
  fs.copyFileSync(src, path.join(dir, "assets/vo", `${id}.wav`));
  const d = dur(src);
  clips.push({ id, start: r3(t), dur: r3(d) });
  const ws = JSON.parse(fs.readFileSync(path.join(videoDir, "vo", `${id}.words.json`), "utf8"));
  for (const w of ws) words.push({ clip: id, text: w.text, start: r3(t + w.start), end: r3(t + w.end) });
  t += d + (typeof gap === "number" ? gap : 0);
}
const last = clips[clips.length - 1];
const total = r3(Math.max(t, last.start + last.dur) + (plan.tail ?? 1.2));
fs.writeFileSync(path.join(dir, "timing.json"), JSON.stringify({ duration: total, clips, words }, null, 1));

// 2. SFX.
if (fs.existsSync(kitSfx)) for (const f of fs.readdirSync(kitSfx).filter((x) => /\.(mp3|wav)$/.test(x))) fs.copyFileSync(path.join(kitSfx, f), path.join(dir, "assets/sfx", f));
else if ((plan.sfx ?? []).length) console.warn(`peringatan: folder SFX ${kitSfx} tidak ada (paths.sfx di config)`);
const sfxTags = (plan.sfx ?? [])
  .map(([name, at, vol = 0.5], i) => {
    const d = Math.min(dur(path.join(dir, "assets/sfx", `${name}.mp3`)), 2.5);
    return `      <audio id="sfx-${i}" class="clip" src="assets/sfx/${name}.mp3" data-start="${at}" data-duration="${r3(d)}" data-track-index="${30 + (i % 3)}" data-volume="${vol}"></audio>`;
  })
  .join("\n");

// 3. Caption: frasa pendek (putus di tanda baca atau maks 6 kata / 38 huruf), kata aktif disorot.
const groups = [];
let cur = [];
const flush = () => cur.length && (groups.push(cur), (cur = []));
words.forEach((w, i) => {
  const prev = words[i - 1];
  if (prev && (prev.clip !== w.clip || w.start - prev.end > 0.6)) flush();
  cur.push(w);
  const len = cur.map((x) => x.text).join(" ").length;
  if (/[.,!?:;]$/.test(w.text) || cur.length >= 6 || len >= 38) flush();
});
flush();
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const capHtml = groups
  .map((g, gi) => {
    const s = g[0].start;
    const next = groups[gi + 1];
    const e = Math.min(next ? next[0].start : Infinity, g[g.length - 1].end + 0.5);
    const ws = g.map((w, wi) => `<span class="cw" data-t="${r3(w.start - s)}">${esc(w.text.replace(/[,;:]$/, ""))}</span>`).join(" ");
    const d = r3(Math.max(0.3, e - s));
    return `    <div id="cap-${gi}" class="clip cap" data-start="${s}" data-duration="${d}" data-cs="${s}" data-ce="${r3(s + d)}"><div class="pill">${ws}</div></div>`;
  })
  .join("\n");
const captions = `<template>
  <style>
    #root { position: absolute; inset: 0; pointer-events: none; }
    .cap { position: absolute; left: 0; right: 0; bottom: 64px; display: flex; justify-content: center; }
    .pill {
      max-width: 1400px; padding: 12px 26px; border-radius: 16px;
      background: rgba(20, 20, 19, 0.82); color: #f5f3ec;
      font-family: "Inter", sans-serif; font-weight: 700; font-size: 44px; line-height: 1.2;
      letter-spacing: -0.3px; text-align: center; opacity: 0;
    }
    .cw { color: #f5f3ec; }
  </style>
  <div id="root" data-composition-id="captions" data-width="1920" data-height="1080">
${capHtml}
  </div>
  <script>
    (function () {
      const root = document.querySelector('[data-composition-id="captions"]');
      const tl = gsap.timeline({ paused: true });
      // Tiap grup disembunyikan lewat anaknya (.pill) di luar jendelanya; kata aktif kuning lalu kembali putih.
      root.querySelectorAll(".cap").forEach((cap) => {
        const s = Number(cap.dataset.cs);
        const e = Number(cap.dataset.ce);
        const pill = cap.querySelector(".pill");
        tl.fromTo(pill, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.14, ease: "power2.out", immediateRender: false }, s);
        tl.to(pill, { opacity: 0, duration: 0.08 }, e - 0.08);
        const ws = [...cap.querySelectorAll(".cw")];
        ws.forEach((w, i) => {
          const ws0 = s + Number(w.dataset.t);
          const next = ws[i + 1] ? s + Number(ws[i + 1].dataset.t) : e - 0.08;
          tl.to(w, { color: "${cfg.brand.accent}", duration: 0.05 }, ws0);
          tl.to(w, { color: "#f5f3ec", duration: 0.05 }, Math.max(ws0 + 0.06, next));
        });
      });
      window.__timelines = window.__timelines || {};
      window.__timelines["captions"] = tl;
    })();
  </script>
</template>
`;
fs.writeFileSync(path.join(dir, "compositions/captions.html"), captions);

// 4. index.html.
const voTags = clips
  .map((c, i) => `      <audio id="vo-${c.id}" class="clip" src="assets/vo/${c.id}.wav" data-start="${c.start}" data-duration="${c.dur}" data-track-index="${20 + (i % 2)}" data-volume="1"></audio>`)
  .join("\n");
const capHost =
  plan.captions === false
    ? ""
    : `      <div id="captions" data-composition-id="captions" data-composition-src="compositions/captions.html" data-start="0" data-duration="${total}" data-track-index="9" data-track-kind="captions" data-width="1920" data-height="1080" style="z-index: 40"></div>`;
const index = `<!doctype html>
<!-- Digenerate oleh tools/bab-build.mjs dari plan.json. Jangan edit tangan; visual ada di compositions/scene.html. -->
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: #141413; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1920" data-height="1080">
      <div id="scene" data-composition-id="scene" data-composition-src="compositions/scene.html" data-start="0" data-duration="${total}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080" style="z-index: 1"></div>
${capHost}
${voTags}
${sfxTags}
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = gsap.timeline({ paused: true });
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(dir, "index.html"), index);

// 5. Isi ulang blok TIMING di scene.html (kalau ada).
const scenePath = path.join(dir, "compositions/scene.html");
if (fs.existsSync(scenePath)) {
  const T = Object.fromEntries(clips.map((c) => [c.id, c.start]));
  const W = words.map((w) => [w.clip, w.text.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, ""), w.start]);
  const block = `/* TIMING:START */
      const DUR = ${total};
      const T = ${JSON.stringify(T)};
      const __W = ${JSON.stringify(W)};
      // Detik mulai kata ke-n (1-based) di klip; kata ditulis huruf kecil tanpa tanda baca.
      const at = (clip, word, n = 1) => {
        const hits = __W.filter((w) => w[0] === clip && w[1] === word.toLowerCase());
        if (!hits[n - 1]) throw new Error("kata tidak ada di VO: " + clip + " " + word + " #" + n);
        return hits[n - 1][2];
      };
      /* TIMING:END */`;
  const s = fs.readFileSync(scenePath, "utf8");
  const re = /\/\* TIMING:START \*\/[\s\S]*?\/\* TIMING:END \*\//;
  if (re.test(s)) fs.writeFileSync(scenePath, s.replace(re, block));
}

console.log(`${path.basename(dir)}: ${total} dtk, ${clips.length} klip VO, ${groups.length} caption`);
