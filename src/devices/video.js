export class Video {
    constructor(ctx) {
        this.ctx = ctx;
        this.width = 64;
        this.height = 32;
        this.ctx.canvas.width = this.width;
        this.ctx.canvas.height  = this.height;
        this.imgData = this.ctx.createImageData(this.width, this.height);
    }

    setRes(width, height) {
        this.width= width;
        this.height = height;
        this.ctx.canvas.width = this.width;
        this.ctx.canvas.height = this.height;
        this.imgData = this.ctx.createImageData(width,height);
    }

    render(cpu) {
        if (this.width !== cpu.displayWidth ||
                this.height !== cpu.displayHeight)
            this.setRes(cpu.displayWidth, cpu.displayHeight);

        const data = this.imgData.data;
        const video = cpu.video;

        for (let i = 0, len = video.length; i < len; i++) {
            let pIndex = i * 4;
            let color = video[i] == 1 ? 255 : 0;

            data[pIndex]     = color;
            data[pIndex + 1] = color;
            data[pIndex + 2] = color;
            data[pIndex + 3] = 255;
        }

        this.ctx.putImageData(this.imgData, 0, 0);
    }
}
