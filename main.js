import {Chip8} from './src/core/cpu.js';
import {Video} from './src/devices/video.js';
import {Audio} from './src/devices/audio.js';
import {Keypad} from './src/devices/keypad.js';
import {loadQuirkUI, readQuirkUI} from "./src/system/config.js";
import "./theme.js";

const canvas =  document.getElementById("screen");
const ctx = canvas.getContext("2d");

const keypad = new Keypad();
const cpu = new Chip8(keypad);
const video = new Video(ctx);
const audio = new Audio();

// Unlock audio on the first user interaction
canvas.addEventListener("pointerdown", ()=>audio.init(), {once:true});

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
    await audio.init();

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

let paused = false;

let pauseRom = document.getElementById("pause-rom");

pauseRom.addEventListener("click", () => {
    if (!paused) {
	paused = true;
	pauseRom.innerText = "RESUME";
    } else {
	paused = false;
	pauseRom.innerText = "PAUSE";
    }
});


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

// Execute one emulator frame
function mainLoop()
{
    if (!paused) {
        cpu.cpuCycle();

        const soundOn = cpu.ST > 0;

        if (soundOn !== lastSoundState) {
            if (soundOn)
                audio.play();
            else
                audio.stop();

            lastSoundState = soundOn;
        }
    } else {
        if (lastSoundState) {
            audio.stop();
            lastSoundState = false;
        }
    }

    video.render(cpu);
    animationId = requestAnimationFrame(mainLoop);
}
