import { gsap } from "gsap";

const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function wordSpans(text) {
    return text
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => `<span class="word">${w}</span>`)
        .join(" ");
}

// ~110 words/min reading speed, clamped so short and long replies both get a fair read.
function readHoldSeconds(text) {
    const words = text.split(/\s+/).filter(Boolean).length;
    const seconds = (words / 110) * 60;
    return Math.min(9, Math.max(3, seconds));
}

export function showSmokeResponse(text, { onDone } = {}) {
    const container = document.querySelector("#smoke-response");
    const textEl = container?.querySelector(".smoke-text");
    if (!container || !textEl) {
        onDone?.();
        return;
    }

    textEl.innerHTML = wordSpans(text);
    const words = textEl.querySelectorAll(".word");
    const hold = readHoldSeconds(text);

    const finish = () => {
        textEl.innerHTML = "";
        onDone?.();
    };

    if (REDUCE_MOTION) {
        gsap.set(textEl, { opacity: 1 });
        gsap.set(words, { opacity: 1 });
        gsap.to(textEl, { opacity: 0, delay: hold, duration: 0.6, onComplete: finish });
        return;
    }

    gsap.set(textEl, { opacity: 1 });

    const tl = gsap.timeline({ onComplete: finish });

    // Smoke in: words rise out of a blur, like wisps gathering into shape.
    tl.fromTo(
        words,
        { opacity: 0, y: 24, scale: 0.96, filter: "blur(14px)" },
        {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 1.1,
            ease: "power2.out",
            stagger: { each: 0.035, from: "start" },
        },
        0
    );

    // Hold for reading, then blow away: drift up and apart, re-blur, fade.
    tl.to(
        words,
        {
            opacity: 0,
            y: -36,
            x: (i) => (i % 2 === 0 ? -1 : 1) * (10 + (i % 4) * 6),
            filter: "blur(16px)",
            duration: 1.6,
            ease: "power1.in",
            stagger: { each: 0.03, from: "edges" },
        },
        `+=${hold}`
    );

    tl.to(textEl, { opacity: 0, duration: 0.3 }, "-=0.3");
}
