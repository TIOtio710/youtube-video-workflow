// Generate video avatar HeyGen dari heygen/script.txt (atau audio TTS yang sudah ada), poll, lalu download ke heygen/<name>.mp4.
// Pakai: node tools/heygen-video.mjs <folder-video> [avatar_id] [--aspect 16:9] [--remove-bg] [--bg #00FF00] [--speed 1.12] [--engine avatar_iii]
//        Engine default dari config (avatar_iii, paling hemat). Tanpa field engine HeyGen memakai avatar_iv (±6× lebih mahal).
//        [--audio vo/intro.url.txt --name intro]  → lip-sync ke audio TTS yang sudah ada (heygen-vo.mjs), hasil heygen/intro.mp4
// Login: npx hyperframes auth login (OAuth, kredensial di ~/.heygen/credentials). Memakai kredit HeyGen.
import fs from "node:fs";
import path from "node:path";
import { heygenJSON, heygenAuthHeaders } from "../.claude/skills/media-use/audio/scripts/lib/heygen.mjs";
import { loadConfig, need } from "./config.mjs";

const args = process.argv.slice(2);
const folder = args[0];
if (!folder) throw new Error("folder video wajib, mis. video/2026-11-02-slug");
const cfg = loadConfig();
const avatarId = args[1] && !args[1].startsWith("--") ? args[1] : need(cfg.heygen.avatarLookId, "heygen.avatarLookId");
const engineIdx = args.indexOf("--engine");
const aspectIdx = args.indexOf("--aspect"); // default 16:9 (YouTube); 9:16 hanya untuk potongan Shorts
const aspect = aspectIdx >= 0 ? args[aspectIdx + 1] : cfg.heygen.aspect;
if (!["16:9", "9:16"].includes(aspect)) throw new Error(`--aspect harus 16:9 atau 9:16, dapat: ${aspect}`);

const audioIdx = args.indexOf("--audio"); // file berisi audio_url HeyGen (dari tools/heygen-vo.mjs)
const nameIdx = args.indexOf("--name"); // nama output, default "avatar"
const name = nameIdx >= 0 ? args[nameIdx + 1] : "avatar";
const body = {
  type: "avatar",
  avatar_id: avatarId,
  title: `${path.basename(folder)}-${name}`,
  resolution: "1080p",
  aspect_ratio: aspect,
};
if (audioIdx >= 0) {
  body.audio_url = fs.readFileSync(path.join(folder, args[audioIdx + 1]), "utf8").trim();
} else {
  body.voice_id = need(cfg.heygen.voiceId, "heygen.voiceId");
  body.script = fs.readFileSync(path.join(folder, "heygen", "script.txt"), "utf8").trim().replace(/\n\s*\n/g, "\n\n");
}
if (args.includes("--remove-bg")) body.remove_background = true;
const speedIdx = args.indexOf("--speed"); // voice_settings.speed 0.5-1.5 (default 1)
if (speedIdx >= 0) body.voice_settings = { speed: Number(args[speedIdx + 1]) };
const bgIdx = args.indexOf("--bg"); // warna latar hex, mis. #00FF00 (butuh avatar matting)
if (bgIdx >= 0) body.background = { type: "color", value: args[bgIdx + 1] };
body.engine = { type: engineIdx >= 0 ? args[engineIdx + 1] : cfg.heygen.avatarEngine };
console.log("engine:", body.engine.type);

fs.mkdirSync(path.join(folder, "heygen"), { recursive: true });
const idFile = path.join(folder, "heygen", name === "avatar" ? "video_id.txt" : `video_id-${name}.txt`);
let videoId = fs.existsSync(idFile) ? fs.readFileSync(idFile, "utf8").trim() : "";
if (!videoId) {
  const res = await heygenJSON("/videos", { method: "POST", headers: heygenAuthHeaders(), body });
  videoId = res.data.video_id;
  fs.writeFileSync(idFile, videoId); // supaya rerun tidak generate ulang (kredit)
  console.log("video_id:", videoId);
} else {
  console.log("lanjut poll video_id lama:", videoId);
}

while (true) {
  const { data } = await heygenJSON(`/videos/${videoId}`, { headers: heygenAuthHeaders() });
  console.log(new Date().toISOString(), data.status);
  if (data.status === "completed") {
    const out = path.join(folder, "heygen", `${name}.mp4`);
    const r = await fetch(data.video_url);
    if (!r.ok) throw new Error(`download gagal: ${r.status}`);
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    console.log("tersimpan:", out, "durasi:", data.duration);
    break;
  }
  if (data.status === "failed") throw new Error(`${data.failure_code}: ${data.failure_message}`);
  await new Promise((s) => setTimeout(s, 30000));
}
