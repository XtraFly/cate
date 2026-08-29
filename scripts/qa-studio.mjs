import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const url = process.argv[2] ?? "http://127.0.0.1:8080/";
await mkdir("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE", m.text());
});
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.screenshot({ path: "/workspace/screenshots/qa-cate.png", fullPage: false });

await page.getByRole("button", { name: "@PoorGoat_" }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/qa-poorgoat.png" });

await page.getByRole("button", { name: "@criptow_" }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/qa-criptow.png" });

const cSize = page.locator("label").filter({ hasText: "C size" }).locator('[role="slider"]');
await cSize.focus();
const box = await cSize.boundingBox();
if (box) {
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2);
  await page.mouse.up();
}
await page.waitForTimeout(300);
await page.screenshot({ path: "/workspace/screenshots/qa-csize.png" });

await page.getByPlaceholder("X handle").fill("elonmusk");
await page.getByRole("button", { name: /Pull PFP/ }).click();
try {
  await page.waitForFunction(() => !document.body.innerText.includes("Pulling"), { timeout: 15000 });
} catch {}
await page.waitForTimeout(800);
await page.screenshot({ path: "/workspace/screenshots/qa-xpull.png" });

const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 8000 }).catch(() => null),
  page.getByRole("button", { name: "Download" }).click(),
]);
console.log("download", download ? download.suggestedFilename() : "none");

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(url, { waitUntil: "networkidle" });
await mobile.waitForTimeout(400);
await mobile.evaluate(() => window.scrollTo(0, 700));
await mobile.waitForTimeout(400);
await mobile.screenshot({ path: "/workspace/screenshots/qa-mobile-dock.png" });

const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log("mobileOverflow", overflow);
await browser.close();
