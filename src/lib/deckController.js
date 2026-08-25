/**
 * Tarot Deck Dealing & Discard Physics Engine
 * 
 * 1. Precision Viewport Screen Centering:
 *    Active hero card is positioned at the exact 50% horizontal center of the browser viewport (window.innerWidth / 2).
 * 2. Non-Uniform Organic Hand-Dealt Stacks:
 *    Draw Deck and Discard Pile cards rest with authentic, non-uniform subtle organic misalignments (angles & offsets),
 *    and smoothly interpolate during flight without abrupt snapping.
 * 3. 3-Phase Tactile Dealing Choreography:
 *    - Pick up from deck to center (face-down 180° -> face-up 0° reveal flip).
 *    - Stationary reading plateau in screen center (100% face-up, scale 1.0, sharp 1:1 text rendering).
 *    - Inverted flip (0° -> -180°) into discard pile.
 * 4. Ghost-Free Category Sub-Deck Filtering:
 *    Selecting a discipline cleanly filters to only the matching cards, eliminating semi-transparent ghost overlaps.
 */

function getCardOrganicVariation(index) {
    const s1 = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
    const s2 = Math.cos(index * 26.6514 + 12.871) * 23421.6312;
    const s3 = Math.sin(index * 39.4123 + 45.192) * 31415.9265;

    const r1 = s1 - Math.floor(s1);
    const r2 = s2 - Math.floor(s2);
    const r3 = s3 - Math.floor(s3);

    return {
        rotZ: r1 * 6.0 - 3.0,     // -3.0 deg to +3.0 deg
        offsetX: r2 * 8.0 - 4.0,  // -4.0 px to +4.0 px
        offsetY: r3 * 6.0 - 3.0,  // -3.0 px to +3.0 px
    };
}

export class TarotDeckController {
    constructor(stageElement) {
        this.stage = stageElement;
        this.allCardNodes = Array.from(stageElement.querySelectorAll(".deck-card-item"));
        this.activeCards = [...this.allCardNodes];
        this.totalCards = this.activeCards.length;
        if (this.totalCards === 0) return;

        this.prevBtn = document.getElementById("carouselPrevBtn");
        this.nextBtn = document.getElementById("carouselNextBtn");

        // Physics & Progress State
        this.progress = 0; // Strictly clamped to [0, totalCards - 1]
        this.targetProgress = 0;
        this.velocity = 0;
        this.isDown = false;
        this.startX = 0;
        this.lastX = 0;
        this.lastTime = performance.now();
        this.dragDistance = 0;
        this.isDragging = false;
        this.rafId = null;
        this.selectedCategory = "all";

        // Viewport Coordinates & Geometry
        this.centerX = 0;
        this.deckX = 320;
        this.discardX = -320;

        this._updateGeometry();
        this._bindEvents();
        this._applyTransforms();
    }

    _updateGeometry() {
        const stageRect = this.stage.getBoundingClientRect();
        // Calculate exact horizontal offset so the active card sits at 50% viewport center
        const stageCenterX = stageRect.left + stageRect.width / 2;
        const screenCenterX = window.innerWidth / 2;
        const screenCenterOffset = screenCenterX - stageCenterX;

        this.centerX = Math.round(screenCenterOffset);

        // Separation distance between Screen Center and the side stacks
        const separation = Math.round(Math.min(Math.max(window.innerWidth * 0.23, 270), 380));
        this.deckX = this.centerX + separation;
        this.discardX = this.centerX - separation;
    }

    setCategory(category) {
        this.selectedCategory = category || "all";

        // Stop any running animations
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }

        // Hide all cards cleanly first
        this.allCardNodes.forEach((card) => {
            card.style.display = "none";
            card.style.opacity = "0";
            card.style.pointerEvents = "none";
        });

        // Filter active card set
        if (this.selectedCategory === "all") {
            this.activeCards = [...this.allCardNodes];
        } else {
            this.activeCards = this.allCardNodes.filter(
                (c) => c.dataset.category === this.selectedCategory
            );
        }

        this.totalCards = this.activeCards.length;

        // Show active cards
        this.activeCards.forEach((card) => {
            card.style.display = "block";
            card.style.opacity = "1";
            card.style.pointerEvents = "auto";
        });

        // Reset progress to top of deck
        this.progress = 0;
        this.targetProgress = 0;
        this.velocity = 0;

        this._applyTransforms();
    }

    _bindEvents() {
        window.addEventListener("resize", () => {
            this._updateGeometry();
            this._applyTransforms();
        });

        // 1. Mouse Wheel & Trackpad Kinetic Scroll
        this.stage.addEventListener(
            "wheel",
            (e) => {
                if (this.totalCards <= 1) return;
                const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
                if (Math.abs(delta) > 2) {
                    e.preventDefault();
                    const step = (delta / 120) * 0.35;
                    this.targetProgress = Math.max(
                        0,
                        Math.min(this.totalCards - 1, this.targetProgress + step)
                    );
                    this.velocity += (step > 0 ? 0.015 : -0.015);
                    this._startLoop();
                }
            },
            { passive: false }
        );

        // 2. Pointer Drag / Touch Swipe Handling
        this.stage.addEventListener("pointerdown", (e) => {
            if (this.totalCards <= 1) return;
            if (e.button !== 0 && e.pointerType === "mouse") return;
            this.isDown = true;
            this.isDragging = false;
            this.dragDistance = 0;
            this.startX = e.clientX;
            this.lastX = e.clientX;
            this.lastTime = performance.now();
            this.startProgress = this.progress;
        });

        this.stage.addEventListener("pointermove", (e) => {
            if (!this.isDown || this.totalCards <= 1) return;

            const now = performance.now();
            const dt = Math.max(now - this.lastTime, 1);
            const dx = e.clientX - this.lastX;
            const totalDx = e.clientX - this.startX;

            this.dragDistance = Math.abs(totalDx);
            if (this.dragDistance > 6) {
                this.isDragging = true;
                this.stage.classList.add("is-dragging");
                if (e.pointerId && !this.stage.hasPointerCapture(e.pointerId)) {
                    try {
                        this.stage.setPointerCapture(e.pointerId);
                    } catch {}
                }
            }

            const travelRange = Math.abs(this.deckX - this.discardX) * 0.85;
            const progressDelta = -totalDx / Math.max(travelRange, 240);

            this.targetProgress = Math.max(
                0,
                Math.min(this.totalCards - 1, this.startProgress + progressDelta)
            );

            this.velocity = -(dx / dt) * 0.05;
            this.lastX = e.clientX;
            this.lastTime = now;

            this._startLoop();
        });

        const endPointer = (e) => {
            if (!this.isDown) return;
            this.isDown = false;
            this.stage.classList.remove("is-dragging");

            if (e && e.pointerId && this.stage.hasPointerCapture(e.pointerId)) {
                try {
                    this.stage.releasePointerCapture(e.pointerId);
                } catch {}
            }

            // Snap to nearest integer card position (where the card rests in center focus)
            let snapTarget = Math.round(this.targetProgress + this.velocity * 3);
            snapTarget = Math.max(0, Math.min(this.totalCards - 1, snapTarget));
            this.targetProgress = snapTarget;
            this._startLoop();

            setTimeout(() => {
                this.isDragging = false;
                this.dragDistance = 0;
            }, 60);
        };

        this.stage.addEventListener("pointerup", endPointer);
        this.stage.addEventListener("pointercancel", endPointer);
        this.stage.addEventListener("mouseleave", () => {
            if (this.isDown) endPointer();
        });

        // 3. Arrow Navigation Buttons
        this.prevBtn?.addEventListener("click", () => this.stepPrev());
        this.nextBtn?.addEventListener("click", () => this.stepNext());

        // 4. Keyboard Navigation (ArrowLeft / ArrowRight)
        window.addEventListener("keydown", (e) => {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                this.stepNext();
            } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                this.stepPrev();
            }
        });

        // 5. Category Rail Filter Integration
        const railNodes = document.querySelectorAll(".rail-node");
        railNodes.forEach((btn) => {
            btn.addEventListener("click", () => {
                const cat = btn.dataset.category || "all";

                railNodes.forEach((b) => {
                    b.setAttribute("aria-pressed", b === btn ? "true" : "false");
                    b.classList.toggle("active", b === btn);
                });

                this.setCategory(cat);
            });
        });

        // 6. Individual Card Clicks
        this.allCardNodes.forEach((cardEl) => {
            cardEl.addEventListener("click", (e) => {
                if (this.dragDistance > 6 || this.isDragging) return;

                const activeIndex = Math.round(this.progress);
                const currentActiveCard = this.activeCards[activeIndex];

                if (cardEl === currentActiveCard) {
                    // Click on active top card opens case study modal
                    const projectId = cardEl.dataset.projectId;
                    if (projectId) {
                        window.dispatchEvent(
                            new CustomEvent("open-project-modal", {
                                detail: { projectId },
                            })
                        );
                    }
                } else {
                    // Click on another card in the active deck deals or returns directly to that card
                    const cardIndexInActive = this.activeCards.indexOf(cardEl);
                    if (cardIndexInActive !== -1) {
                        this.targetProgress = cardIndexInActive;
                        this._startLoop();
                    }
                }
            });
        });
    }

    stepNext() {
        if (this.totalCards <= 1) return;
        this.targetProgress = Math.min(this.totalCards - 1, Math.round(this.progress) + 1);
        this._startLoop();
    }

    stepPrev() {
        if (this.totalCards <= 1) return;
        this.targetProgress = Math.max(0, Math.round(this.progress) - 1);
        this._startLoop();
    }

    _startLoop() {
        if (this.rafId || this.totalCards <= 1) return;

        const loop = () => {
            const diff = this.targetProgress - this.progress;
            this.progress += diff * 0.12;
            this.progress = Math.max(0, Math.min(this.totalCards - 1, this.progress));

            if (!this.isDown) {
                this.velocity *= 0.86;
            }

            this._applyTransforms();

            if (Math.abs(diff) > 0.0006 || Math.abs(this.velocity) > 0.0006) {
                this.rafId = requestAnimationFrame(loop);
            } else {
                this.progress = this.targetProgress;
                this._applyTransforms();
                this.rafId = null;
            }
        };

        this.rafId = requestAnimationFrame(loop);
    }

    _applyTransforms() {
        if (this.totalCards === 0) return;

        // Strictly clamp progress
        const p = Math.max(0, Math.min(this.totalCards - 1, this.progress));
        const currentIdx = Math.min(Math.floor(p), this.totalCards - 1);
        const frac = currentIdx >= this.totalCards - 1 ? 0 : p - currentIdx;

        this.activeCards.forEach((card, i) => {
            const variation = getCardOrganicVariation(i);
            let x = 0;
            let y = 0;
            let z = 0;
            let rotateX = 0;
            let rotateY = 0;
            let rotateZ = 0;
            let scale = 0.88;
            let zIndex = 1;
            let shadowOpacity = 0.40;

            if (i < currentIdx) {
                // ── 1. FULLY DISCARDED STACK (Left Side, Organic Non-Uniform Face-Down Stack) ──
                const k = currentIdx - 1 - i;
                x = this.discardX - Math.min(k * 3.0, 24) + variation.offsetX;
                y = Math.min(k * 1.8, 14) + variation.offsetY;
                z = -Math.min(k * 4.0, 30);
                rotateY = -180; // Inverted face-down flip (showing card back)
                rotateZ = variation.rotZ; // Natural, organic non-uniform angle
                rotateX = 0;
                scale = Math.max(0.82, 0.88 - k * 0.015);
                zIndex = 10 + i;
                shadowOpacity = 0.35;
            } else if (i > currentIdx + 1) {
                // ── 2. DEEP IN DRAW DECK STACK (Right Side, Organic Non-Uniform Face-Down Stack) ──
                const d = i - (currentIdx + 1);
                x = this.deckX + Math.min(d * 3.5, 26) + variation.offsetX;
                y = Math.min(d * 2.2, 16) + variation.offsetY;
                z = -Math.min(d * 5.5, 40);
                rotateY = 180; // Face-down (showing card back)
                rotateZ = variation.rotZ; // Natural, organic non-uniform angle
                rotateX = 0;
                scale = Math.max(0.82, 0.88 - d * 0.015);
                zIndex = 200 - i;
                shadowOpacity = Math.max(0.25, 0.45 - d * 0.05);
            } else if (i === currentIdx) {
                // ── 3. CARD CURRENTLY IN CENTER HERO OR DEPARTING TO DISCARD ──
                const t = frac; // 0.0 to 1.0

                const plateauEnd = 0.40;
                if (t <= plateauEnd) {
                    // 100% STATIONARY IN TRUE VIEWPORT CENTER (Scale 1.0 = Crisp 1:1 Face-Up Rendering)
                    x = this.centerX;
                    y = 0;
                    z = 180;
                    scale = 1.0;
                    rotateY = 0; // 100% Face-up
                    rotateX = 0;
                    rotateZ = 0; // Straight, centered alignment for focused reading
                } else {
                    // Smoothly interpolates from Center (0, 0, 0°) -> Organic Discard Slot (offsetX, offsetY, rotZ)
                    const u = (t - plateauEnd) / (1.0 - plateauEnd);
                    const s = u * u * (3 - 2 * u); // smoothstep

                    const targetDiscardX = this.discardX + variation.offsetX;
                    const targetDiscardY = variation.offsetY;

                    x = this.centerX + (targetDiscardX - this.centerX) * s;
                    y = targetDiscardY * s - Math.sin(u * Math.PI) * 45; // Parabolic flight lift
                    z = 180 * (1 - s);
                    scale = 1.0 + (0.88 - 1.0) * s;

                    // Inverted flip: rotates 0° (face-up) -> -180° (face-down)
                    rotateY = -s * 180;
                    rotateX = -Math.sin(u * Math.PI) * 8;
                    // Seamlessly blends into organic resting angle without snapping!
                    rotateZ = variation.rotZ * s;
                }

                zIndex = 500;
                shadowOpacity = 0.65;
            } else if (i === currentIdx + 1) {
                // ── 4. NEXT CARD POISED ON DECK OR ARRIVING TO SCREEN CENTER ──
                const t = frac; // 0.0 to 1.0

                const plateauEnd = 0.40;
                if (t <= plateauEnd) {
                    // Organic Non-Uniform resting position on top of draw deck
                    x = this.deckX + variation.offsetX;
                    y = variation.offsetY;
                    z = 0;
                    scale = 0.88;
                    rotateY = 180; // Face-down on top of draw deck
                    rotateX = 0;
                    rotateZ = variation.rotZ;
                } else {
                    // Lifting from Organic Draw Slot -> Screen Center (Straightens and Flips to Front!)
                    const u = (t - plateauEnd) / (1.0 - plateauEnd);
                    const s = Math.sin(u * Math.PI * 0.5); // ease-out

                    const startDeckX = this.deckX + variation.offsetX;
                    const startDeckY = variation.offsetY;

                    x = startDeckX + (this.centerX - startDeckX) * s;
                    y = startDeckY * (1 - s) - Math.sin(u * Math.PI) * 35;
                    z = s * 180;
                    scale = 0.88 + (1.0 - 0.88) * s;

                    // Flips from 180° (face-down on deck) -> 0° (face-up reveal in center)
                    rotateY = 180 * (1 - s);
                    rotateX = -Math.sin(u * Math.PI) * 8;
                    // Seamlessly straightens out from organic deck angle into center focus
                    rotateZ = variation.rotZ * (1 - s);
                }

                zIndex = 400;
                shadowOpacity = 0.60;
            }

            // Distinguish active center hero from background deck stack
            const isActiveHero = (i === currentIdx && frac <= 0.40);
            card.classList.toggle("is-active-hero", isActiveHero);
            card.classList.toggle("is-deck-stack", !isActiveHero);

            // Apply 3D Matrix Transform with rounded precision
            card.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) rotateZ(${rotateZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
            card.style.zIndex = zIndex;

            card.style.setProperty("--stack-shadow-op", shadowOpacity.toFixed(2));
        });
    }

    dispose() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
    }
}

export function initTarotDeckEngine() {
    const stage = document.querySelector("[data-deck-stage]");
    if (stage && !stage.dataset.deckMounted) {
        stage.dataset.deckMounted = "true";
        new TarotDeckController(stage);
    }
}
