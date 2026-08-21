// Local dev stub for the "ask a question" feature on the landing page.
//
// NOT production infra. This exists so AskCard.astro has something to talk to
// while running `astro dev`. Per CLAUDE.md's "Cloud webhooks" section, no host
// has been chosen yet — once one is, this logic moves to a real serverless
// function and this file goes away.
//
// Run from sites/portfolio/:
//   node --env-file=../../.env server/chat-server.mjs
// (expects ANTHROPIC_API_KEY in the repo-root .env)

import { createServer } from "node:http";
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 8787;
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 300;
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_MESSAGES = 12;

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIRS = [
    join(__dirname, "..", "src", "content", "overviews"),
    join(__dirname, "..", "src", "content", "projects"),
];

function stripFrontmatter(raw) {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
    if (!match) return { title: null, body: raw.trim() };
    const frontmatter = match[1];
    const body = raw.slice(match[0].length).trim();
    const titleMatch = frontmatter.match(/^projTitle:\s*"?(.*?)"?\s*$/m);
    return { title: titleMatch ? titleMatch[1] : null, body };
}

async function readCollection(dir) {
    let files;
    try {
        files = await readdir(dir);
    } catch {
        return [];
    }
    const entries = [];
    for (const file of files) {
        if (!/\.(md|mdx)$/.test(file)) continue;
        const raw = await readFile(join(dir, file), "utf8");
        const { title, body } = stripFrontmatter(raw);
        if (body) entries.push({ title: title || file, body });
    }
    return entries;
}

async function buildSystemPrompt() {
    const sections = [];
    for (const dir of CONTENT_DIRS) {
        for (const entry of await readCollection(dir)) {
            sections.push(`### ${entry.title}\n\n${entry.body}`);
        }
    }
    const facts = sections.join("\n\n---\n\n") || "(no content collection entries found)";

    return [
        "You are a guide to Olanike Olowo-Fela's portfolio site.",
        "Speak about Olanike in the third person, in a warm, confident, concise voice.",
        "Answer only from the facts below. If asked something the facts don't cover,",
        "say you don't know and suggest the visitor use the Contact link instead of guessing.",
        "Keep replies to 2-3 sentences.",
        "",
        "## Facts",
        "",
        facts,
    ].join("\n");
}

function withCors(res, origin) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => {
            data += chunk;
            if (data.length > 20_000) req.destroy();
        });
        req.on("end", () => resolve(data));
        req.on("error", reject);
    });
}

function sanitizeHistory(history) {
    if (!Array.isArray(history)) return [];
    return history
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_LENGTH) }));
}

async function main() {
    if (!process.env.ANTHROPIC_API_KEY) {
        console.error(
            "[chat-server] ANTHROPIC_API_KEY is not set. Run with:\n" +
                "  node --env-file=../../.env server/chat-server.mjs\n" +
                "and make sure the repo-root .env has ANTHROPIC_API_KEY=..."
        );
        process.exit(1);
    }

    const systemPrompt = await buildSystemPrompt();
    console.log(`[chat-server] system prompt built (${systemPrompt.length} chars) from content collections.`);

    const server = createServer(async (req, res) => {
        const origin = req.headers.origin;

        if (req.method === "OPTIONS") {
            withCors(res, origin);
            res.writeHead(204);
            res.end();
            return;
        }

        if (req.method !== "POST" || req.url !== "/api/chat") {
            withCors(res, origin);
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "not found" }));
            return;
        }

        withCors(res, origin);
        res.setHeader("Content-Type", "application/json");

        let payload;
        try {
            payload = JSON.parse(await readBody(req));
        } catch {
            res.writeHead(400);
            res.end(JSON.stringify({ error: "invalid JSON body" }));
            return;
        }

        const message = typeof payload.message === "string" ? payload.message.trim() : "";
        if (!message || message.length > MAX_MESSAGE_LENGTH) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: `message must be 1-${MAX_MESSAGE_LENGTH} characters` }));
            return;
        }

        const history = sanitizeHistory(payload.history);

        try {
            const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-api-key": process.env.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                    model: MODEL,
                    max_tokens: MAX_TOKENS,
                    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
                    messages: [...history, { role: "user", content: message }],
                }),
            });

            const data = await apiRes.json();

            if (!apiRes.ok) {
                console.error("[chat-server] Anthropic API error:", data);
                res.writeHead(502);
                res.end(JSON.stringify({ error: "chat backend error" }));
                return;
            }

            console.log("[chat-server] usage:", data.usage);
            const reply = data.content?.[0]?.text?.trim() || "";
            res.writeHead(200);
            res.end(JSON.stringify({ reply }));
        } catch (err) {
            console.error("[chat-server] request failed:", err);
            res.writeHead(502);
            res.end(JSON.stringify({ error: "chat backend unreachable" }));
        }
    });

    server.listen(PORT, () => {
        console.log(`[chat-server] local dev stub listening on http://localhost:${PORT}`);
        console.log("[chat-server] NOT production infra — see file header.");
    });
}

main();
