/**
 * Client HTTP partagé. Seul endroit (avec ticketApi) où l'on touche fetch.
 * Il convertit une réponse HTTP en erreur typée Exploitable par l'interface,
 * et une absence de réponse (backend arrêté) en message clair.
 */

export interface CorpsErreurApi {
  horodatage?: string;
  code?: number;
  statut?: string;
  message?: string;
  regle?: string | null;
  chemin?: string;
  erreurs?: { champ: string; message: string }[];
}

/** Erreur métier ou réseau, toujours affichable telle quelle. */
export class ErreurApi extends Error {
  readonly code: number;
  readonly regle: string | null;
  readonly champs: string[];

  constructor(code: number, message: string, regle: string | null = null, champs: string[] = []) {
    super(message);
    this.name = 'ErreurApi';
    this.code = code;
    this.regle = regle;
    this.champs = champs;
  }

  /** Le serveur est injoignable : pas de réponse du tout (backend arrêté, DNS, réseau). */
  get estInjoignable(): boolean {
    return this.code === 0;
  }
}

interface Resultat<T> {
  donnee: T;
  statut: number;
}

async function demander<T>(url: string, init: RequestInit): Promise<Resultat<T>> {
  let reponse: Response;
  try {
    reponse = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  } catch {
    throw new ErreurApi(
      0,
      'Le serveur est injoignable. Vérifiez que le backend est démarré sur le port configuré, puis réessayez.',
    );
  }

  const texte = await reponse.text();
  const corps = texte ? safeJson<CorpsErreurApi & T>(texte) : undefined;

  if (!reponse.ok) {
    const message =
      corps?.message?.trim() ||
      `Le serveur a refusé la demande (code HTTP ${reponse.status}).`;
    throw new ErreurApi(
      reponse.status,
      message,
      corps?.regle ?? null,
      (corps?.erreurs ?? []).map((e) => e.message),
    );
  }

  return { donnee: (corps as T) ?? (undefined as T), statut: reponse.status };
}

function safeJson<T>(texte: string): T | undefined {
  try {
    return JSON.parse(texte) as T;
  } catch {
    return undefined;
  }
}

export const http = {
  get: <T>(url: string) => demander<T>(url, { method: 'GET' }),
  post: <T>(url: string, corps: unknown) => demander<T>(url, { method: 'POST', body: JSON.stringify(corps) }),
  patch: <T>(url: string, corps?: unknown) =>
    demander<T>(url, { method: 'PATCH', body: corps === undefined ? undefined : JSON.stringify(corps) }),
};
