import { chromium } from "playwright";
import { createServer } from "node:http";
import { resolve, extname } from "node:path";
import { readFileSync, existsSync } from "node:fs";

const MIME_TYPES = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
    ".pdf": "application/pdf"
};

const distDir = resolve("dist");

const server = createServer((req, res) => {
    let urlPath = req.url.split("?")[0];
    if (urlPath === "/") urlPath = "/index.html";
    let filePath = resolve(distDir, "." + urlPath);
    if (existsSync(filePath) && !filePath.endsWith(".html") && !extname(filePath)) {
        if (existsSync(filePath + "/index.html")) {
            filePath = filePath + "/index.html";
        } else if (existsSync(filePath + ".html")) {
            filePath = filePath + ".html";
        }
    }
    if (!existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
    }
    const ext = extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(readFileSync(filePath));
});

server.listen(54322, async () => {
    console.log("Server listening on 54322");
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:54322/", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    // Initial state screenshot
    await page.screenshot({ path: resolve("tests/homepage-card1.png") });

    // Hover over the active card to tilt it in 3D perspective
    const activeCard = await page.$(".is-active-hero .card");
    if (activeCard) {
        const box = await activeCard.boundingBox();
        if (box) {
            await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.2);
            await page.waitForTimeout(400);
            await page.screenshot({ path: resolve("tests/homepage-card-tilted.png") });
        }
    }

    // Click Next button to deal card 2
    const nextBtn = await page.$("#carouselNextBtn");
    if (nextBtn) {
        await nextBtn.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: resolve("tests/homepage-card2.png") });
    }

    await browser.close();
    server.close();
    console.log("Screenshots captured successfully");
    process.exit(0);
});
