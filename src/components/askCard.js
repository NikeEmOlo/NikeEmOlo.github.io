import { gsap } from "gsap";
import { showSmokeResponse } from "./smokeResponse.js";

// Placeholder until a host is chosen (see CLAUDE.md "Cloud webhooks — NOT BUILT").
// Points at the local dev stub in sites/portfolio/server/chat-server.mjs.
const CHAT_ENDPOINT = import.meta.env.PUBLIC_CHAT_ENDPOINT || "http://localhost:8787/api/chat";
const MAX_HISTORY_MESSAGES = 12;
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let history = [];
let busy = false;

function flyAway(wrap) {
    return gsap.to(wrap, {
        y: -60,
        scale: 0.85,
        opacity: 0,
        duration: REDUCE_MOTION ? 0.01 : 0.5,
        ease: "power2.in",
    });
}

function flyBack(wrap) {
    gsap.fromTo(
        wrap,
        { y: -60, scale: 0.85, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: REDUCE_MOTION ? 0.01 : 0.6, ease: "power2.out" }
    );
}

async function askModel(question, priorHistory) {
    const res = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history: priorHistory }),
    });
    if (!res.ok) throw new Error(`chat endpoint responded ${res.status}`);
    const data = await res.json();
    if (!data.reply) throw new Error("chat endpoint returned no reply");
    return data.reply;
}

async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;

    const form = event.currentTarget;
    const input = form.querySelector(".ask-input");
    const question = input.value.trim();
    if (!question) return;

    const wrap = form.closest(".ask-card-wrap");

    busy = true;
    input.disabled = true;
    wrap.classList.add("busy");

    await flyAway(wrap);

    const priorHistory = history.slice();
    let replyText;
    try {
        replyText = await askModel(question, priorHistory);
        history.push({ role: "user", content: question }, { role: "assistant", content: replyText });
        history = history.slice(-MAX_HISTORY_MESSAGES);
    } catch (err) {
        console.error("[ask-card] chat request failed:", err);
        replyText = "I couldn't reach my brain just then — try again in a moment.";
    }

    showSmokeResponse(replyText, {
        onDone: () => {
            form.reset();
            input.disabled = false;
            wrap.classList.remove("busy");
            flyBack(wrap);
            busy = false;
        },
    });
}

function bindChips(form) {
    form.querySelectorAll(".ask-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
            const input = form.querySelector(".ask-input");
            input.value = chip.dataset.q || chip.textContent;
            input.focus();
        });
    });
}

document.addEventListener("astro:page-load", () => {
    const form = document.querySelector("#ask-card");
    if (!form) return;
    history = [];
    busy = false;
    form.addEventListener("submit", handleSubmit);
    bindChips(form);
});
