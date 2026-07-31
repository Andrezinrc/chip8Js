import {Chip8} from './cpu.js';

const canvas =  document.getElementById("screen");
const ctx = canvas.getContext("2d");

const cpu = new Chip8();

document.getElementById("rom-upload").addEventListener("change", async(event)  => {
    const file =  event.target.files[0];
    if (!file) return;

    try {
        const buffer = await file.arrayBuffer();
        const rom = new Uint8Array();

        cpu.loadRom();
        requestAnimationFrame(mainLoop);
    } catch(error) {
        console.log("Error loading ROM: ", error);
    }
});

function mainLoop()
{
    cpu.cpuCycle();
    requestAnimationFrame(mainLoop);
}
