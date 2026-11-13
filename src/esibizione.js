// @ts-check
import { distribuisci as distribuisciDefault } from './distribuzione.js';
import { creaRilevatoreGiro } from './giro.js';

/** @typedef {'dorso' | 'iniziale' | 'finale'} Schermata */
/** @typedef {'nessuna' | 'pronto' | 'cambio'} Spia */

/** Due tocchi nell'angolo entro questo intervallo formano il comando di riserva. */
const DOPPIO_TOCCO_MS = 450;
/**
 * Dopo ogni cambio di schermata i tocchi vengono ignorati per questo tempo, così un
 * tocco di troppo (il secondo di un doppio tocco, un tocco arrivato mentre scattava
 * il giro) non fa tornare al dorso davanti allo spettatore.
 */
const PAUSA_MS = 800;

/**
 * Le esibizioni, una dopo l'altra: dorso → mano iniziale → (giro o comando di
 * riserva) → mano finale → dorso.
 * @param {{ soglia: number, distribuisci?: typeof distribuisciDefault }} opzioni
 */
export function creaEsibizione({ soglia, distribuisci = distribuisciDefault }) {
  /** @type {Schermata} */
  let schermata = 'dorso';
  /** @type {string[]} */
  let manoIniziale = [];
  /** @type {string[]} */
  let manoFinale = [];
  let rilevatore = creaRilevatoreGiro(soglia);
  let sensoreAttivo = false;
  let ultimoCambioSchermata = -Infinity;
  let ultimoToccoAngolo = -Infinity;

  /**
   * @param {Schermata} nuova
   * @param {number} istante
   */
  function mostra(nuova, istante) {
    schermata = nuova;
    ultimoCambioSchermata = istante;
    ultimoToccoAngolo = -Infinity;
  }

  /** @returns {Spia} */
  function spia() {
    if (schermata === 'finale') return 'cambio';
    if (schermata === 'iniziale' && sensoreAttivo) return 'pronto';
    return 'nessuna';
  }

  return {
    get stato() {
      return { schermata, manoIniziale, manoFinale, spia: spia() };
    },

    /**
     * Un tocco sullo schermo.
     * @param {{ istante: number, nelAngolo?: boolean }} tocco
     *   istante in ms; nelAngolo: se è avvenuto nell'angolo del comando di riserva
     */
    tocco({ istante, nelAngolo = false }) {
      if (istante - ultimoCambioSchermata < PAUSA_MS) return;
      if (schermata === 'dorso') {
        ({ manoIniziale, manoFinale } = distribuisci());
        rilevatore = creaRilevatoreGiro(soglia);
        sensoreAttivo = false;
        mostra('iniziale', istante);
      } else if (schermata === 'iniziale') {
        if (!nelAngolo) return;
        if (istante - ultimoToccoAngolo < DOPPIO_TOCCO_MS) mostra('finale', istante);
        else ultimoToccoAngolo = istante;
      } else {
        mostra('dorso', istante);
      }
    },

    /**
     * Una lettura del sensore di orientamento.
     * @param {import('./giro.js').Lettura} lettura
     * @param {number} istante in ms, sullo stesso orologio dei tocchi
     */
    sensore(lettura, istante) {
      if (schermata !== 'iniziale') return;
      if (lettura.alpha != null && lettura.beta != null && lettura.gamma != null) sensoreAttivo = true;
      if (rilevatore.leggi(lettura)) mostra('finale', istante);
    },
  };
}
