import {CHIP8_FONTSET, SCHIP_FONTSET} from '../assets/fontset.js';
import {DEFAULT_QUIRKS} from '../system/quirks.js';

export class Chip8 {
    constructor(keypad, config = {}) {
        // Core
        this.memory  = new Uint8Array(4096);
        this.V       = new Uint8Array(16);
        this.I       = 0;
        this.PC      = 0x200;

        // Stack
        this.stack   = new Uint16Array(16);
        this.SP      = 0;

        // Video
        this.video = new Uint8Array(2048);

        this.displayWidth = 64;
        this.displayHeight = 32;

        // keypad
        this.keypad = keypad;
        this.waitingKey = false;
        this.keyPressed = -1;
        this.keyRegister = 0;

        // Timers
        this.DT      = 0;
        this.ST      = 0;


        // Quirks
        this.quirks = {
            ...DEFAULT_QUIRKS,
            ...config.quirks,
        };

        this.cyclesPerFrame = 10;

        this.displayWait = false;
        this.halted = false;

        this.cpuInit();
    }


    UNKNOWN_OPCODE(op) {    console.log(`UNKNOWN OPCODE 0x${op.toString(16)}`);    }


    // Instruction operand extractors
    
    get_x(op)   {   return (op & 0x0F00) >> 8;   }
    get_y(op)   {   return (op & 0x00F0) >> 4;   }
    get_n(op)   {   return (op & 0x000F);        }
    get_kk(op)  {   return (op & 0x00FF);        }
    get_nnn(op) {   return (op & 0x0FFF);        }

    // Loads

    loadRom(romData) {
        this.rom = new Uint8Array(romData);

        this.cpuReset();

        if (romData.length > 3584) {
            console.log("ROM too large");
            return;
        }

        for (let i = 0; i < romData.length; i++)
            this.memory[0x200 + i] = romData[i];
    }

    loadFonts() {
        for (let i = 0; i < CHIP8_FONTSET.length; i++)
            this.memory[i] = CHIP8_FONTSET[i];

        for (let i = 0; i < SCHIP_FONTSET.length; i++)
            this.memory[0x50 + i] = SCHIP_FONTSET[i];
    }


    cpuInit() {
        console.log("--- Initializing CPU ---\n");
        this.loadFonts();
    }


    // Display

    setLowRes() {
        this.displayWidth = 64;
        this.displayHeight = 32;
        this.video = new Uint8Array(2048);
    }

    setHighRes() {
        this.displayWidth = 128;
        this.displayHeight = 64;
        this.video = new Uint8Array(8192);
    }

    scrollDown(n) {
        const w = this.displayWidth;
        const h = this.displayHeight;
        const newVideo = new Uint8Array(w * h);

        for (let y = n; y < h; y++){
            for (let x=0; x < w; x++)
                newVideo[y * w + x] = this.video[(y - n) * w + x];
        }

        this.video = newVideo;
    }

     scrollRight() {
        const w = this.displayWidth;
        const h = this.displayHeight;
        const newVideo = new Uint8Array(w * h);

        for (let y = 0; y < h; y++){
            for (let x=0; x < w - 4; x++)
                newVideo[y * w + x + 4] = this.video[y * w + x];
        }

        this.video = newVideo;
    }  
    
    scrollLeft() {
        const w = this.displayWidth;
        const h = this.displayHeight;
        const newVideo = new Uint8Array(w * h);

        for (let y = 0; y < h; y++){
            for (let x=4; x < w; x++)
                newVideo[y * w + x - 4] = this.video[y * w + x];
        }

        this.video = newVideo;
    }


    // Reset


    cpuReset() {
        this.memory.fill(0);
        this.V.fill(0);
        this.I = 0;
        this.PC = 0x200;
        this.stack.fill(0);
        this.SP = 0;
        
        this.setLowRes();

        this.video.fill(0);
        this.waitingKey = false;
        this.keyPressed = -1;
        this.keyRegister = 0;
        this.DT = 0;
        this.ST = 0;

        this.loadFonts();

        this.displayWait = false;
        this.halted = false;
    }


    setQuirks(config) {
    	this.quirks = {
        	...this.quirks,
        	...config,
    	};

    	//console.log("Quirks updated:", this.quirks);
    }


    restart() {
    	if (!this.rom) return;

    	this.cpuReset();
    	this.memory.set(this.rom, 0x200);
    }

    // CPU Instructions

    cpuStep() {
        if (this.displayWait || this.halted)
            return;
        
        const q =  this.quirks;

        let op = (this.memory[this.PC] << 8) | this.memory[this.PC + 1];

        /* Decode & Execute */
        switch (op & 0xF000) {
        case 0x0000:
            if ((op & 0xFFF0) === 0x00C0) {
                this.scrollDown(this.get_n(op));
                this.PC += 2;
                break;
            }

            switch (this.get_kk(op)) {
            case 0x00E0: /* CLS */
                //this.trace("CLS", op);
                this.video.fill(0);
                this.PC += 2;
                break;
            case 0x00EE: /* RET */
                //this.trace("RET", op);
                this.SP--;
                this.PC = this.stack[this.SP];
                this.PC += 2;
                break;
            case 0x00FB: /* SCROLL RIGHT */
                this.scrollRight();
                this.PC += 2;
                break;
            case 0x00FC: /* SCROLL LEFT */
                this.scrollLeft();
                this.PC += 2;
                break;
            case 0x00FD: /* EXIT */
                this.halted=true;
                this.PC += 2;
                break;
            case 0x00FE: /* LOW RES */
                this.setLowRes();
                this.PC += 2;
                break;
            case 0x00FF: /* HIGH RES */
                this.setHighRes();
                this.PC += 2;
                break;
            default: /* SYS */
                //this.trace("SYS", op);
                this.PC += 2;
                break;
            }
            break;
        case 0x1000: /* 1NNN - JP addr */
            //this.trace("JP", op);
            this.PC = this.get_nnn(op);
            break;
        case 0x2000: /* 2NNN - CALL addr */
            //this.trace("CALL", op);
            this.stack[this.SP] = this.PC;
            this.SP++;
            this.PC = this.get_nnn(op);
            break;
        case 0x3000: /* 3XKK - SE Vx, byte */
            //this.trace("SE Vx, byte", op);
            this.PC += (this.V[this.get_x(op)] == this.get_kk(op)) ? 4 : 2;
            break;
        case 0x4000: /* 4XKK - SNE Vx, byte */
            //this.trace("SNE Vx, byte",op);
            this.PC += (this.V[this.get_x(op)] != this.get_kk(op)) ? 4 : 2;
            break;
        case 0x5000:
            switch (this.get_n(op)) {
            case 0x0: /* 5XY0 - SE Vx, Vy */
                //this.trace("SE Vx, Vy", op);
                this.PC += (this.V[this.get_x(op)] === this.V[this.get_y(op)]) ? 4 : 2;
                break;
            default:
                this.UNKNOWN_OPCODE(op);
                break;
            }
            break;
        case 0x6000: /* 6XKK - LD Vx, byte */
            //this.trace("LD Vx, byte", op);
            this.V[this.get_x(op)] = this.get_kk(op);
            this.PC += 2;
            break;
        case 0x7000: /* 7XKK - ADD Vx, byte */
            //this.trace("ADD Vx, byte", op);
            this.V[this.get_x(op)] = (this.V[this.get_x(op)] + this.get_kk(op)) & 0xFF;
            this.PC += 2;
            break;
        case 0x8000:
            switch (this.get_n(op)) {
            case 0x0: /* 8XY0 - LD Vx, Vy */
                //this.trace("LD Vx, Vy", op);
                this.V[this.get_x(op)] = this.V[this.get_y(op)];
                this.PC += 2;
                break;
            case 0x1: /* 8XY1 - OR Vx, Vy */
                //this.trace("OR Vx, Vy", op);
                this.V[this.get_x(op)] |= this.V[this.get_y(op)];
                if (q.vfResetQuirk)
                    this.V[0xF] = 0;
                this.PC += 2;
                break;
            case 0x2: /* 8XY2 - AND Vx, Vy */
                //this.trace("AND Vx, Vy", op);
                this.V[this.get_x(op)] &= this.V[this.get_y(op)];
                if (q.vfResetQuirk)
                    this.V[0xF] = 0;
                this.PC += 2;
                break;
            case 0x3: /* 8XY3 - XOR Vx, Vy */
                //this.trace("XOR Vx, Vy", op);
                this.V[this.get_x(op)] ^= this.V[this.get_y(op)];
                if (q.vfResetQuirk)
                    this.V[0xF] = 0;
                this.PC += 2;
                break;
            case 0x4: { /* 8XY4 - ADD Vx, Vy */
                //this.trace("ADD Vx, Vy", op);
                let sum = this.V[this.get_x(op)] + this.V[this.get_y(op)];
                this.V[this.get_x(op)] = sum & 0xFF;
                this.V[0xF] = (sum > 255) ? 1 : 0;
                this.PC += 2;
                break;
            }
            case 0x5: { /* 8XY5 - SUB Vx, Vy */
                //this.trace("SUB Vx, Vy", op);
                let borrow = (this.V[this.get_x(op)]) >= this.V[this.get_y(op)] ? 1 : 0;
                this.V[this.get_x(op)] = (this.V[this.get_x(op)] - this.V[this.get_y(op)]) & 0xFF;
                this.V[0xF] = borrow;
                this.PC += 2;
                break;
            }
            case 0x6: { /* 8XY6 - SHR Vx {, Vy} */
                //this.trace("SHR Vx, Vy", op);
                const value = q.shiftQuirk
                    ? this.V[this.get_x(op)]
                    : this.V[this.get_y(op)];
                this.V[this.get_x(op)] = value >> 1;
                this.V[0xF] = value & 0x1;
                this.PC += 2;
                break;
            }
            case 0x7: { /* 8XY7 - SUBN Vx, Vy */
                //this.trace("SUBN Vx, Vy", op);
                let borrow =  (this.V[this.get_y(op)] >= this.V[this.get_x(op)]) ? 1 : 0;
                this.V[this.get_x(op)] = (this.V[this.get_y(op)] - this.V[this.get_x(op)]) & 0xFF;
                this.V[0xF] = borrow;
                this.PC += 2;
                break;
            }
            case 0xE: { /* 8XYE - SHL Vx {, Vy} */
                //this.trace("SHL Vx, Vy", op);
                const value = q.shiftQuirk
                    ? this.V[this.get_x(op)]
                    : this.V[this.get_y(op)];
                this.V[this.get_x(op)] = (value << 1) & 0xFF;
                this.V[0xF] = (value >> 7) & 0x1;
                this.PC += 2;
                break;
            }
            default:
                this.UNKNOWN_OPCODE(op);
                break;
            }
            break;
        case 0x9000: /* 9XY0 - SNE Vx, Vy */
            //this.trace("SNE Vx, Vy", op);
            this.PC += (this.V[this.get_x(op)] != this.V[this.get_y(op)]) ? 4 : 2;
            break;
        case 0xA000: /* ANNN - LD I, addr */
            //this.trace("LD I, addr", op);
            this.I = this.get_nnn(op);
            this.PC += 2;
            break;
        case 0xB000: /* BNNN - JP V0, addr */
            //this.trace("JP V0, addr", op);
            if (q.jumpQuirk)
                this.PC = this.get_nnn(op) + this.V[this.get_x(op)];
            else
                this.PC = this.get_nnn(op) + this.V[0x0];
            break;
        case 0xC000: /* CXKK - RND Vx, byte */
            //this.trace("RND Vx, Vy", op);
            this.V[this.get_x(op)] = (Math.floor(Math.random() * 0x100)) & this.get_kk(op);
            this.PC += 2;
            break;
        case 0xD000: { /* DXYN - DRW Vx, Vy, nibble */
            //this.trace("DRW Vx, Vy", op);

            let x = this.V[this.get_x(op)] % this.displayWidth;
            let y = this.V[this.get_y(op)] % this.displayHeight;
            let h = this.get_n(op);

            // CHIP-8: 8 x N
            // SCHIP: DXY0 = 16 x 16

            let width = 8;
            let height = h;

            if (h === 0 && this.displayWidth === 128) {
                width=16;
                height=16;
            }

            this.V[0xF] = 0;

            for (let row = 0; row < height; row++) {
                let spriteRow;

                if (width === 16) {
                    spriteRow = (this.memory[this.I + row * 2] << 8) |
                            this.memory[this.I + row * 2 + 1];
                } else {
                    spriteRow = this.memory[this.I + row];
                }
                
                for (let col = 0; col < width; col++) {
                    
                    if ((spriteRow & (width === 16 ? 0x8000 : 0x80) >> col) != 0) {
                        let px = x + col;
                        let py = y + row;

                        if (q.clipQuirk) {
                            if (px >= this.displayWidth ||
                                    py >= this.displayHeight)
                                continue;
                        } else {
                            px %= this.displayWidth;
                            py %= this.displayHeight;
                        }

                        let vid_index = px + (py * this.displayWidth);
                        if (this.video[vid_index] === 1)
                            this.V[0xF] = 1;
                        this.video[vid_index] ^= 1;
                    }
                }
            }
            
            this.PC += 2;
            if (q.dispWaitQuirk)
                this.displayWait = true;
            break;
        }
        case 0xE000:
            switch (this.get_kk(op)) {
            case 0x9E: /* EX9E - SKP Vx */
                //this.trace("SKP Vx", op);
                if (this.keypad.isPressed(this.V[this.get_x(op)]))
                    this.PC += 4;
                else
                    this.PC += 2;
                break;
            case 0xA1: /* EXA1 - SKNP Vx */
                //this.trace("SKNP Vx", op);
                if (!this.keypad.isPressed(this.V[this.get_x(op)]))
                    this.PC += 4;
                else
                    this.PC += 2;
                break;
            default:
                this.UNKNOWN_OPCODE(op);
                break;
            }
            break;
        case 0xF000:
            //console.log(
            //   "FX opcode:",
            //    op.toString(16),
            //    "kk:",
            //    this.get_kk(op).toString(16)
            //);
            switch (this.get_kk(op)) {
            case 0x07: /* FX07 - LD Vx, DT */
                //this.trace("LD Vx, DT", op);
                this.V[this.get_x(op)] = this.DT;
                this.PC += 2;
                break;
            case 0x0A: { /* FX0A - LD Vx, K */
                //this.trace("LD Vx, K", op);

                if (this.waitingKey) {
                    if (!this.keypad.isPressed(this.keyPressed)) {
                        this.V[this.keyRegister] = this.keyPressed;
                        
                        this.waitingKey = false;
                        this.keyPressed = -1;

                        this.PC += 2;
                    }
                    break; 
                }

                for (let i = 0; i < 16; i++) {
                    if (this.keypad.isPressed(i)) {
                        this.keyPressed = i;
                        
                        this.keyRegister =  this.get_x(op);
                        this.waitingKey = true;
                        
                        break;
                    }
                }
                break;
            }
            case 0x15: /* FX15 - LD DT, Vx */
                //this.trace("LD DT, Vx", op);
                this.DT = this.V[this.get_x(op)];
                this.PC += 2;
                break;
            case 0x18: /* Fx18 - LD ST, Vx */
                //this.trace("LD ST, Vx", op);
                this.ST = this.V[this.get_x(op)];
                this.PC += 2;
                break;
            case 0x1E: /* FX1E - ADD I, Vx */
                //this.trace("ADD I, Vx", op);
                this.I += this.V[this.get_x(op)];
                this.PC += 2;
                break;
            case 0x29: /* FX29 - LD F, Vx */
                //this.trace("LD F, Vx",op);
                this.I = this.V[this.get_x(op)] * 5;
                this.PC += 2;
                break;
            case 0x30: /* FX30 - LD HF, Vx */
                this.I = 50 + this.V[this.get_x(op)] * 10;
                this.PC += 2;
                break;
            case 0x33: { /* Fx33 - LD B, Vx */
                //this.trace("LD B, Vx", op);
                let value = this.V[this.get_x(op)];
                this.memory[this.I] = Math.floor(value / 100);
                this.memory[this.I + 1] = Math.floor(value / 10) % 10;
                this.memory[this.I + 2] = value % 10;
                this.PC += 2;
                break;
            }
            case 0x55: { /* Fx55 - LD [I], Vx */
                //this.trace("LD [i], Vx", op);
                let x = this.get_x(op);
                for (let i = 0; i <= x; i++)
                    this.memory[this.I + i] = this.V[i];
                if (q.memoryQuirk)
                    this.I += x + 1;
                this.PC += 2;
                break;
            }
            case 0x65: { /* FX65 - LD Vx, [I] */
                //this.trace("LD Vx, [i]", op);
                let x =  this.get_x(op);
                for (let i = 0; i <= x; i++)
                    this.V[i] = this.memory[this.I + i];
                if (q.memoryQuirk)
                    this.I += x + 1;
                this.PC += 2;
                break;
            }
            default:
                this.UNKNOWN_OPCODE(op);
                break;
            }
            break;
        default:
            this.UNKNOWN_OPCODE(op);
            break;
        }
    }

    // Execute CPU cycle

    cpuCycle() {
        this.displayWait = false;

        for (let i = 0; i < this.cyclesPerFrame; i++)
            this.cpuStep();

        if (this.DT > 0) this.DT--;
        if (this.ST > 0) this.ST--;
    }
}
