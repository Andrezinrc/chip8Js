export class Keypad {
	constructor(elementId = "keypad") {
        this.keys = new Uint8Array(16);
        this.waitingResolver = null;

        this.dom = document.getElementById(elementId);

        this.KEYS = {
            "1": 0x1,
            "2": 0x2,
            "3": 0x3,
            "4": 0xC,

            "q": 0x4,
            "w": 0x5,
            "e": 0x6,
            "r": 0xD,

            "a": 0x7,
            "s": 0x8,
            "d": 0x9,
            "f": 0xE,

            "z": 0xA,
            "x": 0x0,
            "c": 0xB,
            "v": 0xF
        };

        this.installKeyboard();
        this.installTouch();
	}

    press(key) {
        this.keys[key] = 1;

        if (this.waitingResolver !== null) {
            this.waitingResolver(key);
            this.waitingResolver =  null;
        }
    }

    release(key) {
        this.keys[key] = 0;
    }

    isPressed(key) {
        return this.keys[key] !== 0;
    }

    clear() {
        this.keys.fill(0);
    }

    waitKey() {
        return new Promise(resolve => {
            this.waitingResolver = resolve;
        });
    }

    installKeyboard() {
        window.addEventListener("keydown", e => {
            const key =  this.KEYS[e.key.toLowerCase()];

            if (key === undefined)
                return;

            e.preventDefault();

            this.press(key);
        });
        window.addEventListener("keyup",   e => {
            const key = this.KEYS[e.key.toLowerCase()];

            if (key === undefined)
                return;

            e.preventDefault();

            this.release(key);
        });
    }

    installTouch() {
        if (!this.dom)
            return;

        const start = e => {
            const btn = e.target.closest("button");

            if (!btn)
                return;

            e.preventDefault();

            const key = parseInt(btn.dataset.key, 16);

            btn.classList.add("pressed");

            this.press(key);
        };

        const end = e => {
            const btn = e.target.closest("button");

            if (!btn)
                return;

            e.preventDefault();

            const key = parseInt(btn.dataset.key, 16);
            
            btn.classList.remove("pressed");

            this.release(key);
        };

        this.dom.addEventListener("pointerdown", start);
        this.dom.addEventListener("pointerup", end);
        this.dom.addEventListener("pointerleave", end);
        this.dom.addEventListener("pointercancel", end);
    }
}
