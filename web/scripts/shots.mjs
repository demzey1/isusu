/**
 * Screenshot the app at phone, tablet and desktop widths and report any
 * horizontal overflow. Requires the app to be running.
 *
 *   npm run dev
 *   npm run shots
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "screenshots");
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const WIDTHS = (process.env.SHOT_WIDTHS ?? "390,768,1280").split(",").map(Number);

const probe = process.env.SHOT_PATHS ?? "/,/pools,/pools/create,/rules";
const paths = probe.split(",").filter(Boolean);

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
);
let failures = 0;

for (const width of WIDTHS) {
  const context = await browser.newContext({
    viewport: { width, height: width >= 768 ? 1000 : 844 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  for (const route of paths) {
    const url = `${BASE}${route}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
      await page.waitForTimeout(1200);
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const offenders = Array.from(document.querySelectorAll("body *"))
          .filter((el) => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && (rect.right > window.innerWidth + 1 || rect.left < -1);
          })
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
        return {
          scroll: doc.scrollWidth - window.innerWidth,
          offenders,
        };
      });

      const name = `${String(width).padStart(4, "0")}${route.replace(/\//g, "_") || "_home"}.png`;
      await page.screenshot({ path: path.join(OUT, name), fullPage: true });
      const flag = overflow.scroll > 1 ? "  ⚠ horizontal overflow" : "";
      if (overflow.scroll > 1) failures += 1;
      console.log(`${name}${flag}`);
      if (overflow.offenders.length) console.log(`    ${overflow.offenders.join(" | ")}`);
    } catch (error) {
      failures += 1;
      console.log(`${width} ${route} FAILED: ${error.message}`);
    }
  }

  await context.close();
}

await browser.close();
console.log(failures ? `\n${failures} issue(s).` : "\nNo horizontal overflow.");
