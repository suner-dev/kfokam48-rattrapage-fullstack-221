/**
 * Vérification 3 : l'état d'erreur, obtenu en arrêtant VRAIMENT le backend
 * (le sujet demande ce test). L'écran doit expliquer que le serveur est
 * injoignable et proposer un moyen de réessayer — pas rester bloqué sur
 * le chargement.
 *
 * Prérequis : backend arrêté. Exécuter ensuite relancer-et-verifier (voir
 * verifier-4.mjs) pour le contrôle du réessai.
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('./captures/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const APP = 'http://127.0.0.1:5173';
const API = 'http://127.0.0.1:8080';

let echecs = 0;
const ok = (m) => console.log(`  [OK]    ${m}`);
const ko = (m) => {
  echecs += 1;
  console.log(`  [ÉCHEC] ${m}`);
};

// S'assurer que le backend est bien arrêté avant de commencer.
try {
  const sante = await fetch(`${API}/api/tickets`, { signal: AbortSignal.timeout(4000) });
  ko(`le backend répond encore (${sante.status}) : arrêtez-le avant ce test`);
  process.exit(1);
} catch {
  console.log('\n=== État d’erreur : backend injoignable (arrêté pour de vrai) ===');
  ok('backend effectivement hors service');
}

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  timeout: 180000,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--user-data-dir=/tmp/chrome-verif3-${process.pid}`],
  protocolTimeout: 300000,
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
await page.goto(APP, { waitUntil: 'load', timeout: 60000 });

// L'écran doit sortir de l'état « chargement » et afficher l'erreur.
await page.waitForSelector('.etat-erreur', { timeout: 25000 });
const texte = await page.$eval('.etat-erreur', (e) => e.textContent.replace(/\s+/g, ' ').trim());
texte.includes('injoignable') ? ok(`message d’erreur : ${texte.slice(0, 160)}`) : ko(`message attendu « injoignable », obtenu : ${texte}`);
await page.screenshot({ path: `${OUT}10-ecran-serveur-injoignable.png`, fullPage: true });

const bouton = await page.$('.etat-erreur .bouton-primaire');
bouton ? ok('un bouton « Réessayer » est proposé') : ko('aucun moyen de réessayer');

// Aucun indicateur de chargement ne doit subsister (pas d'écran figé).
const encoreChargement = await page.$('.etat-chargement');
encoreChargement ? ko('l’écran est resté sur le chargement') : ok('l’écran n’est pas figé sur le chargement');

await browser.close();
console.log(`\n=== Bilan vérification 3 : ${echecs === 0 ? 'conforme' : `${echecs} échec(s)`} ===`);
process.exit(echecs === 0 ? 0 : 1);
