import { test } from 'node:test';
import assert from 'node:assert/strict';
import { distribuisci, FIGURE } from '../src/distribuzione.js';

test('le figure sono le 12 carte J, Q, K di tutti i semi', () => {
  assert.deepEqual([...FIGURE].sort(), [
    'JC', 'JD', 'JH', 'JS', 'KC', 'KD', 'KH', 'KS', 'QC', 'QD', 'QH', 'QS',
  ]);
});

test('mano iniziale e mano finale hanno 6 figure ciascuna, senza nessuna in comune', () => {
  const { manoIniziale, manoFinale } = distribuisci();
  assert.equal(manoIniziale.length, 6);
  assert.equal(manoFinale.length, 6);
  assert.equal(new Set([...manoIniziale, ...manoFinale]).size, 12);
});
