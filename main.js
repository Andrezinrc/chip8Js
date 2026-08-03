import {Chip8} from './cpu.js';
import {Video} from './video.js';
import {Keypad} from './keypad.js';

import {loadQuirkUI, readQuirkUI} from "./config.js";

const canvas =  document.getElementById("screen");
const ctx = canvas.getContext("2d");

const keypad = new Keypad();
const cpu = new Chip8(keypad);
const video = new Video(ctx);

loadQuirkUI(cpu.quirks);

const traceWindow = document.querySelector("#trace-window");

cpu.traceCallback = (msg)=>{
    const lines = traceWindow.textContent.split("\n"); 

    lines.push(msg);

    if(lines.length > 100)
        lines.shift();

    traceWindow.textContent = lines.join("\n");
};

let animationId = null;

const speedSlider = document.getElementById("speed");
const speedValue = document.getElementById("speed-value");

document.getElementById("rom-upload").addEventListener("change", async(event)  => {
    const file =  event.target.files[0];
    if (!file) return;

    try {
        const buffer = await file.arrayBuffer();
        const rom = new Uint8Array(buffer);

        if (animationId !== null) {
            cancelAnimationFrame(animationId);
            animationId = null;
        } 

        cpu.loadRom(rom);
        animationId = requestAnimationFrame(mainLoop);
    } catch(error) {
        console.log("Error loading ROM: ", error);
    }
});


document.getElementById("reset-rom").addEventListener("click", () => cpu.restart());


speedSlider.addEventListener("input", (e) => {
    const value = Number(e.target.value);
    cpu.cyclesPerFrame = value;
    speedValue.textContent = `${value}x`;
});

document.querySelectorAll("#config-overlay input[type=checkbox]").forEach(input => {
    input.addEventListener("change", ()=>{
        const quirks = readQuirkUI();
        cpu.setQuirks(quirks);
    });
});

document.querySelector("#trace").addEventListener("change",(e)=>{
    cpu.debug = e.target.checked;
});

function mainLoop()
{
    cpu.cpuCycle();
    video.render(cpu);
    animationId = requestAnimationFrame(mainLoop);
}
