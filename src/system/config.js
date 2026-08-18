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
