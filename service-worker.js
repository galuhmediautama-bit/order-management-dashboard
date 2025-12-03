// service-worker.js

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Biarkan permintaan untuk Meta Pixel langsung ke jaringan.
  // Ini mencegah masalah caching dengan skrip pelacakan.
  if (url.includes("connect.facebook.net") || url.includes("facebook.com/tr")) {
    // Dengan tidak memanggil event.respondWith(), kita membiarkan browser
    // menangani permintaan sebagai permintaan jaringan normal.
    return;
  }

  // Untuk semua permintaan lainnya, Anda dapat menambahkan logika caching di sini jika diperlukan di masa depan.
});
