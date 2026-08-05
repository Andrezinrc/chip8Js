const CACHE_NAME = "chip8-v11";

const FILES = [
    "./",
    "./index.html",
    "./main.js",
    "./cpu.js",
    "./video.js",
    "./audio.js",
    "./keypad.js",
    "./fontset.js",
    "./config.js",
    "./quirks.js",
    "./theme.js",
    "./styles.css",
    "./manifest.json",
    "./icon.png",
];


self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(FILES))
    );
});


self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
});
