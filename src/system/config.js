import { DEFAULT_QUIRKS } from "./quirks.js";

const overlay = document.querySelector("#config-overlay");

document.querySelector("#config-btn").onclick = () => {
    overlay.classList.add("active");
};

document.querySelector("#close-config").onclick = () => {
    overlay.classList.remove("active");
};

const map = {
    vfReset:"vfResetQuirk",
    memory:"memoryQuirk",
    clip:"clipQuirk",
    jump:"jumpQuirk",
    shift:"shiftQuirk",
    dispWait: "dispWaitQuirk",
};

const STORAGE_KEY = "chip8-quirks";

export function loadQuirkUI(quirks)
{
    for(const id in map) {
        document.querySelector("#"+id).checked =
            quirks[map[id]];
    }
}

export function readQuirkUI()
{
    const q = {};

    for(const id in map) {
        q[map[id]] = document.querySelector("#"+id).checked;
    }

    return q;
}

export function loadSavedQuirks()
{
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved)
        return { ...DEFAULT_QUIRKS };

    try {
        return {
            ...DEFAULT_QUIRKS,
            ...JSON.parse(saved),
        };
    } catch (error) {
        console.warn("Invalid saved quirks:", error);
        return { ...DEFAULT_QUIRKS };
    }
}

export function saveQuirks(quirks)
{
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(quirks)
    );
}
