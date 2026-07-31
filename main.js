import {Chip8} from './cpu.js';
import {Video} from './video.js';

const canvas =  document.getElementById("screen");
const ctx = canvas.getContext("2d");

const cpu = new Chip8();
const video = new Video(ctx);

document.getElementById("rom-upload").addEventListener("change", async(event)  => {
    const file =  event.target.files[0];
    if (!file) return;

    try {
        const buffer = await file.arrayBuffer();
        const rom = new Uint8Array(buffer);

        cpu.loadRom(rom);
        requestAnimationFrame(mainLoop);
    } catch(error) {
        console.log("Error loading ROM: ", error);
    }
});

function mainLoop()
{
    cpu.cpuCycle();
    video.render(cpu);
    requestAnimationFrame(mainLoop);
}
