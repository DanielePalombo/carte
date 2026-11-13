// @ts-check

/** Le 12 figure: rango (J, Q, K) + seme (C fiori, D quadri, H cuori, S picche). */
export const FIGURE = Object.freeze(
  ['J', 'Q', 'K'].flatMap((rango) => ['C', 'D', 'H', 'S'].map((seme) => rango + seme)),
);

/** Figure in ciascuna mano: la mano finale è formata da tutte le altre. */
const FIGURE_PER_MANO = 6;

/**
 * Mescola una copia dell'array (Fisher-Yates).
 * @template T
 * @param {readonly T[]} figure
 * @param {() => number} casuale
 * @returns {T[]}
 */
function mescola(figure, casuale) {
  const mazzo = [...figure];
  for (let i = mazzo.length - 1; i > 0; i--) {
    const j = Math.floor(casuale() * (i + 1));
    [mazzo[i], mazzo[j]] = [mazzo[j], mazzo[i]];
  }
  return mazzo;
}

/**
 * Pesca 6 figure a caso per la mano iniziale; la mano finale sono le altre 6.
 * @param {() => number} [casuale]
 * @returns {{ manoIniziale: string[], manoFinale: string[] }}
 */
export function distribuisci(casuale = Math.random) {
  const mazzo = mescola(FIGURE, casuale);
  return { manoIniziale: mazzo.slice(0, FIGURE_PER_MANO), manoFinale: mazzo.slice(FIGURE_PER_MANO) };
}
