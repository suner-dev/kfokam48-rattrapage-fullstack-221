/**
 * Service dÃ©diÃ© aux appels API.
 * Aucun fetch/axios n'est appelÃ© directement depuis un composant :
 * tous les composants passent par ce service.
 */
const API_BASE = '/api';

async function handleResponse(response) {
  if (response.ok) {
    return await response.json();
  }
  // Lire le corps JSON d'erreur si prÃ©sent
  let errorMessage = 'Erreur serveur.';
  try {
    const body = await response.json();
    if (body && body.message) {
      errorMessage = body.message;
    }
  } catch (_) {
    // Le corps n'est pas du JSON, on garde le message par dÃ©faut.
  }
  const err = new Error(errorMessage);
  err.status = response.status;
  throw err;
}

export const ticketApi = {
  // CrÃ©er un ticket (POST)
  async creer(ticket) {
    const response = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticket),
    });
    return handleResponse(response);
  },

  // Lister les tickets, optionnellement filtrÃ©s par statut (GET)
  async lister(statut) {
    const url = statut
      ? `${API_BASE}/tickets?statut=${encodeURIComponent(statut)}`
      : `${API_BASE}/tickets`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  // Fermer un ticket (PATCH)
  async fermer(id) {
    const response = await fetch(`${API_BASE}/tickets/${id}/fermer`, {
      method: 'PATCH',
    });
    return handleResponse(response);
  },
};
