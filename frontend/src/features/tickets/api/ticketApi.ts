import { http } from '../../../shared/http/httpClient';
import { API_URL } from '../../../config/env';
import type { FiltreStatut, NouvelleDemande, Statut, Ticket } from '../domain/ticket';

/**
 * Service dédié aux appels API « tickets ».
 * C'est le seul module du frontend qui connaît les chemins de l'API ;
 * aucun composant n'appelle fetch directement.
 */
export const ticketApi = {
  /** GET /api/tickets[?statut=...] */
  async lister(filtre: FiltreStatut): Promise<Ticket[]> {
    const parametres = filtre ? `?statut=${encodeURIComponent(filtre)}` : '';
    const { donnee } = await http.get<Ticket[]>(`${API_URL}/api/tickets${parametres}`);
    return donnee ?? [];
  },

  /** POST /api/tickets — le client n'envoie que titre et description. */
  async creer(demande: NouvelleDemande): Promise<Ticket> {
    const { donnee } = await http.post<Ticket>(`${API_URL}/api/tickets`, {
      titre: demande.titre,
      description: demande.description?.trim() === '' ? null : (demande.description ?? null),
    });
    return donnee;
  },

  /** PATCH /api/tickets/{id}/fermer */
  async fermer(id: number): Promise<Ticket> {
    const { donnee } = await http.patch<Ticket>(`${API_URL}/api/tickets/${id}/fermer`);
    return donnee;
  },

  /** PATCH /api/tickets/{id}/statut — transition OUVERT ↔ EN_COURS (ou vers FERME). */
  async changerStatut(id: number, statut: Statut): Promise<Ticket> {
    const { donnee } = await http.patch<Ticket>(`${API_URL}/api/tickets/${id}/statut`, {
      statut,
    });
    return donnee;
  },
};
