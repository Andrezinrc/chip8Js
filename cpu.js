export class Chip8 {
    constructor() {
        // Core
        this.memory  = new Uint8Array(4096);
        this.V       = new Uint8Array(16);
        this.I       = 0;
        this.PC      = 0x200;

        // Stack
        this.stack   = new Uint16Array(16);
        this.SP      = 0;

        // Video
        this.display = new Uint8Array(2048);

        // Timers
        this.DT      = 0;
        this.ST      = 0;

        this.debug   = true;

        this.cpuInit();
    }

    // Instruction operand extractors
    
    get_x(op)   {   return (op & 0x0F00) >> 8;   }
    get_y(op)   {   return (op & 0x00F0) >> 4;   }
    get_n(op)   {   return (op & 0x000F);        }
    get_kk(op)  {   return (op & 0x00FF);        }
    get_nnn(op) {   return (op & 0x0FFF);        }

    // Load rom

    loadRom(romData) {
        if (romData.length <=  3584) {
            for (let i = 0; i < romData.length; i++)
                this.memory[0x200 + i] = romData[i];
        }
    }

    cpuInit() {   console.log("--- Initializing CPU ---\n");   }

    
    // Trace

    cpuTrace(name, op) {
        if (!this.debug) return;

        
    }


    // CPU Instructions

    cpuStep() {
        let op = (this.memory[this.PC] << 8) | this.memory[this.PC + 1];

        /* Decode & Execute */
        switch (op & 0xF000) {
        case 0x0000:
            switch (this.get_kk(op)) {
            case 0x00E0: /* CLS */
                this.display.fill(0);
                this.PC += 2;
                break;
            case 0x00EE: /* RET */
                this.SP--;
                this.PC = this.stack[this.SP];
                this.PC += 2;
                break;
            default: /* SYS */
                this.PC += 2;
                break;
            }
            break;
        case 0x1000: /* 1NNN - JP addr */
            this.PC = this.get_nnn(op);
            break;
        case 0x2000: /* 2NNN - CALL addr */
            this.stack[this.SP] = this.PC;
            this.SP++;
            this.PC = this.get_nnn();
            break;
        case 0x3000: /* 3XKK - SE Vx, byte */
            this.PC += (this.V[this.get_x(op)] == this.get_kk(op)) ? 4 : 2;
            break;
        case 0x4000:
            this.PC += (this.V[this.get_x(op)] != this.get_kk(op)) ? 4 : 2;
            break;
        case 0x5000:
            switch (this.get_n(op)) {
            case 0x0: /* 5XY0 - SE Vx, Vy */
                this.PC += (this.V[this.get_x(op)] == this.get_y(op)) ? 4 : 2;
                break;
            }
            break;
        }
    }

    // Execute CPU cycle

    cpuCycle() {
        for (let i = 0; i < 10; i++)
            this.cpuStep();

        if (this.DT > 0) this.DT--;
        if (this.ST > 0) this.ST--;
    }
}
