const CACHE_NAME = "chip8-v1";

const FILES = [
    "./",
    "./index.html",
    "./main.js",
    "./cpu.js",
    "./video.js",
    "./keypad.js",
    "./fontset.js",
    "./styles.css",
    "./manifest.json"
];


self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(FILES))
    );
});


self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
});
