// Service worker minimal — buat menampilkan notifikasi pengingat IF
self.addEventListener("install", function (e) { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  e.waitUntil(self.clients.openWindow("/calories.html#fasting"));
});
