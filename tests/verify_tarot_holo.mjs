import { chromium } from "playwright";

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

    // 1. Resting Front View
    await page.screenshot({ path: ".tmp/tarot-1-resting.png" });
    console.log("Screenshot 1 (Resting): .tmp/tarot-1-resting.png");

    const card = page.locator("[data-holo-project-card], [data-poke-holo-card], .card.interactive").first();
    const box = await card.boundingBox();

    if (box) {
        // 2. Hover Top-Right (Tilt + Spectral Color-Dodge Foil)
        await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.20);
        await page.waitForTimeout(400);
        await page.screenshot({ path: ".tmp/tarot-2-hover-tilt.png" });
        console.log("Screenshot 2 (Tilt + Foil): .tmp/tarot-2-hover-tilt.png");

        // 3. Hover Bottom-Left (Spotlight Glare shift)
        await page.mouse.move(box.x + box.width * 0.20, box.y + box.height * 0.80);
        await page.waitForTimeout(400);
        await page.screenshot({ path: ".tmp/tarot-3-hover-glare.png" });
        console.log("Screenshot 3 (Glare shift): .tmp/tarot-3-hover-glare.png");

        // 4. Click to Flip to Back Face
        await card.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: ".tmp/tarot-4-flipped-back.png" });
        console.log("Screenshot 4 (Flipped Back): .tmp/tarot-4-flipped-back.png");
    }

    console.log("Errors:", errors);
    await browser.close();
    console.log(JSON.stringify({ ok: errors.length === 0, errors }));
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
