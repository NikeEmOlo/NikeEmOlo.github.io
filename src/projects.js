// Washing Line Smooth Momentum Drag & Carousel Controller
// Provides silky-smooth physics-based scrolling without jerky snap jumps,
// supporting mouse drag, touch swipe, wheel panning, and category filtering.

document.addEventListener("astro:page-load", () => {
    const track = document.getElementById("carouselTrack");
    const rail = document.getElementById("category-rail");
    const announcement = document.getElementById("filter-announcement");
    const prevBtn = document.getElementById("carouselPrevBtn");
    const nextBtn = document.getElementById("carouselNextBtn");
    const cardItems = document.querySelectorAll(".carousel-card-item");
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!track || !cardItems.length) return;

    // ---------------------- 1. SILKY WASHING-LINE SCROLL PHYSICS ---------------------- //
    let isDown = false;
    let startX = 0;
    let scrollStart = 0;
    let dragDistance = 0;
    let isDragging = false;
    let targetScroll = track.scrollLeft;
    let currentScroll = track.scrollLeft;
    let velocity = 0;
    let lastX = 0;
    let lastTime = performance.now();
    let isRunning = false;

    function getMaxScroll() {
        return Math.max(0, track.scrollWidth - track.clientWidth);
    }

    function updatePhysics() {
        if (!isRunning) return;

        if (!isDown) {
            // Apply velocity momentum
            targetScroll += velocity;
            velocity *= 0.92; // Smooth friction decay

            // Clamp target scroll within bounds
            const maxScroll = getMaxScroll();
            if (targetScroll < 0) {
                targetScroll = 0;
                velocity = 0;
            } else if (targetScroll > maxScroll) {
                targetScroll = maxScroll;
                velocity = 0;
            }

            if (Math.abs(velocity) < 0.05) {
                velocity = 0;
            }
        }

        // Smooth Lerp toward target scroll
        const diff = targetScroll - currentScroll;
        if (Math.abs(diff) > 0.3 || Math.abs(velocity) > 0.05) {
            currentScroll += diff * 0.14;
            track.scrollLeft = currentScroll;
            requestAnimationFrame(updatePhysics);
        } else {
            currentScroll = targetScroll;
            track.scrollLeft = currentScroll;
            isRunning = false;
        }
    }

    function startPhysics() {
        if (!isRunning) {
            isRunning = true;
            requestAnimationFrame(updatePhysics);
        }
    }

    // Pointer Drag Handling
    track.addEventListener("pointerdown", (e) => {
        // Only primary mouse button or touch
        if (e.button !== 0 && e.pointerType === "mouse") return;

        isDown = true;
        isDragging = false;
        dragDistance = 0;
        startX = e.clientX;
        scrollStart = track.scrollLeft;
        targetScroll = scrollStart;
        currentScroll = scrollStart;
        velocity = 0;
        lastX = e.clientX;
        lastTime = performance.now();
    });

    track.addEventListener("pointermove", (e) => {
        if (!isDown) return;

        const now = performance.now();
        const dt = Math.max(now - lastTime, 1);
        const dx = e.clientX - lastX;
        const totalDx = e.clientX - startX;

        dragDistance = Math.abs(totalDx);
        if (dragDistance > 5) {
            isDragging = true;
            track.classList.add("is-dragging");
            if (e.pointerId && !track.hasPointerCapture(e.pointerId)) {
                try {
                    track.setPointerCapture(e.pointerId);
                } catch {}
            }
        }

        // Compute instant velocity for momentum release
        velocity = -(dx / dt) * 16;
        lastX = e.clientX;
        lastTime = now;

        targetScroll = scrollStart - totalDx;
        const maxScroll = getMaxScroll();
        // Rubber-band resistance at edges
        if (targetScroll < 0) {
            targetScroll = targetScroll * 0.4;
        } else if (targetScroll > maxScroll) {
            targetScroll = maxScroll + (targetScroll - maxScroll) * 0.4;
        }

        currentScroll = targetScroll;
        track.scrollLeft = currentScroll;
    });

    function endDrag(e) {
        if (!isDown) return;
        isDown = false;
        track.classList.remove("is-dragging");

        if (e && e.pointerId && track.hasPointerCapture(e.pointerId)) {
            try {
                track.releasePointerCapture(e.pointerId);
            } catch {}
        }

        // Clamp target on release
        const maxScroll = getMaxScroll();
        if (targetScroll < 0) targetScroll = 0;
        if (targetScroll > maxScroll) targetScroll = maxScroll;

        startPhysics();

        setTimeout(() => {
            isDragging = false;
            dragDistance = 0;
        }, 50);
    }

    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    track.addEventListener("mouseleave", () => {
        if (isDown) endDrag();
    });

    // Mouse Wheel Horizontal Panning
    track.addEventListener("wheel", (e) => {
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (Math.abs(delta) > 2) {
            e.preventDefault();
            targetScroll += delta * 1.35;
            const maxScroll = getMaxScroll();
            targetScroll = Math.max(0, Math.min(maxScroll, targetScroll));
            startPhysics();
        }
    }, { passive: false });

    // Arrow Nav Buttons
    prevBtn?.addEventListener("click", () => {
        targetScroll = Math.max(0, targetScroll - 340);
        startPhysics();
    });

    nextBtn?.addEventListener("click", () => {
        const maxScroll = getMaxScroll();
        targetScroll = Math.min(maxScroll, targetScroll + 340);
        startPhysics();
    });

    // ---------------------- 2. CARD CLICK MODAL DISPATCH ---------------------- //
    cardItems.forEach((cardEl) => {
        const projectId = cardEl.dataset.projectId;

        function triggerModal(e) {
            if (dragDistance > 6 || isDragging) {
                return;
            }
            if (projectId) {
                window.dispatchEvent(
                    new CustomEvent("open-project-modal", {
                        detail: { projectId },
                    })
                );
            }
        }

        cardEl.addEventListener("click", triggerModal);

        // Accessible keyboard trigger
        cardEl.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (projectId) {
                    window.dispatchEvent(
                        new CustomEvent("open-project-modal", {
                            detail: { projectId },
                        })
                    );
                }
            }
        });
    });

    // ---------------------- 3. CATEGORY FILTERING ---------------------- //
    if (rail) {
        const railNodes = [...rail.querySelectorAll(".rail-node")];

        function applyCategoryFilter(category) {
            let visibleCount = 0;
            cardItems.forEach((item) => {
                const matches = category === "all" || item.dataset.category === category;

                if (matches) {
                    item.style.display = "flex";
                    visibleCount++;
                    requestAnimationFrame(() => {
                        item.style.opacity = "1";
                        item.style.transform = "translateY(0) scale(1)";
                    });
                } else {
                    item.style.opacity = "0";
                    item.style.transform = "translateY(12px) scale(0.92)";
                    setTimeout(() => {
                        if (item.dataset.category !== category && category !== "all") {
                            item.style.display = "none";
                        }
                    }, 240);
                }
            });

            // Smoothly glide back to start of carousel
            targetScroll = 0;
            startPhysics();

            if (announcement) {
                announcement.textContent = `Showing ${visibleCount} project${visibleCount === 1 ? "" : "s"}`;
            }
        }

        railNodes.forEach((node) => {
            node.addEventListener("click", () => {
                railNodes.forEach((n) => {
                    n.setAttribute("aria-pressed", String(n === node));
                    if (n === node) {
                        n.classList.add("active");
                    } else {
                        n.classList.remove("active");
                    }
                });
                const category = node.dataset.category || "all";
                applyCategoryFilter(category);
            });
        });
    }
});
