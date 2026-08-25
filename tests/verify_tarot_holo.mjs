import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";

async function main() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1440, height: 960 },
        deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    const errors = [];
    page.on("pageerror", (err) => errors.push(`[Page Error] ${err.message}`));
    page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(`[Console Error] ${msg.text()}`);
    });

    console.log("Navigating to http://localhost:4321/tarot-showcase ...");
    await page.goto("http://localhost:4321/tarot-showcase", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    const tmpDir = path.resolve(process.cwd(), "../../.tmp");
    const targetDir = fs.existsSync(path.dirname(tmpDir)) ? tmpDir : path.resolve(process.cwd(), ".tmp");
    fs.mkdirSync(targetDir, { recursive: true });

    // 1. Resting Front View
    await page.screenshot({ path: path.join(targetDir, "tarot-1-resting.png") });
    console.log(`Screenshot 1 (Resting): ${path.join(targetDir, "tarot-1-resting.png")}`);

    const cards = page.locator("[data-holo-project-card]");
    const card1 = cards.nth(0);
    const card2 = cards.nth(1);

    const box2 = await card2.boundingBox();
    if (box2) {
        // 2. Hover Card 2 Top-Right (Tilt + Spectral Color-Dodge Foil)
        await page.mouse.move(box2.x + box2.width * 0.85, box2.y + box2.height * 0.20);
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(targetDir, "tarot-2-hover-tilt.png") });
        console.log(`Screenshot 2 (Tilt + Foil): ${path.join(targetDir, "tarot-2-hover-tilt.png")}`);

        // 3. Hover Card 2 Bottom-Left (Spotlight Glare shift)
        await page.mouse.move(box2.x + box2.width * 0.20, box2.y + box2.height * 0.80);
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(targetDir, "tarot-3-hover-glare.png") });
        console.log(`Screenshot 3 (Glare shift): ${path.join(targetDir, "tarot-3-hover-glare.png")}`);

        // 4. Click Card 2 to Flip to Back Face
        await card2.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(targetDir, "tarot-4-flipped-back.png") });
        console.log(`Screenshot 4 (Flipped Back): ${path.join(targetDir, "tarot-4-flipped-back.png")}`);
    }

    console.log("Errors:", errors);
    await browser.close();
    console.log(JSON.stringify({ ok: errors.length === 0, errors }));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
