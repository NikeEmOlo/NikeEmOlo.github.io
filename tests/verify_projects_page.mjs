import { chromium } from "playwright";
import { resolve } from "node:path";

async function verifyProjects() {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
    });

    console.log("Navigating to http://localhost:4321/projects ...");
    await page.goto("http://localhost:4321/projects", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const screenshot1 = resolve("projects-page-initial.png");
    await page.screenshot({ path: screenshot1 });
    console.log("Screenshot 1 saved:", screenshot1);

    // Test dragging the carousel
    console.log("Testing carousel drag...");
    const track = await page.$("#carouselTrack");
    if (track) {
        const box = await track.boundingBox();
        if (box) {
            await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.5);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5, { steps: 15 });
            await page.mouse.up();
            await page.waitForTimeout(600);
        }
    }
    const screenshot2 = resolve("projects-page-scrolled.png");
    await page.screenshot({ path: screenshot2 });
    console.log("Screenshot 2 saved:", screenshot2);

    // Test Category filter
    console.log("Testing category filter...");
    const devBtn = await page.$('button[data-category="development"]');
    if (devBtn) {
        await devBtn.click();
        await page.waitForTimeout(500);
    }
    const screenshot3 = resolve("projects-page-filtered.png");
    await page.screenshot({ path: screenshot3 });
    console.log("Screenshot 3 saved:", screenshot3);

    // Reset to All Work
    const allBtn = await page.$('button[data-category="all"]');
    if (allBtn) {
        await allBtn.click();
        await page.waitForTimeout(500);
    }

    // Test clicking a card to open the Sandbox-style modal
    console.log("Testing card click to open modal...");
    const firstCard = await page.$('.carousel-card-item');
    if (firstCard) {
        await firstCard.click();
        await page.waitForTimeout(800);
    }
    const screenshot4 = resolve("projects-page-modal.png");
    await page.screenshot({ path: screenshot4 });
    console.log("Screenshot 4 saved:", screenshot4);

    await browser.close();

    console.log("Errors encountered:", errors);
    console.log(JSON.stringify({ ok: errors.length === 0, errors }));
}

verifyProjects().catch((err) => {
    console.error(err);
    process.exit(1);
});
