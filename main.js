import {Chip8} from './cpu.js';
import {Video} from './video.js';
import {Keypad} from './keypad.js';

const canvas =  document.getElementById("screen");
const ctx = canvas.getContext("2d");

const keypad = new Keypad();
const cpu = new Chip8(keypad);
const video = new Video(ctx);

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

speedSlider.addEventListener("input", (e) => {
    const value = Number(e.target.value);
    cpu.cyclesPerFrame = value;
    speedValue.textContent = `${value}x`;
});

function mainLoop()
{
    cpu.cpuCycle();
    video.render(cpu);
    animationId = requestAnimationFrame(mainLoop);
}
