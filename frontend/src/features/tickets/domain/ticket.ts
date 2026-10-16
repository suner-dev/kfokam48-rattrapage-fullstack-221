/**
 * Types du domaine ticket, alignés sur le contrat de l'API.
 * Le frontend ne devine rien : les formes viennent du backend,
 * et les quelques constantes ci-dessous ne sont que des libellés.
 */

export const STATUTS = ['OUVERT', 'EN_COURS', 'FERME'] as const;

export type Statut = (typeof STATUTS)[number];

export interface Ticket {
  id: number;
  titre: string;
  description: string | null;
  statut: Statut;
  /** ISO-8601 fournie par le serveur ; jamais produite par le client. */
  dateCreation: string;
}

/** Ce que le client est autorisé à envoyer à POST /api/tickets. */
export interface NouvelleDemande {
  titre: string;
  description?: string;
}

/** Filtre de liste : undefined = tous. */
export type FiltreStatut = Statut | undefined;

const LIBELLES: Record<Statut, string> = {
  OUVERT: 'Ouvert',
  EN_COURS: 'En cours',
  FERME: 'Fermé',
};

export function libelleStatut(statut: Statut): string {
  return LIBELLES[statut];
}

/**
 * Reflet de RG-03 côté affichage : le bouton de fermeture n'apparaît
 * que si le serveur accepterait la fermeture. La règle reste vérifiée
 * par le serveur, l'écran ne fait que ne pas proposer l'impossible.
 */
export function peutProposerFermeture(statut: Statut): boolean {
  return statut === 'OUVERT' || statut === 'EN_COURS';
}

export function formaterDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
}
