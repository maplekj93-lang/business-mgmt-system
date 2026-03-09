// This service worker unregisters itself and any other active service workers for this domain.
// This is necessary to clear stale caches from the previous branding (Nueway).

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        self.registration.unregister()
            .then(() => self.clients.matchAll())
            .then((clients) => {
                clients.forEach((client) => {
                    if (client.url && 'navigate' in client) {
                        client.navigate(client.url);
                    }
                });
            })
    );
});
