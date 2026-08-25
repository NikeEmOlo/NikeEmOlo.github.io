/**
 * Metallic Tarot Card Interactive 3D Physics & Specular Foil Lighting Engine
 */

export class MetallicTarotCardEngine {
    constructor(element) {
        this.element = element;
        this.flipper = element.querySelector("[data-metallic-flipper]") || element;
        this.glare = element.querySelector("[data-metallic-glare]");
        this.bounds = null;
        this.rafId = null;

        // Current & target transform state
        this.state = {
            currentX: 0,
            currentY: 0,
            targetX: 0,
            targetY: 0,
            glareOpacity: 0,
            glareX: 50,
            glareY: 50,
            glareAngle: 125,
            isHovered: false,
        };

        this._bindEvents();
    }

    _bindEvents() {
        this.element.addEventListener("pointerenter", this._onPointerEnter.bind(this));
        this.element.addEventListener("pointermove", this._onPointerMove.bind(this));
        this.element.addEventListener("pointerleave", this._onPointerLeave.bind(this));
    }

    _onPointerEnter(e) {
        this.bounds = this.element.getBoundingClientRect();
        this.state.isHovered = true;
        this.state.glareOpacity = 0.55;
        this._startLoop();
    }

    _onPointerMove(e) {
        if (!this.bounds) this.bounds = this.element.getBoundingClientRect();

        const x = e.clientX - this.bounds.left;
        const y = e.clientY - this.bounds.top;

        const normX = (x / this.bounds.width) * 2 - 1; // -1 to 1
        const normY = (y / this.bounds.height) * 2 - 1; // -1 to 1

        // 3D Parallax tilt max angles
        this.state.targetX = normX * 14; // max 14deg Y-axis rotation
        this.state.targetY = -normY * 16; // max 16deg X-axis rotation

        // Glare coordinates (0% to 100%)
        this.state.glareX = (x / this.bounds.width) * 100;
        this.state.glareY = (y / this.bounds.height) * 100;

        // Calculate dynamic light reflection angle based on pointer position
        const angle = Math.atan2(y - this.bounds.height / 2, x - this.bounds.width / 2) * (180 / Math.PI);
        this.state.glareAngle = angle + 90;
    }

    _onPointerLeave() {
        this.state.isHovered = false;
        this.state.targetX = 0;
        this.state.targetY = 0;
        this.state.glareOpacity = 0;
    }

    _startLoop() {
        if (this.rafId) return;
        const update = () => {
            // Smooth spring easing
            this.state.currentX += (this.state.targetX - this.state.currentX) * 0.12;
            this.state.currentY += (this.state.targetY - this.state.currentY) * 0.12;

            // Apply 3D tilt
            if (this.flipper) {
                this.flipper.style.transform = `rotateX(${this.state.currentY.toFixed(2)}deg) rotateY(${this.state.currentX.toFixed(2)}deg)`;
            }

            // Apply metallic lighting CSS custom properties
            this.element.style.setProperty("--pointer-x", `${this.state.glareX.toFixed(1)}%`);
            this.element.style.setProperty("--pointer-y", `${this.state.glareY.toFixed(1)}%`);
            this.element.style.setProperty("--glare-angle", `${this.state.glareAngle.toFixed(1)}deg`);
            this.element.style.setProperty("--glare-opacity", `${this.state.glareOpacity}`);

            // Stop loop when idle at rest
            const isAtRest =
                !this.state.isHovered &&
                Math.abs(this.state.currentX) < 0.05 &&
                Math.abs(this.state.currentY) < 0.05;

            if (!isAtRest) {
                this.rafId = requestAnimationFrame(update);
            } else {
                this.flipper.style.transform = "rotateX(0deg) rotateY(0deg)";
                this.rafId = null;
            }
        };

        this.rafId = requestAnimationFrame(update);
    }

    dispose() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
    }
}

export function initMetallicTarotCards() {
    document.querySelectorAll("[data-metallic-card]").forEach((el) => {
        if (el.dataset.metallicMounted) return;
        el.dataset.metallicMounted = "true";
        new MetallicTarotCardEngine(el);
    });
}
