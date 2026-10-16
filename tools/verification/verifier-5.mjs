/**
 * Vérification 5 — partie A.4 du sujet : créer un ticket DEPUIS SWAGGER, puis
 * le retrouver dans la table PostgreSQL par une requête SQL.
 *
 * La page Swagger est aussi capturée, dépliée sur les trois operations, pour
 * la description de la PR.
 *
 * Identifiants DOM de Swagger UI : `operations-<tag>-<operationId>`, soit ici
 * operations-Tickets-creer / -lister / -fermer (noms des méthodes du contrôleur).
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const OUT = fileURLToPath(new URL('./captures/', import.meta.url));
mkdirSync(OUT, { recursive: true });

const SWAGGER = 'http://127.0.0.1:8080/swagger-ui.html';
// Titre de l'exemple documenté sur le POST (@ExampleObject). La base est
// purgée de ce titre avant l'exécution pour que le test soit rejouable.
const TITRE = 'Clavier du poste 8 hors service';

let echecs = 0;
const ok = (m) => console.log(`  [OK]    ${m}`);
const ko = (m) => {
  echecs += 1;
  console.log(`  [ÉCHEC] ${m}`);
};
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  timeout: 180000,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', `--user-data-dir=/tmp/chrome-swagger-${process.pid}`],
  protocolTimeout: 300000,
});

const page = await browser.newPage();
await page.setViewport({ width: 1500, height: 1100 });

console.log('\n=== Page Swagger : les trois endpoints et leurs codes ===');
await page.goto(SWAGGER, { waitUntil: 'load', timeout: 60000 });
await page.waitForSelector('.opblock', { timeout: 30000 });

const operations = await page.$$eval('.opblock-summary', (els) =>
  els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()),
);
operations.forEach((o) => console.log(`  · ${o}`));
for (const [methode, chemin] of [
  ['post', '/api/tickets'],
  ['get', '/api/tickets'],
  ['patch', '/api/tickets/{id}/fermer'],
]) {
  const trouvee = operations.some((o) => o.toLowerCase().startsWith(methode) && o.includes(chemin));
  trouvee ? ok(`endpoint documenté : ${methode.toUpperCase()} ${chemin}`) : ko(`endpoint absent : ${methode} ${chemin}`);
}

// Déplier les trois operations pour la capture.
for (const id of ['operations-Tickets-creer', 'operations-Tickets-lister', 'operations-Tickets-fermer']) {
  const depliee = await page.$eval(`#${id}`, (e) => e.classList.contains('opblock-open')).catch(() => false);
  if (!depliee) {
    await page.click(`#${id} .opblock-summary`);
    await attendre(500);
  }
}

// Contrôle des codes de retour annoncés dans la documentation.
const codesParOperation = await page.evaluate(() => {
  const lire = (id) =>
    [...document.querySelectorAll(`#${id} .response-col_status`)].map((e) => e.textContent.trim());
  return { creer: lire('operations-Tickets-creer'), lister: lire('operations-Tickets-lister'), fermer: lire('operations-Tickets-fermer') };
});
console.log(`  codes annoncés — POST: ${codesParOperation.creer.join(', ')} | GET: ${codesParOperation.lister.join(', ')} | PATCH: ${codesParOperation.fermer.join(', ')}`);
codesParOperation.creer.some((c) => c.startsWith('201')) ? ok('POST documente 201') : ko('POST sans 201 documenté');
codesParOperation.creer.some((c) => c.startsWith('400')) && codesParOperation.creer.some((c) => c.startsWith('409'))
  ? ok('POST documente 400 et 409')
  : ko('POST sans 400/409 documentés');
codesParOperation.lister.some((c) => c.startsWith('200')) ? ok('GET documente 200') : ko('GET sans 200 documenté');
codesParOperation.fermer.some((c) => c.startsWith('404')) && codesParOperation.fermer.some((c) => c.startsWith('409'))
  ? ok('PATCH documente 404 et 409')
  : ko('PATCH sans 404/409 documentés');

await page.screenshot({ path: `${OUT}02-page-swagger.png`, fullPage: true });
ok('capture Swagger enregistrée (captures/02-page-swagger.png)');

console.log('\n=== Création du ticket depuis Swagger UI (Try it out → Execute) ===');
execFileSync('docker', [
  'exec', 'ticketflow-db', 'psql', '-U', 'ticketflow', '-p', '5434', '-d', 'ticketflow', '-c',
  `DELETE FROM tickets WHERE titre = '${TITRE}';`,
], { stdio: 'pipe' });

await page.waitForSelector('#operations-Tickets-creer .try-out__btn', { timeout: 15000 });
await page.click('#operations-Tickets-creer .try-out__btn');
await attendre(1500);
// On garde le corps d'exemple pré-rempli par la documentation : c'est lui qui
// sert de preuve qu'un ticket peut être créé depuis Swagger sans code client.
// La réponse est lue sur le réseau (la classe du conteneur de réponse change
// selon les versions de Swagger UI) : on vérifie le code réellement reçu.
const reponsePromise = page.waitForResponse(
  (r) => r.url().endsWith('/api/tickets') && r.request().method() === 'POST',
  { timeout: 20000 },
);
await page.click('#operations-Tickets-creer .execute');
const reponseSwagger = await reponsePromise;
const corpsReponse = await reponseSwagger.json();
reponseSwagger.status() === 201
  ? ok(`Swagger a exécuté le POST et reçu 201 Created (id ${corpsReponse.id}, statut ${corpsReponse.statut})`)
  : ko(`réponse Swagger inattendue : ${reponseSwagger.status()}`);
await attendre(1000);
await page.screenshot({ path: `${OUT}12-swagger-execution-201.png`, fullPage: true });

await browser.close();

console.log('\n=== Preuve SQL : le ticket créé via Swagger est dans la table ===');
const requete = `SELECT id, titre, statut, date_creation FROM tickets WHERE titre = '${TITRE}';`;
console.log(`  $ docker exec ticketflow-db psql -U ticketflow -d ticketflow -c "${requete}"`);
const sortie = execFileSync('docker', [
  'exec', 'ticketflow-db', 'psql', '-U', 'ticketflow', '-p', '5434', '-d', 'ticketflow', '-c', requete,
], { encoding: 'utf8' });
console.log(sortie.trim());
sortie.includes(TITRE) ? ok('le ticket créé depuis Swagger est bien en base') : ko('ticket Swagger introuvable en base');

console.log(`\n=== Bilan vérification 5 : ${echecs === 0 ? 'conforme' : `${echecs} échec(s)`} ===`);
process.exit(echecs === 0 ? 0 : 1);
