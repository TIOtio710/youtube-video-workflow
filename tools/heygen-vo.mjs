// Generate VO (HeyGen TTS, voice dari workflow.config.json) dari script.md: SATU panggilan per bab, lalu dipotong per paragraf.
// Pakai: node tools/heygen-vo.mjs <folder-video> [--only id1,id2] [--speed 1] [--max-chars 4800]
// Format script.md yang dibaca:
//   ## <judul bab>                      → batas bab (satu panggilan TTS per bab)
//   - `k1` teks paragraf...            → satu klip VO id k1
//   Satu klip TTS (`intro`).  lalu baris "> ..." → satu klip id intro (paragraf digabung)
//   ### Lafal  lalu baris "- Claude Code → Klod Kod" → ejaan bunyi untuk TTS. Script tetap ditulis normal;
//   kata hasil TTS dikembalikan ke ejaan asli di <id>.words.json, jadi caption dan at() tetap "Claude Code".
// Kenapa per bab: TTS ditagih per panggilan dengan pembulatan ke atas (terukur ±1 kredit per 30 dtk dimulai),
// jadi 39 panggilan per paragraf ±40 kredit, sedangkan per bab cukup ±6 panggilan (±14 kredit).
// Bab yang lebih panjang dari --max-chars dipecah di batas paragraf.
// Output per klip: <folder>/vo/<id>.wav, <id>.words.json (detik relatif ke awal klip), dan <id>.url.txt
// kalau klip itu satu panggilan utuh (dipakai lip-sync avatar). Audio mentah per panggilan disimpan di
// vo/_raw/ supaya bisa dipotong ulang tanpa bayar lagi. Idempoten: klip yang sudah ada dilewati.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { heygenJSON, heygenAuthHeaders } from "../.claude/skills/media-use/audio/scripts/lib/heygen.mjs";
import { loadConfig, need } from "./config.mjs";

const cfg = loadConfig();
const VOICE_ID = need(cfg.heygen.voiceId, "heygen.voiceId");
const args = process.argv.slice(2);
const folder = args[0];
if (!folder) throw new Error("folder video wajib, mis. video/2026-11-02-slug");
const opt = (name, def) => (args.indexOf(name) >= 0 ? args[args.indexOf(name) + 1] : def);
const only = opt("--only", null) ? new Set(opt("--only").split(",")) : null;
const speed = Number(opt("--speed", "1"));
const maxChars = Number(opt("--max-chars", String(cfg.heygen.ttsMaxChars))); // batas API /voices/speech 5.000 huruf

// Bab → daftar klip [{ id, text }].
export function parseScript(md) {
  const sections = [];
  let sec = null;
  let block = null;
  for (const line of md.split(/\r?\n/)) {
    if (line.startsWith("## ")) {
      sec = { title: line.slice(3).trim(), clips: [] };
      sections.push(sec);
      block = null;
      continue;
    }
    if (!sec) continue;
    const item = line.match(/^- `([\w-]+)` (.+)$/);
    if (item) {
      sec.clips.push({ id: item[1], text: item[2].trim() });
      continue;
    }
    const head = line.match(/klip TTS \(`([\w-]+)`\)/);
    if (head) {
      block = { id: head[1], parts: [] };
      sec.clips.push(block);
      continue;
    }
    if (block && line.startsWith(">")) {
      const t = line.replace(/^>\s?/, "").trim();
      if (t) block.parts.push(t);
    }
  }
  return sections
    .map((s) => ({ ...s, clips: s.clips.map((c) => (c.parts ? { id: c.id, text: c.parts.join(" ") } : c)) }))
    .filter((s) => s.clips.length);
}

// Daftar lafal dari bagian "### Lafal": [[ejaan asli, ejaan bunyi]], yang terpanjang dulu.
export function parseLexicon(md) {
  const lex = [];
  let on = false;
  for (const line of md.split(/\r?\n/)) {
    if (/^#{2,}\s/.test(line)) {
      on = /^#{2,}\s+Lafal\b/i.test(line);
      continue;
    }
    const m = on && line.match(/^\s*-?\s*(.+?)\s*(?:→|->)\s*(.+?)\s*$/);
    if (m) lex.push([m[1].replace(/[`*]/g, ""), m[2].replace(/[`*]/g, "")]);
  }
  return lex.sort((a, b) => b[0].length - a[0].length);
}
const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const norm = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const dur = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString());
const r3 = (n) => Math.round(n * 1000) / 1000;

const scriptMd = fs.readFileSync(path.join(folder, "script.md"), "utf8");
const LEX = parseLexicon(scriptMd);
// Teks yang dikirim ke TTS: tanda kutip dibuang, istilah diganti ejaan bunyi.
const speak = (t) =>
  LEX.reduce((acc, [from, to]) => acc.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escRe(from)}(?![\\p{L}\\p{N}])`, "gu"), to), t.replace(/["“”]/g, ""));
// Kembalikan kata hasil TTS ("Klod", "Kod") ke ejaan asli ("Claude Code") untuk caption dan at().
function restore(words) {
  const res = [];
  for (let i = 0; i < words.length; ) {
    const hit = LEX.find(([, to]) => {
      const toks = to.split(/\s+/);
      return toks.every((t, k) => words[i + k] && norm(words[i + k].text) === norm(t));
    });
    if (!hit) {
      res.push(words[i++]);
      continue;
    }
    const n = hit[1].split(/\s+/).length;
    const last = words[i + n - 1];
    const tail = last.text.match(/[^\p{L}\p{N}]+$/u)?.[0] ?? "";
    res.push({ ...words[i], text: hit[0] + tail, end: last.end });
    i += n;
  }
  return res;
}
if (LEX.length) console.log("lafal:", LEX.map(([a, b]) => `${a}→${b}`).join(", "));

const out = path.join(folder, "vo");
const raw = path.join(out, "_raw");
fs.mkdirSync(raw, { recursive: true });

// Satu panggilan TTS (atau baca cache _raw). Kembalikan { mp3, words, url }.
async function tts(key, text) {
  const mp3 = path.join(raw, `${key}.mp3`);
  const meta = path.join(raw, `${key}.json`);
  if (fs.existsSync(mp3) && fs.existsSync(meta)) {
    const cached = JSON.parse(fs.readFileSync(meta, "utf8"));
    if (cached.text === undefined || cached.text === text) return { mp3, ...cached };
    console.log(`cache ${key} beda teks (script atau lafal berubah), generate ulang`);
  }
  const payload = await heygenJSON("/voices/speech", {
    method: "POST",
    headers: heygenAuthHeaders(),
    body: { text, voice_id: VOICE_ID, speed, language: cfg.language },
  });
  const inner = payload.data ?? payload;
  if (!inner.audio_url) throw new Error(`${key}: tidak ada audio_url`);
  const res = await fetch(inner.audio_url);
  if (!res.ok) throw new Error(`${key}: download gagal ${res.status}`);
  fs.writeFileSync(mp3, Buffer.from(await res.arrayBuffer()));
  const words = (inner.word_timestamps ?? [])
    .filter((w) => w && typeof w.word === "string" && !/^<.*>$/.test(w.word.trim()))
    .map((w) => ({ text: w.word, start: w.start, end: w.end }));
  fs.writeFileSync(meta, JSON.stringify({ words, url: inner.audio_url, text }));
  console.log("TTS", key, `${text.length} huruf`, `${words.length} kata`);
  return { mp3, words, url: inner.audio_url };
}

// Cocokkan kata TTS ke paragraf berdasarkan huruf (tahan beda tokenisasi, mis. "task-nya", "n8n,").
function align(clips, words) {
  const groups = [];
  let i = 0;
  for (const c of clips) {
    const target = norm(speak(c.text)).length;
    const g = [];
    let got = 0;
    while (i < words.length && got < target) {
      got += norm(words[i].text).length;
      g.push(words[i++]);
    }
    if (got !== target) console.warn(`peringatan: ${c.id} huruf ${got}/${target}, cek potongannya`);
    groups.push(g);
  }
  if (i < words.length) console.warn(`peringatan: ${words.length - i} kata TTS tersisa tanpa paragraf`);
  return groups;
}

function cut(mp3, from, to, wav) {
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(from), "-to", String(to), "-i", mp3, "-ar", "48000", "-ac", "1", wav]);
}

let calls = 0;
for (const sec of parseScript(scriptMd)) {
  const todo = sec.clips.filter((c) => (!only || only.has(c.id)) && !fs.existsSync(path.join(out, `${c.id}.wav`)));
  if (!todo.length) continue;
  // Pecah bab di batas paragraf kalau terlalu panjang untuk satu panggilan.
  const chunks = [];
  let cur = [];
  for (const c of sec.clips) {
    const len = cur.reduce((n, x) => n + x.text.length + 1, 0);
    if (cur.length && len + c.text.length > maxChars) {
      chunks.push(cur);
      cur = [];
    }
    cur.push(c);
  }
  if (cur.length) chunks.push(cur);
  for (const chunk of chunks) {
    if (!chunk.some((c) => todo.includes(c))) continue;
    const key = chunk.map((c) => c.id).join("+");
    const before = fs.existsSync(path.join(raw, `${key}.mp3`)) ? fs.statSync(path.join(raw, `${key}.mp3`)).mtimeMs : 0;
    const { mp3, words, url } = await tts(key, chunk.map((c) => speak(c.text)).join(" "));
    if (fs.statSync(mp3).mtimeMs !== before) calls++;
    const total = dur(mp3);
    const groups = align(chunk, words);
    chunk.forEach((c, k) => {
      if (!todo.includes(c)) return;
      const g = groups[k];
      if (!g.length) throw new Error(`${c.id}: tidak ada kata yang cocok`);
      // Potong di tengah jeda antar paragraf.
      const prevEnd = k > 0 && groups[k - 1].length ? groups[k - 1].at(-1).end : 0;
      const nextStart = k < chunk.length - 1 && groups[k + 1].length ? groups[k + 1][0].start : total;
      const from = k === 0 ? 0 : r3((prevEnd + g[0].start) / 2);
      const to = k === chunk.length - 1 ? total : r3((g.at(-1).end + nextStart) / 2);
      const wav = path.join(out, `${c.id}.wav`);
      cut(mp3, from, to, wav);
      const ws = restore(g).map((w, n) => ({ id: `w${n}`, text: w.text, start: r3(w.start - from), end: r3(w.end - from) }));
      fs.writeFileSync(path.join(out, `${c.id}.words.json`), JSON.stringify(ws, null, 1));
      if (chunk.length === 1) fs.writeFileSync(path.join(out, `${c.id}.url.txt`), url);
      console.log("ok", c.id, `${dur(wav).toFixed(2)} dtk`, `${ws.length} kata`);
    });
  }
}
console.log(`selesai: ${calls} panggilan TTS baru`);
