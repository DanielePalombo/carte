// @ts-check
import { creaEsibizione } from './esibizione.js';
import { FIGURE } from './distribuzione.js';

/** Vibrazione breve al cambio (solo Android: iPhone non la supporta). */
const VIBRAZIONE_ATTIVA = true;
const DURATA_VIBRAZIONE_MS = 40;
/** Gradi di rotazione netta attorno all'asse verticale che fanno scattare il cambio. */
const SOGLIA_GIRO = 150;
/** Angolo in alto a destra del comando di riserva, in frazione dello schermo. */
const ANGOLO_RISERVA = { larghezza: 0.3, altezza: 0.2 };
/** Lato indicativo, in px, di una mattonella del motivo del panno. */
const MATTONELLA_PX = 22;

const esibizione = creaEsibizione({ soglia: SOGLIA_GIRO });
const carte = /** @type {HTMLImageElement[]} */ ([...document.querySelectorAll('.carta')]);
const percorsoFigura = (/** @type {string} */ figura) => `cards/${figura}.svg`;

// ---------- Disegno ----------

/** @type {{ schermata: string, spia: string, manoIniziale: string[] } | null} */
let disegnato = null;

function disegna() {
  const { schermata, manoIniziale, manoFinale, spia } = esibizione.stato;
  if (
    disegnato &&
    disegnato.schermata === schermata &&
    disegnato.spia === spia &&
    disegnato.manoIniziale === manoIniziale
  ) {
    return;
  }
  const cambio = disegnato?.schermata === 'iniziale' && schermata === 'finale';
  disegnato = { schermata, spia, manoIniziale };

  const mano = schermata === 'finale' ? manoFinale : manoIniziale;
  carte.forEach((img, i) => {
    const src = mano[i] ? percorsoFigura(mano[i]) : '';
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
  });
  document.body.dataset.schermata = schermata;
  document.body.dataset.spia = spia;

  if (cambio && VIBRAZIONE_ATTIVA) navigator.vibrate?.(DURATA_VIBRAZIONE_MS);
}

/** Rende la larghezza dello schermo un multiplo esatto della mattonella, così la spia combacia col motivo in entrambi gli angoli. */
function adattaMattonella() {
  const colonne = Math.max(1, Math.round(innerWidth / MATTONELLA_PX));
  document.documentElement.style.setProperty('--mattonella', `${innerWidth / colonne}px`);
}

// ---------- Sensore ----------

let sensoreAvviato = false;

async function avviaSensore() {
  if (sensoreAvviato) return;
  const EventoOrientamento = /** @type {any} */ (window.DeviceOrientationEvent);
  if (typeof EventoOrientamento?.requestPermission === 'function') {
    // iPhone: il permesso va chiesto dentro un gesto dell'utente.
    try {
      if ((await EventoOrientamento.requestPermission()) !== 'granted') return;
    } catch {
      return;
    }
  }
  sensoreAvviato = true;
  addEventListener('deviceorientation', (evento) => {
    esibizione.sensore({ alpha: evento.alpha, beta: evento.beta, gamma: evento.gamma }, performance.now());
    disegna();
  });
}

// ---------- Schermo intero, verticale, schermo sempre acceso ----------

function schermoIntero() {
  const installata = matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
  if (!installata && !document.fullscreenElement && document.documentElement.requestFullscreen) {
    document.documentElement
      .requestFullscreen({ navigationUI: 'hide' })
      .then(bloccaVerticale, () => {});
  } else {
    bloccaVerticale();
  }
}

function bloccaVerticale() {
  const orientamento = /** @type {any} */ (screen.orientation);
  orientamento?.lock?.('portrait').catch(() => {});
}

/** @type {WakeLockSentinel | null} */
let wakeLock = null;

async function schermoAcceso() {
  if (wakeLock || !('wakeLock' in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => (wakeLock = null));
  } catch {
    /* non disponibile: pazienza */
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && esibizione.stato.schermata !== 'dorso') schermoAcceso();
});

// ---------- Tocchi ----------

/** @param {MouseEvent} evento */
function nelAngoloRiserva(evento) {
  return (
    evento.clientX > innerWidth * (1 - ANGOLO_RISERVA.larghezza) &&
    evento.clientY < innerHeight * ANGOLO_RISERVA.altezza
  );
}

document.addEventListener('click', async (evento) => {
  const nelAngolo = nelAngoloRiserva(evento);
  if (esibizione.stato.schermata === 'dorso') {
    // Fullscreen e wake lock vanno chiesti subito, finché il gesto è "fresco".
    schermoIntero();
    schermoAcceso();
    // Su iPhone la mano iniziale appare solo dopo la risposta al permesso.
    await avviaSensore();
  }
  esibizione.tocco({ istante: performance.now(), nelAngolo });
  disegna();
});

// ---------- Avvio ----------

// Carica e decodifica subito tutte le figure, così il cambio è istantaneo.
// I riferimenti restano in vita per tutta la sessione.
const precaricate = FIGURE.map((figura) => {
  const img = new Image();
  img.src = percorsoFigura(figura);
  img.decode?.().catch(() => {});
  return img;
});

addEventListener('resize', adattaMattonella);
adattaMattonella();
disegna();

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
