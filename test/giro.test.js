import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creaRilevatoreGiro } from '../src/giro.js';

/** Fornisce le letture al rilevatore e restituisce true se il giro è stato rilevato. */
function giroRilevato(letture, soglia = 150) {
  const rilevatore = creaRilevatoreGiro(soglia);
  return letture.some((lettura) => rilevatore.leggi(lettura));
}

/** Letture con il telefono in piedi (schermo verticale) e alpha da `da` ad `a` a passi di 10°. */
function inPiedi(da, a, passo = 10) {
  const letture = [];
  const verso = Math.sign(a - da);
  for (let alpha = da; verso * alpha <= verso * a; alpha += verso * passo) {
    letture.push({ alpha: ((alpha % 360) + 360) % 360, beta: 90, gamma: 0 });
  }
  return letture;
}

test('telefono in piedi ruotato di 160° attorno all asse verticale: giro rilevato', () => {
  assert.equal(giroRilevato(inPiedi(0, 160)), true);
});

test('telefono in piedi ruotato di 140°: nessun giro', () => {
  assert.equal(giroRilevato(inPiedi(0, 140)), false);
});

const RAD = Math.PI / 180;

/**
 * Lettura come la darebbe il browser per un telefono tenuto in verticale,
 * inclinato all'indietro di `inclinazione` gradi (90 = perfettamente in piedi),
 * ruotato attorno all'asse verticale di `imbardata` gradi e piegato di lato di `rollio`.
 * Compone la rotazione Rz(imbardata)·Rx(inclinazione)·Ry(rollio) e la scompone negli
 * angoli Z-X'-Y'' del DeviceOrientationEvent: alpha in [0, 360), beta in [-180, 180),
 * gamma in [-90, 90).
 */
function lettura(imbardata, inclinazione, rollio = 0) {
  const [a, b, g] = [imbardata * RAD, inclinazione * RAD, rollio * RAD];
  const [sA, cA, sB, cB, sG, cG] = [Math.sin(a), Math.cos(a), Math.sin(b), Math.cos(b), Math.sin(g), Math.cos(g)];
  const R12 = -sA * cB, R22 = cA * cB;
  const R31 = -cB * sG, R32 = sB, R33 = cB * cG;
  const gamma = Math.atan(-R31 / R33);
  const cosB = R33 / Math.cos(gamma);
  const beta = Math.atan2(R32, cosB);
  const alpha = cosB >= 0 ? Math.atan2(-R12, R22) : Math.atan2(R12, -R22);
  return { alpha: ((alpha / RAD) % 360 + 360) % 360, beta: beta / RAD, gamma: gamma / RAD };
}

/** Sequenza di letture con l'imbardata che percorre i valori indicati a passi di 5°. */
function gesto(tappe, inclinazione, rollio = 0) {
  const letture = [];
  for (let i = 1; i < tappe.length; i++) {
    const [da, a] = [tappe[i - 1], tappe[i]];
    const verso = Math.sign(a - da);
    for (let y = da; verso * y < verso * a; y += verso * 5) letture.push(lettura(y, inclinazione, rollio));
  }
  letture.push(lettura(tappe.at(-1), inclinazione, rollio));
  return letture;
}

test('telefono quasi in piedi e un po piegato di lato, ruotato di 160°: giro rilevato', () => {
  assert.equal(giroRilevato(gesto([0, 160], 85, 10)), true);
});

test('telefono quasi in piedi, ruotato di 140°: nessun giro', () => {
  assert.equal(giroRilevato(gesto([0, 140], 85, 10)), false);
});

test('telefono inclinato all indietro di 60°, giro in verso antiorario: giro rilevato', () => {
  assert.equal(giroRilevato(gesto([30, -130], 60)), true);
});

test('il giro attraversa il nord (alpha passa da 359° a 0°): giro rilevato', () => {
  assert.equal(giroRilevato(gesto([300, 460], 80)), true);
});

test('oscillazioni avanti e indietro di 100° non si sommano', () => {
  assert.equal(giroRilevato(gesto([0, 100, 0, 100, 0, 100, 0], 80)), false);
});

test('oscillazioni seguite da un giro vero: giro rilevato', () => {
  assert.equal(giroRilevato(gesto([0, 60, -20, 160], 80)), true);
});

test('telefono appoggiato piatto e ruotato sul tavolo: nessun giro', () => {
  assert.equal(giroRilevato(gesto([0, 180], 0)), false);
});

test('letture vuote (sensore senza dati) vengono ignorate', () => {
  assert.equal(giroRilevato([{ alpha: null, beta: null, gamma: null }, ...gesto([0, 160], 80)]), true);
});

test('telefono perfettamente in piedi, il browser riporta il giro in gamma invece che in alpha: giro rilevato', () => {
  const letture = [];
  for (let gamma = -80; gamma <= 80; gamma += 5) letture.push({ alpha: 0, beta: 90, gamma });
  assert.equal(giroRilevato(letture), true);
});

test('telefono perfettamente in piedi, il giro è diviso fra alpha (80°) e gamma (80°): giro rilevato', () => {
  const letture = [];
  for (let i = 0; i <= 16; i++) letture.push({ alpha: i * 5, beta: 90, gamma: -40 + i * 5 });
  assert.equal(giroRilevato(letture), true);
});

test('telefono ribaltato in avanti passando per la posizione piatta (senza girarlo): nessun giro', () => {
  const letture = [];
  for (let beta = 80; beta >= -80; beta -= 5) letture.push({ alpha: 30, beta, gamma: 0 });
  assert.equal(giroRilevato(letture), false);
});
