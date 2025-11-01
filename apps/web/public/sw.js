self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const client = clients.find((item) => "focus" in item);
      if (client) {
        return client.focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/overview");
      }
      return undefined;
    })
  );
});
