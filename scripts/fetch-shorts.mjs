// Fetches the newest YouTube Shorts at build time and stores them locally,
// so visitors never contact YouTube/Google just by opening the page.
// Output: src/data/shorts.json and public/images/shorts/<id>.jpg (both gitignored).
// Never fails the build: without network the Shorts section simply stays hidden.
import { mkdir, writeFile, readdir, unlink } from "node:fs/promises";
import { existsSync } from "node:fs";

const CHANNEL_ID = "UCtiQlpGmReXnpVsuhRxdc3A";
// "UUSH" + channel id without "UC" is YouTube's Shorts-only uploads playlist.
const FEED = `https://www.youtube.com/feeds/videos.xml?playlist_id=UUSH${CHANNEL_ID.slice(2)}`;
const COUNT = 5;
const DATA_FILE = "src/data/shorts.json";
const IMAGE_DIR = "public/images/shorts";

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

async function main() {
  const res = await fetch(FEED);
  if (!res.ok) throw new Error(`feed answered ${res.status}`);
  const xml = await res.text();

  const shorts = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .map(([, entry]) => ({
      id: entry.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1],
      title: decode(entry.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").trim(),
    }))
    .filter((s) => s.id)
    .slice(0, COUNT);

  await mkdir(IMAGE_DIR, { recursive: true });
  await mkdir("src/data", { recursive: true });

  const saved = [];
  for (const short of shorts) {
    const img = await fetch(`https://i.ytimg.com/vi/${short.id}/hqdefault.jpg`);
    if (!img.ok) continue;
    await writeFile(`${IMAGE_DIR}/${short.id}.jpg`, Buffer.from(await img.arrayBuffer()));
    saved.push(short);
  }

  // Remove thumbnails of Shorts that dropped out of the list.
  const keep = new Set(saved.map((s) => `${s.id}.jpg`));
  for (const file of await readdir(IMAGE_DIR)) {
    if (!keep.has(file)) await unlink(`${IMAGE_DIR}/${file}`);
  }

  await writeFile(DATA_FILE, JSON.stringify(saved, null, 2) + "\n");
  console.log(`fetch-shorts: ${saved.length} Shorts saved.`);
}

main().catch(async (err) => {
  console.warn(`fetch-shorts: skipped (${err.message}). The Shorts section stays hidden.`);
  if (!existsSync(DATA_FILE)) {
    await mkdir("src/data", { recursive: true });
    await writeFile(DATA_FILE, "[]\n");
  }
});
