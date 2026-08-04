export class Audio {
    constructor() {
        this.ctx = null;
        this.gain = null;
        this.osc = null;
        this.started = false;
    }

    async init() {
        if (this.started) {
            if (this.ctx.state !== "running")
                await this.ctx.resume();
            return;
        }

        this.ctx = new AudioContext();

        await this.ctx.resume();

        //console.log(this.ctx.state);
        //alert(this.ctx.state);

        this.osc = this.ctx.createOscillator();
        this.gain = this.ctx.createGain();

        this.osc.type = "square";
        this.osc.frequency.value = 440;

        this.gain.gain.value = 0;

        this.osc.connect(this.gain);
        this.gain.connect(this.ctx.destination);

        this.osc.start();

        this.started = true;
    }

    async play() {
        await this.init();

        if (this.ctx.state !== "running")
            await this.ctx.resume();

        this.gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    }

    stop() {
        if (!this.started) return;

        this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
}
