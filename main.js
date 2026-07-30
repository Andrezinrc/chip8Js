import {Chip8} from './cpu.js';

const canvas =  document.getElementById("screen");
const ctx = canvas.getContext("2d");

const cpu = new Chip8();

function mainLoop()
{
    cpu.cpuCycle();
    requestAnimationFrame(mainLoop);
}
mainLoop();
