/**
 * Harness de vérification (hors périmètre de l'épreuve, outil de preuve).
 *
 * Il ne se contente pas de prendre des captures : chaque attente est une
 * assertion sur le DOM réel de Chrome. Si l'écran n'affiche pas le message
 * du serveur, le script échoue.
 *
 * Prérequis : PostgreSQL dans Docker, backend sur 8080, frontend sur 5173.
 *   node tools/verification/verifier-1.mjs
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('./captures/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const CHROME = '/usr/bin/google-chrome';
// 127.0.0.1 et non localhost : Vite n'écouté que sur 127.0.0.1, et Chrome
// commence par ::1, ce qui fait expirer la navigation.
const APP = process.env.VERIF_APP_URL ?? 'http://127.0.0.1:5173';
const API_ORIGIN = process.env.VITE_API_URL ?? 'http://127.0.0.1:8080';

let echecs = 0;
const ok = (m) => console.log(`  [OK]    ${m}`);
const ko = (m) => {
  echecs += 1;
  console.log(`  [ÉCHEC] ${m}`);
};
const titre = (m) => console.log(`\n=== ${m} ===`);

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  timeout: 180000,
  // Un profil jetable : Chrome refuse de démarrer sans répertoire dédié
  // quand une session existe déjà.
  args: [
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    `--user-data-dir=/tmp/chrome-verif-${process.pid}`,
  ],
  protocolTimeout: 120000,
});

/** Attend un message serveur visible, et vérifie ce qu'il doit contenir. */
async function attendreMessage(p, selecteur, contenus) {
  await p.waitForSelector(selecteur, { timeout: 15000 });
  const texte = await p.$eval(selecteur, (e) => e.textContent.replace(/\s+/g, ' ').trim());
  const manquants = contenus.filter((c) => !texte.includes(c));
  if (manquants.length === 0) ok(`message affiché : ${texte.slice(0, 150)}`);
  else ko(`message attendu contenant ${manquants.join(' / ')} — obtenu : ${texte.slice(0, 150)}`);
  return texte;
}

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });

titre('1. État nominal : la liste vient de GET /api/tickets');
await page.goto(APP, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('table tbody tr', { timeout: 15000 });
const entetes = await page.$$eval('table thead th', (ts) => ts.map((t) => t.textContent.trim()));
console.log('  Colonnes :', entetes.join(' | '));
['Titre', 'Statut', 'Date de création', 'Action'].forEach((c) =>
  entetes.some((e) => e.includes(c)) ? ok(`colonne ${c}`) : ko(`colonne ${c} absente`),
);
const lignes = await page.$$eval('table tbody tr', (r) => r.length);
ok(`${lignes} ticket(s) affiché(s) depuis l'API`);
await page.screenshot({ path: `${OUT}01-ecran-liste.png`, fullPage: true });

titre('2. Refus 400 : titre de 101 caractères, message venant du serveur');
await page.click('#titre');
await page.type('#titre', 'a'.repeat(101), { delay: 0 });
await page.click('button[type="submit"]');
await attendreMessage(page, '#erreur-formulaire', ['400', '100 caractères', 'RG-01']);
await page.screenshot({ path: `${OUT}02-ecran-400-titre-trop-long.png`, fullPage: true });

titre('3. Refus 409 : titre déjà utilisé (RG-02)');
const titreExistant = await page.$eval('table tbody .titre-ticket', (e) => e.textContent.trim());
await page.evaluate(() => {
  const champ = document.querySelector('#titre');
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(champ, '');
  champ.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.type('#titre', titreExistant, { delay: 0 });
await page.click('button[type="submit"]');
await attendreMessage(page, '#erreur-formulaire', ['409', 'RG-02', titreExistant]);
await page.screenshot({ path: `${OUT}03-ecran-409-titre-doublon.png`, fullPage: true });
console.log(`  Doublon soumis : « ${titreExistant} »`);

titre('4. Création valide : la liste se rafraîchit sans rechargement de page');
const titreNouveau = `Vérification automatique ${Date.now()}`;
await page.evaluate(() => {
  const champ = document.querySelector('#titre');
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(champ, '');
  champ.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.type('#titre', titreNouveau, { delay: 0 });
await page.type('#description', 'Créé par le harness de vérification.', { delay: 0 });
const urlAvant = page.url();
await page.click('button[type="submit"]');
await page.waitForFunction(
  (t) => [...document.querySelectorAll('.titre-ticket')].some((e) => e.textContent.trim() === t),
  { timeout: 15000 },
  titreNouveau,
);
page.url() === urlAvant ? ok('aucun rechargement de page') : ko('la page s’est rechargée');
ok(`« ${titreNouveau} » présent dans la liste`);
await page.screenshot({ path: `${OUT}04-ecran-creation-reussie.png`, fullPage: true });

titre('5. Filtre par statut (trois valeurs + tous)');
const puces = await page.$$eval('.puce', (bs) => bs.map((b) => b.textContent.trim()));
console.log('  Filtres :', puces.join(' / '));
for (const [libelle, attendu] of [
  ['Fermé', 'Fermé'],
  ['Ouvert', 'Ouvert'],
  ['En cours', 'En cours'],
]) {
  await page.evaluate((l) => {
    [...document.querySelectorAll('.puce')].find((b) => b.textContent.trim() === l)?.click();
  }, libelle);
  await new Promise((r) => setTimeout(r, 900));
  const statuts = await page.$$eval('table tbody .badge', (bs) => [...new Set(bs.map((b) => b.textContent.trim()))]);
  const vide = await page.$('.etat-vide');
  if (statuts.length === 1 && statuts[0] === attendu) ok(`filtre « ${libelle} » → que ${statuts[0]}`);
  else if (vide) ok(`filtre « ${libelle} » → état liste vide explicite`);
  else ko(`filtre « ${libelle} » → statuts vus : ${statuts.join(', ') || 'aucun'}`);
  if (libelle === 'Fermé') await page.screenshot({ path: `${OUT}05-ecran-filtre-ferme.png`, fullPage: true });
}
await page.evaluate(() => {
  [...document.querySelectorAll('.puce')].find((b) => b.textContent.trim() === 'Tous')?.click();
});
await new Promise((r) => setTimeout(r, 900));

titre("6. Fermeture : confirmation exigée, puis statut mise à jour");
await page.evaluate(() => {
  const ligne = [...document.querySelectorAll('table tbody tr')].find((tr) =>
    tr.textContent.includes('Vérification automatique'),
  );
  ligne.querySelector('.bouton-fermer').click();
});
await page.waitForSelector('.dialogue', { timeout: 5000 });
ok('boîte de confirmation affichée avant l’appel');
await page.screenshot({ path: `${OUT}06-ecran-confirmation-fermeture.png`, fullPage: true });
await page.click('.bouton-danger');
await page.waitForFunction(
  () => {
    const ligne = [...document.querySelectorAll('table tbody tr')].find((tr) =>
      tr.textContent.includes('Vérification automatique'),
    );
    return ligne && ligne.textContent.includes('Fermé');
  },
  { timeout: 15000 },
);
ok('statut passé à Fermé dans la liste après PATCH');
await page.screenshot({ path: `${OUT}07-ecran-apres-fermeture.png`, fullPage: true });

titre('7. Bouton de fermeture absent sur un ticket déjà FERME (RG-03)');
const actionSurFerme = await page.evaluate(() => {
  const ligne = [...document.querySelectorAll('table tbody tr')].find((tr) =>
    tr.textContent.includes('Vérification automatique'),
  );
  return {
    aBouton: !!ligne?.querySelector('.bouton-fermer'),
    libelle: ligne?.querySelector('.badge')?.textContent.trim(),
  };
});
!actionSurFerme.aBouton && actionSurFerme.libelle === 'Fermé'
  ? ok('aucune action de fermeture proposée sur un ticket fermé')
  : ko(`action encore proposée : ${JSON.stringify(actionSurFerme)}`);

titre('8. Refus 409 sur une fermeture (liste périmée)');
// Scénario déplacé dans verifier-2.mjs : il est pilotable sans ouvrir deux
// onglets (le ticket est fermé côté serveur entre deux instantanés de l'écran),
// donc sans dépendre du chargement de la machine.
console.log('  (contrôlé par verifier-2.mjs — 409 RG-03 lu sur l’écran)');

await browser.close();
console.log(`\n=== Bilan : ${echecs === 0 ? 'tout est conforme' : `${echecs} contrôle(s) en échec`} ===`);
process.exit(echecs === 0 ? 0 : 1);
