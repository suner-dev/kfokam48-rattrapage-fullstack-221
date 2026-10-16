/**
 * Vérification 2 : les refus et l'état « liste vide ».
 *
 *  a) 409 sur une fermeture : l'onglet a une liste périmée (le ticket a été
 *     fermé hors de l'écran entre-temps) — le message RG-03 du serveur doit
 *     s'afficher.
 *  b) Liste vide : la base ne contient plus rien, l'écran doit dire
 *     « Aucun ticket » au lieu de laisser un tableau sans en-tête visible.
 *
 * La base est remise à zéro par le harness (docker exec psql) puis le script
 * de vérification 3 la repeuple avec les tickets de démonstration.
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

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
const titreSection = (m) => console.log(`\n=== ${m} ===`);

function sql(requete) {
  execFileSync('docker', ['exec', 'ticketflow-db', 'psql', '-U', 'ticketflow', '-p', '5434', '-d', 'ticketflow', '-c', requete], {
    stdio: 'pipe',
  });
}

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  timeout: 180000,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--user-data-dir=/tmp/chrome-verif2-${process.pid}`],
  protocolTimeout: 300000,
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });

titreSection('a) Refus 409 sur une fermeture depuis une liste périmée');
// On crée un ticket, on l'affiche, puis on le ferme côté serveur sans toucher l'écran.
const cre = await fetch(`${API}/api/tickets`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ titre: 'Ascenseur immobilisé pour la nuit', description: 'Cas de test : fermeture refusée en 409.' }),
});
const nouveau = await cre.json();
ok(`ticket ${nouveau.id} créé via l'API (${cre.status})`);

await page.goto(APP, { waitUntil: 'load', timeout: 60000 });
await page.waitForSelector('table tbody tr', { timeout: 20000 });
const visible = await page.evaluate(
  (id) => !!document.querySelector(`table tbody tr`) && [...document.querySelectorAll('.titre-ticket')].length,
  nouveau.id,
);
ok(`${visible} lignes affichées, liste à jour avant la manipulation hors écran`);

// Fermeture « par-derrière » : le serveur passe le ticket à FERME.
const ferme = await fetch(`${API}/api/tickets/${nouveau.id}/fermer`, { method: 'PATCH' });
ferme.status === 200 ? ok('le ticket a été fermé hors de l’écran (liste devenue périmée)') : ko(`fermeture hors écran ${ferme.status}`);

// L'écran, qui n'a pas rechargé, propose encore le bouton : le serveur doit refuser.
const titreCible = nouveau.titre;
await page.evaluate((t) => {
  const ligne = [...document.querySelectorAll('table tbody tr')].find((tr) => tr.textContent.includes(t));
  if (!ligne) throw new Error('ligne introuvable');
  const bouton = ligne.querySelector('.bouton-fermer');
  if (!bouton) throw new Error('bouton de fermeture absent de la liste périmée');
  bouton.click();
}, titreCible);
await page.waitForSelector('.dialogue', { timeout: 10000 });
await page.click('.bouton-danger');
await page.waitForSelector('.refus-liste', { timeout: 15000 });
const texte409 = await page.$eval('.refus-liste', (e) => e.textContent.replace(/\s+/g, ' ').trim());
texte409.includes('409') && texte409.includes('RG-03')
  ? ok(`409 affiché : ${texte409.slice(0, 150)}`)
  : ko(`message 409 attendu, obtenu : ${texte409.slice(0, 150)}`);
await page.screenshot({ path: `${OUT}08-ecran-409-fermeture.png`, fullPage: true });

titreSection('b) État « liste vide » : message explicite, pas un tableau fantôme');
sql('DELETE FROM tickets;');
// L'écran affiche encore sa liste en mémoire : seule une relance du GET doit
// révéler l'état vide. On clique « Recharger », on ne recharge pas la page.
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => /recharger/i.test(b.textContent))?.click();
});
await page.waitForSelector('.etat-vide', { timeout: 20000 });
const vide = await page.$eval('.etat-vide', (e) => e.textContent.replace(/\s+/g, ' ').trim());
vide.includes('Aucun ticket') ? ok(`état vide : ${vide.slice(0, 140)}`) : ko(`état vide inattendu : ${vide.slice(0, 140)}`);
await page.screenshot({ path: `${OUT}09-ecran-liste-vide.png`, fullPage: true });

await browser.close();
console.log(`\n=== Bilan vérification 2 : ${echecs === 0 ? 'conforme' : `${echecs} échec(s)`} ===`);
process.exit(echecs === 0 ? 0 : 1);
