import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creaEsibizione } from '../src/esibizione.js';

/**
 * Esibizione con un orologio finto: ogni gesto avviene `dopo` ms dal precedente
 * (di default abbastanza tardi da non cadere in nessuna pausa).
 */
function prova(opzioni = {}) {
  const esibizione = creaEsibizione({ soglia: 150, ...opzioni });
  let ora = 10_000;
  return {
    get stato() {
      return esibizione.stato;
    },
    tocco({ dopo = 2000, nelAngolo = false } = {}) {
      ora += dopo;
      esibizione.tocco({ istante: ora, nelAngolo });
    },
    doppioToccoAngolo() {
      this.tocco({ nelAngolo: true });
      this.tocco({ nelAngolo: true, dopo: 200 });
    },
    /** Telefono in piedi ruotato da 0° a `gradi` attorno all'asse verticale. */
    giro(gradi, da = 0) {
      for (let alpha = da; alpha <= gradi; alpha += 10) {
        ora += 20;
        esibizione.sensore({ alpha, beta: 90, gamma: 0 }, ora);
      }
    },
    sensore(lettura) {
      ora += 20;
      esibizione.sensore(lettura, ora);
    },
  };
}

function suManoIniziale(opzioni) {
  const p = prova(opzioni);
  p.tocco();
  return p;
}

// ---------- Dorso e mano iniziale ----------

test('si parte dal dorso', () => {
  assert.equal(prova().stato.schermata, 'dorso');
});

test('un tocco sul dorso mostra la mano iniziale di 6 figure', () => {
  const p = suManoIniziale();
  assert.equal(p.stato.schermata, 'iniziale');
  assert.equal(p.stato.manoIniziale.length, 6);
});

test('i tocchi sulla mano iniziale fuori dall angolo non cambiano nulla', () => {
  const p = suManoIniziale();
  const prima = p.stato.manoIniziale;
  p.tocco();
  p.tocco({ dopo: 200 });
  assert.equal(p.stato.schermata, 'iniziale');
  assert.deepEqual(p.stato.manoIniziale, prima);
});

// ---------- Giro ----------

test('un giro di 160° durante la mano iniziale mostra la mano finale', () => {
  const p = suManoIniziale();
  p.giro(160);
  assert.equal(p.stato.schermata, 'finale');
});

test('una rotazione di 140° lascia la mano iniziale', () => {
  const p = suManoIniziale();
  p.giro(140);
  assert.equal(p.stato.schermata, 'iniziale');
});

test('dopo il cambio, altre rotazioni non cambiano la mano finale', () => {
  const p = suManoIniziale();
  p.giro(160);
  const finale = p.stato.manoFinale;
  p.giro(360, 170);
  assert.equal(p.stato.schermata, 'finale');
  assert.deepEqual(p.stato.manoFinale, finale);
});

test('le rotazioni fatte sul dorso non contano per il giro della mano iniziale', () => {
  const p = prova();
  p.giro(140);
  p.tocco();
  p.sensore({ alpha: 140, beta: 90, gamma: 0 });
  p.sensore({ alpha: 160, beta: 90, gamma: 0 });
  assert.equal(p.stato.schermata, 'iniziale');
});

// ---------- Comando di riserva ----------

test('comando di riserva: doppio tocco nell angolo durante la mano iniziale mostra la mano finale', () => {
  const p = suManoIniziale();
  p.doppioToccoAngolo();
  assert.equal(p.stato.schermata, 'finale');
});

test('due tocchi nell angolo troppo distanti nel tempo non fanno il cambio', () => {
  const p = suManoIniziale();
  p.tocco({ nelAngolo: true });
  p.tocco({ nelAngolo: true, dopo: 1000 });
  assert.equal(p.stato.schermata, 'iniziale');
});

test('il doppio tocco nell angolo sul dorso distribuisce soltanto la mano iniziale', () => {
  const p = prova();
  p.doppioToccoAngolo();
  assert.equal(p.stato.schermata, 'iniziale');
});

// ---------- Mano finale e ritorno al dorso ----------

test('un tocco sulla mano finale torna al dorso, il tocco dopo distribuisce una mano nuova', () => {
  const mani = [
    { manoIniziale: ['KH', 'QS', 'JD', 'KC', 'QD', 'JS'], manoFinale: ['KS', 'QH', 'JC', 'KD', 'QC', 'JH'] },
    { manoIniziale: ['QH', 'JC', 'KS', 'QC', 'JH', 'KD'], manoFinale: ['QS', 'JD', 'KH', 'QD', 'JS', 'KC'] },
  ];
  const p = suManoIniziale({ distribuisci: () => mani.shift() });
  p.doppioToccoAngolo();
  p.tocco();
  assert.equal(p.stato.schermata, 'dorso');
  p.tocco();
  assert.equal(p.stato.schermata, 'iniziale');
  assert.deepEqual(p.stato.manoIniziale, ['QH', 'JC', 'KS', 'QC', 'JH', 'KD']);
});

test('un tocco nell angolo subito dopo un cambio fatto col giro non torna al dorso', () => {
  const p = suManoIniziale();
  p.tocco({ nelAngolo: true });
  p.giro(160);
  p.tocco({ nelAngolo: true, dopo: 100 });
  assert.equal(p.stato.schermata, 'finale');
});

test('un terzo tocco rapido dopo il doppio tocco di riserva non torna al dorso', () => {
  const p = suManoIniziale();
  p.doppioToccoAngolo();
  p.tocco({ nelAngolo: true, dopo: 200 });
  assert.equal(p.stato.schermata, 'finale');
});

test('un doppio tocco sulla mano finale torna al dorso senza distribuire subito una mano nuova', () => {
  const p = suManoIniziale();
  p.doppioToccoAngolo();
  p.tocco();
  p.tocco({ dopo: 200 });
  assert.equal(p.stato.schermata, 'dorso');
});

// ---------- Spia ----------

test('spia: nessuna croce finché il sensore non manda dati', () => {
  const p = suManoIniziale();
  p.sensore({ alpha: null, beta: null, gamma: null });
  assert.equal(p.stato.spia, 'nessuna');
});

test('spia: sensore pronto appena arriva una lettura valida, anche col telefono piatto', () => {
  const p = suManoIniziale();
  p.sensore({ alpha: 10, beta: 0, gamma: 0 });
  assert.equal(p.stato.spia, 'pronto');
});

test('spia: cambio avvenuto sulla mano finale, sia col giro sia col comando di riserva', () => {
  const conGiro = suManoIniziale();
  conGiro.giro(160);
  assert.equal(conGiro.stato.spia, 'cambio');
  const conRiserva = suManoIniziale();
  conRiserva.doppioToccoAngolo();
  assert.equal(conRiserva.stato.spia, 'cambio');
});

test('spia: a ogni nuova esibizione torna a nessuna finché il sensore non risponde', () => {
  const p = suManoIniziale();
  p.sensore({ alpha: 10, beta: 90, gamma: 0 });
  p.doppioToccoAngolo();
  p.tocco();
  p.tocco();
  assert.equal(p.stato.spia, 'nessuna');
});
