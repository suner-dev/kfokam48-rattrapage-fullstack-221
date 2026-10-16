/**
 * Vérification 4 : re-remplissage de la base de démonstration (le sujet exige
 * « base contenant au moins un ticket déjà créé »), puis contrôle du bouton
 * « Réessayer » : l'écran doit se rétablir sans rechargement de page.
 *
 * Prérequis : backend redémarré (scripts/start-backend.sh).
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

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiDisponible() {
  try {
    const r = await fetch(`${API}/api/tickets`, { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch {
    return false;
  }
}

console.log('\n=== Attente du retour du backend ===');
let tries = 0;
while (!(await apiDisponible()) && tries < 60) {
  await attendre(2000);
  tries += 1;
}
if (!(await apiDisponible())) {
  ko('le backend ne revient pas : vérifiez scripts/start-backend.sh');
  process.exit(1);
}
ok(`backend de nouveau disponible (après ${tries * 2}s d’attente)`);

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  timeout: 180000,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--user-data-dir=/tmp/chrome-verif4-${process.pid}`],
  protocolTimeout: 300000,
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });

console.log('\n=== Re-remplissage de la base de démonstration ===');
const demo = [
  { titre: 'Imprimante du 3e étage bloquée', description: 'Le bac papier se coince depuis hier.', statut: 'OUVERT' },
  { titre: 'Badge d’accès non reconnu', description: 'Le lecteur bip trois fois puis refuse.', statut: 'OUVERT' },
  { titre: 'Lenteur du VPN sur les postes mobiles', description: 'Tunnel instable en visio.', statut: 'EN_COURS' },
  { titre: 'Écran du poste 12 fissuré', description: 'Demande d’écran de remplacement.', statut: 'FERME' },
];

for (const d of demo) {
  const reponse = await fetch(`${API}/api/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titre: d.titre, description: d.description }),
  });
  if (!reponse.ok) {
    ko(`création de « ${d.titre} » : ${reponse.status}`);
    continue;
  }
  const corps = await reponse.json();
  if (d.statut === 'FERME') {
    await fetch(`${API}/api/tickets/${corps.id}/fermer`, { method: 'PATCH' });
  } else if (d.statut === 'EN_COURS') {
    // EN_COURS ne s'obtient que par la base : le sujet ne fournit aucun endpoint
    // de mise en cours, seulement une fermeture.
    execFileSync('docker', [
      'exec', 'ticketflow-db', 'psql', '-U', 'ticketflow', '-p', '5434', '-d', 'ticketflow', '-c',
      `UPDATE tickets SET statut = 'EN_COURS' WHERE id = ${corps.id};`,
    ], { stdio: 'pipe' });
  }
  ok(`« ${d.titre} » → ${d.statut}`);
}

console.log('\n=== Réessai : la panne réseau est simulée, le bouton doit la rattraper ===');
// On bloque volontairement le premier GET pour retrouver l'écran d'erreur, puis
// on le débloque et on clique « Réessayer » SANS recharger la page. (La panne
// réelle, backend arrêté, est contrôlée par verifier-3.mjs.)
let enPanne = true;
await page.setRequestInterception(true);
page.on('request', (requete) => {
  if (requete.url().includes('/api/tickets') && enPanne) {
    requete.abort('failed');
    return;
  }
  requete.continue();
});

await page.goto(APP, { waitUntil: 'load', timeout: 60000 });
await page.waitForSelector('.etat-erreur', { timeout: 25000 });
enPanne = false;
ok('écran d’erreur obtenu sur demande bloquée, réessai disponible');

await page.click('.etat-erreur .bouton-primaire');
ok('« Réessayer » actionné');

await page.waitForSelector('table tbody tr', { timeout: 25000 });
const lignes = await page.$$eval('table tbody tr', (trs) => trs.length);
lignes >= demo.length
  ? ok(`liste revenue après réessai, sans rechargement de page (${lignes} lignes)`)
  : ko(`liste incomplète après réessai : ${lignes} lignes`);
await page.screenshot({ path: `${OUT}11-ecran-reessai-reussi.png`, fullPage: true });
await browser.close();

console.log(`\n=== Bilan vérification 4 : ${echecs === 0 ? 'conforme' : `${echecs} échec(s)`} ===`);
process.exit(echecs === 0 ? 0 : 1);
