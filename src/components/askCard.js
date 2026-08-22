import { gsap } from "gsap";
import { showSmokeResponse } from "./smokeResponse.js";

// Placeholder until a host is chosen (see CLAUDE.md "Cloud webhooks — NOT BUILT").
// Points at the local dev stub in sites/portfolio/server/chat-server.mjs.
const CHAT_ENDPOINT = import.meta.env.PUBLIC_CHAT_ENDPOINT || "http://localhost:8787/api/chat";
const MAX_HISTORY_MESSAGES = 12;
const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const INTRO_MESSAGES = [
    "I am Nike's avatar. You come seeking answers.",
    "I can show you her past, her present, her... website.",
    "Ask and you shall receive.",
    "I can guide you in the right direction",
];
const TYPE_MS = 38;
const DELETE_MS = 22;
const HOLD_MS = 2200;
const GAP_MS = 400;

let history = [];
let busy = false;
let introTimer = null;
let introIndex = 0;

function flyAway(wrap) {
    return gsap.to(wrap, {
        y: -60,
        scale: 0.85,
        opacity: 0,
        duration: REDUCE_MOTION ? 0.01 : 0.5,
        ease: "power2.in",
    });
}

function stopIntroRotation() {
    clearTimeout(introTimer);
    introTimer = null;
}

function typeIntro(el) {
    if (REDUCE_MOTION) {
        el.textContent = INTRO_MESSAGES[introIndex];
        introIndex = (introIndex + 1) % INTRO_MESSAGES.length;
        introTimer = setTimeout(() => typeIntro(el), HOLD_MS + 1000);
        return;
    }

    const message = INTRO_MESSAGES[introIndex];
    let charIndex = 0;

    const typeChar = () => {
        charIndex++;
        el.textContent = message.slice(0, charIndex);
        introTimer = setTimeout(charIndex < message.length ? typeChar : holdThenDelete, TYPE_MS);
    };

    const holdThenDelete = () => {
        introTimer = setTimeout(runDelete, HOLD_MS);
    };

    const runDelete = () => {
        charIndex--;
        el.textContent = message.slice(0, charIndex);
        if (charIndex > 0) {
            introTimer = setTimeout(runDelete, DELETE_MS);
        } else {
            introIndex = (introIndex + 1) % INTRO_MESSAGES.length;
            introTimer = setTimeout(() => typeIntro(el), GAP_MS);
        }
    };

    typeChar();
}

function startIntroRotation() {
    const el = document.querySelector("#ask-intro");
    if (!el) return;
    stopIntroRotation();
    introIndex = 0;
    el.classList.remove("hidden");
    typeIntro(el);
}

function hideIntro() {
    stopIntroRotation();
    document.querySelector("#ask-intro")?.classList.add("hidden");
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
    hideIntro();

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
    startIntroRotation();
    form.addEventListener("submit", handleSubmit);
    bindChips(form);
});
