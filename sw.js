// Tiene in cache tutta la pagina, così il trucco funziona anche senza connessione.
// Strategia "stale-while-revalidate": risponde subito dalla cache e intanto scarica
// la versione aggiornata, che verrà usata alla visita successiva.
// Incrementare VERSIONE quando si aggiungono o tolgono file da FILE.
const VERSIONE = 'carte-v1';
const FILE = [
  './',
  'index.html',
  'stile.css',
  'manifest.webmanifest',
  'src/app.js',
  'src/esibizione.js',
  'src/distribuzione.js',
  'src/giro.js',
  'icone/icona-180.png',
  'icone/icona-192.png',
  'icone/icona-512.png',
  ...['J', 'Q', 'K'].flatMap((r) => ['C', 'D', 'H', 'S'].map((s) => `cards/${r}${s}.svg`)),
];

// cache: 'reload' salta la cache HTTP del browser, per non mescolare file vecchi e nuovi.
const scarica = (richiesta) => fetch(new Request(richiesta, { cache: 'reload' }));

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches
      .open(VERSIONE)
      .then((cache) => Promise.all(FILE.map((f) => scarica(f).then((r) => cache.put(f, r)))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomi) => Promise.all(nomi.filter((n) => n !== VERSIONE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  evento.respondWith(
    caches.open(VERSIONE).then(async (cache) => {
      const inCache = await cache.match(request, { ignoreSearch: true });
      const aggiornata = scarica(request)
        .then((risposta) => {
          if (risposta.ok) cache.put(request, risposta.clone());
          return risposta;
        })
        .catch(() => inCache);
      if (inCache) {
        evento.waitUntil(aggiornata);
        return inCache;
      }
      return aggiornata;
    }),
  );
});
