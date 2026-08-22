const REDUCE_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const THEME_KEY = "cv-theme";

let lastFocused = null;
let observer = null;
let spyObserver = null;

function setupThemeToggle(modal) {
    const cvWindow = modal.querySelector(".cv-window");
    const toggle = modal.querySelector("#cv-theme-toggle");
    if (!cvWindow || !toggle) return;

    function applyTheme(theme) {
        if (theme === "light") {
            cvWindow.setAttribute("data-theme", "light");
            toggle.setAttribute("aria-pressed", "true");
            toggle.setAttribute("aria-label", "Switch to dark mode");
        } else {
            cvWindow.removeAttribute("data-theme");
            toggle.setAttribute("aria-pressed", "false");
            toggle.setAttribute("aria-label", "Switch to light mode");
        }
    }

    let stored = null;
    try {
        stored = localStorage.getItem(THEME_KEY);
    } catch {
        // localStorage unavailable (private mode, etc.) — fall back to dark default
    }
    applyTheme(stored === "light" ? "light" : "dark");

    toggle.addEventListener("click", () => {
        const next = cvWindow.getAttribute("data-theme") === "light" ? "dark" : "light";
        applyTheme(next);
        try {
            localStorage.setItem(THEME_KEY, next);
        } catch {
            // ignore — theme just won't persist across sessions
        }
    });
}

function setupSubstackReveal(modal) {
    const btn = modal.querySelector("#cv-substack-btn");
    const status = modal.querySelector("#cv-substack-status");
    if (!btn) return;

    const HOLD_MS = REDUCE_MOTION ? 1600 : 3200;
    let resetTimer = null;

    btn.addEventListener("click", () => {
        btn.classList.add("is-active");
        if (status) status.textContent = "Coming soon";
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
            btn.classList.remove("is-active");
            if (status) status.textContent = "";
        }, HOLD_MS);
    });
}

function openModal(modal, openButton) {
    lastFocused = openButton || document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const window_ = modal.querySelector(".cv-window");
    window_?.focus();
}

function closeModal(modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lastFocused?.focus?.();
    setTimeout(() => modal.querySelector("#cv-content")?.scrollTo(0, 0), 350);
}

function setupReveal(modal) {
    observer?.disconnect();
    const targets = modal.querySelectorAll(".cv-reveal");
    if (REDUCE_MOTION) {
        targets.forEach((el) => el.classList.add("is-visible"));
        return;
    }
    observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { root: modal.querySelector(".cv-content"), threshold: 0.15 }
    );
    targets.forEach((el) => observer.observe(el));
}

function setupScrollSpy(modal) {
    const content = modal.querySelector("#cv-content");
    const progress = modal.querySelector("#cv-progress");
    const navLinks = [...modal.querySelectorAll(".cv-nav [data-cv-link]")];
    const sections = navLinks
        .map((link) => modal.querySelector(`#${link.dataset.cvLink}`))
        .filter(Boolean);

    function updateProgress() {
        const scrollable = content.scrollHeight - content.clientHeight;
        const pct = scrollable > 0 ? (content.scrollTop / scrollable) * 100 : 0;
        if (progress) progress.style.width = `${pct}%`;
    }

    content.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();

    spyObserver?.disconnect();
    spyObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const id = entry.target.id;
                navLinks.forEach((link) => {
                    link.classList.toggle("is-active", link.dataset.cvLink === id);
                });
            });
        },
        { root: content, rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((section) => spyObserver.observe(section));

    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            const target = modal.querySelector(`#${link.dataset.cvLink}`);
            target?.scrollIntoView({ behavior: REDUCE_MOTION ? "auto" : "smooth", block: "start" });
        });
    });
}

document.addEventListener("astro:page-load", () => {
    const modal = document.querySelector("#cv-modal");
    if (!modal) return;

    const openButton = document.querySelector("#open-living-cv");
    openButton?.addEventListener("click", () => openModal(modal, openButton));

    modal.querySelectorAll("[data-cv-close]").forEach((el) => {
        el.addEventListener("click", () => closeModal(modal));
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal(modal);
    });

    setupReveal(modal);
    setupScrollSpy(modal);
    setupThemeToggle(modal);
    setupSubstackReveal(modal);
});
