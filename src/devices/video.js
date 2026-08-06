export class Video {
    constructor(ctx) {
        this.ctx = ctx;
        this.imgData =  ctx.createImageData(64, 32);
    }

    render(cpu) {
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
