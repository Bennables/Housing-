// Renders video/gapless-launch.html to an MP4, one frame at a time, so timing is exact.
//
//   node video/render.mjs                    -> video/out/gapless-launch.mp4
//   node video/render.mjs --stills 3,10.5,16 -> video/out/still-<t>.png for a quick check
//
// Needs Google Chrome installed, and an ffmpeg binary on PATH or in FFMPEG_PATH.
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "out");
mkdirSync(outDir, { recursive: true });

const FPS = 30;
const args = process.argv.slice(2);
const stillsArg = args.includes("--stills") ? args[args.indexOf("--stills") + 1] : null;

const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(here, "gapless-launch.html")).href + "?render");
await page.evaluate(() => window.ready);
const stage = page.locator("#stage");

if (stillsArg) {
  for (const t of stillsArg.split(",").map(Number)) {
    await page.evaluate((s) => window.seek(s), t);
    await stage.screenshot({ path: join(outDir, `still-${t}.png`) });
  }
  console.log(`Saved ${stillsArg.split(",").length} stills to ${outDir}`);
} else {
  const duration = await page.evaluate(() => window.DURATION);
  const frames = Math.round(duration * FPS);
  const tmp = mkdtempSync(join(tmpdir(), "gapless-frames-"));
  for (let i = 0; i < frames; i++) {
    await page.evaluate((s) => window.seek(s), i / FPS);
    await stage.screenshot({ path: join(tmp, `f${String(i).padStart(5, "0")}.png`) });
    if (i % 90 === 0) console.log(`frame ${i}/${frames}`);
  }
  const ffmpeg = process.env.FFMPEG_PATH ?? "ffmpeg";
  const out = join(outDir, "gapless-launch.mp4");
  execFileSync(ffmpeg, [
    "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(tmp, "f%05d.png"),
    "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out,
  ], { stdio: "inherit" });
  rmSync(tmp, { recursive: true, force: true });
  console.log(`Wrote ${out}`);
}

await browser.close();
