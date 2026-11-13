# Carte

Pagina per un trucco di carte da fare col telefono. Vocabolario in [GLOSSARY.md](GLOSSARY.md).

## Come si esegue

1. Apri la pagina e aggiungila alla schermata Home: su Android, menu di Chrome → *Aggiungi a schermata Home*; su iPhone, Safari → Condividi → *Aggiungi alla schermata Home*. Si apre a schermo intero, senza barra dell'indirizzo, e funziona anche offline.
2. Prima di avvicinarti allo spettatore, tocca il **dorso**. Su iPhone, la prima volta, accetta il permesso per i sensori di movimento.
3. Appare la **mano iniziale**. Controlla la **spia**: una croce appena più chiara in basso a sinistra vuol dire che il sensore è pronto. Se manca, usa il comando di riserva.
4. Lo spettatore sceglie una carta a mente. Gira il telefono verso di te, ruotandolo attorno all'asse verticale: superati i 150° avviene il **cambio** (su Android senti una breve vibrazione) e la spia si sposta in basso a destra.
5. Rigira il telefono verso lo spettatore: la sua carta è sparita.
6. Tocca lo schermo per tornare al dorso. Il tocco successivo distribuisce una mano nuova.

**Comando di riserva**: doppio tocco nell'angolo in alto a destra della mano iniziale. Forza il cambio.

## Impostazioni

In cima a `src/app.js`:

- `VIBRAZIONE_ATTIVA`: `false` per disattivare la vibrazione al cambio.
- `SOGLIA_GIRO`: i gradi di rotazione che fanno scattare il cambio.

Le modifiche arrivano ai telefoni da sole alla seconda apertura della pagina: la prima usa la copia in cache e intanto scarica quella nuova. Se aggiungi o togli file, aggiorna la lista `FILE` in `sw.js` e incrementa `VERSIONE`.

## Sviluppo

```sh
npm test            # test della logica (Node 22)
npm run typecheck
python3 -m http.server 8765   # poi http://localhost:8765
```

## Crediti

Figure: [English pattern playing cards](https://commons.wikimedia.org/wiki/Category:SVG_English_pattern_playing_cards) di Dmitry Fomin, dominio pubblico (CC0).
