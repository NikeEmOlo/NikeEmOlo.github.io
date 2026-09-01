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

server.listen(54321, async () => {
    console.log("Server listening on 54321");
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto("http://localhost:54321/", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);

    await page.screenshot({ path: resolve("tests/homepage-current-1440x900.png") });
    console.log("Screenshot taken: tests/homepage-current-1440x900.png");

    await browser.close();
    server.close();
    process.exit(0);
});
