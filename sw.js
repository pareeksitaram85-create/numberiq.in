const CACHE_NAME = 'numberiq-cache-v1';
const ASSETS = [
  'index.html',
  'tools.html',
  'assets/numberiq.css',
  'favicon.png',
  'favicon.svg',
  'favicon-light.svg',
  'apple-touch-icon.png',
  'Invoice Compliance.html',
  'GST_ReCO_Studio_IMS_FIXED.html',
  'HSN_SAC_Finder.html',
  'gst-late-fee-calculator.html',
  'gst-interest-calculator.html',
  'itc-utilization-calculator.html',
  'numberiq-tds-chart-fy2026-27.html',
  'tds-interest-calculator.html',
  'lrs-tcs-calculator.html',
  'advance-tax-calculator.html',
  'income-tax-calculator-fy2026-27.html',
  'interest-234abc-calculator.html',
  'capital-gains-tax-calculator.html',
  'depreciation-block-assets-calculator.html',
  'msme-payment-tracker-calculator.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => console.warn('Cache install warning:', err));
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
