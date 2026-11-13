// @ts-check

/** @typedef {{ alpha: number | null, beta: number | null, gamma: number | null }} Lettura */

const RAD = Math.PI / 180;

/**
 * Sotto questa componente orizzontale la direzione dello schermo è troppo incerta
 * (telefono quasi piatto) e la lettura viene ignorata.
 */
const MIN_ORIZZONTALE = 0.35;

/**
 * Direzione orizzontale verso cui guarda lo schermo, in gradi, oppure null se il
 * telefono è troppo piatto per dirlo.
 *
 * Si calcola la normale allo schermo nel sistema di riferimento della Terra
 * (rotazione Z-X'-Y'' del DeviceOrientationEvent) e la si proietta sul piano
 * orizzontale. A differenza di alpha da solo, funziona anche con il telefono in
 * piedi, dove gli angoli di Eulero degenerano e la rotazione può finire in gamma.
 * @param {Lettura} lettura
 * @returns {number | null}
 */
function direzioneSchermo({ alpha, beta, gamma }) {
  if (alpha == null || beta == null || gamma == null) return null;
  const sA = Math.sin(alpha * RAD), cA = Math.cos(alpha * RAD);
  const sB = Math.sin(beta * RAD);
  const sG = Math.sin(gamma * RAD), cG = Math.cos(gamma * RAD);
  const x = cA * sG + sA * sB * cG;
  const y = sA * sG - cA * sB * cG;
  if (Math.hypot(x, y) < MIN_ORIZZONTALE) return null;
  return Math.atan2(y, x) / RAD;
}

/**
 * Differenza fra due direzioni ridotta a (-180, 180].
 * @param {number} da
 * @param {number} a
 */
function differenza(da, a) {
  const d = (((a - da) % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
}

/**
 * Rileva il giro: la rotazione netta del telefono attorno all'asse verticale,
 * in qualunque verso, supera la soglia. Le oscillazioni avanti e indietro si
 * annullano.
 * @param {number} soglia in gradi
 */
export function creaRilevatoreGiro(soglia) {
  /** @type {number | null} */
  let ultima = null;
  let rotazione = 0;
  return {
    /**
     * @param {Lettura} lettura
     * @returns {boolean} true se, con questa lettura, la rotazione netta ha raggiunto la soglia
     */
    leggi(lettura) {
      const direzione = direzioneSchermo(lettura);
      if (direzione == null) {
        // Passando per il piatto la direzione può ribaltarsi di 180° senza alcun
        // giro: si riparte dalla prossima lettura valida invece di sommare il salto.
        if (lettura.alpha != null && lettura.beta != null && lettura.gamma != null) ultima = null;
        return false;
      }
      if (ultima != null) rotazione += differenza(ultima, direzione);
      ultima = direzione;
      return Math.abs(rotazione) >= soglia;
    },
  };
}
