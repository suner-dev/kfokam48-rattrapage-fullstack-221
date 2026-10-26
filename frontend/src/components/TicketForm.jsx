import { useState } from 'react';
import { ticketApi } from '../services/api.js';

/**
 * Composant de formulaire de crÃ©ation de ticket.
 * - Deux champs : titre (obligatoire) et description (facultative).
 * - Le bouton reste inactif tant que le titre est vide.
 * - Pas de limite de longueur cÃ´tÃ© client : le refus doit venir du serveur.
 * - Affiche les erreurs 400 / 409 du serveur à cÃ´tÃ© du formulaire.
 */
export default function TicketForm({ onTicketCree }) {
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    try {
      const created = await ticketApi.creer({ titre, description });
      setTitre('');
      setDescription('');
      if (onTicketCree) {
        onTicketCree(created);
      }
    } catch (err) {
      // Afficher le message du serveur (400 ou 409) à cÃ´tÃ© du formulaire
      setErreur(err.message || 'Une erreur est survenue lors de la crÃ©ation.');
    } finally {
      setChargement(false);
    }
  }

  return (
    <section className="card ticket-form">
      <h2>CrÃ©er un ticket</h2>
      {erreur && (
        <div className="alert alert-error" role="alert">
          {erreur}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="titre">Titre *</label>
          <input
            id="titre"
            name="titre"
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Saisir le titre du ticket"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="DÃ©crire la demande (facultatif)"
            rows={4}
          />
          <span className="hint">Facultative</span>
        </div>
        <button
          type="submit"
          disabled={chargement || !titre.trim()}
          className="btn btn-primary"
        >
          {chargement ? 'CrÃ©ation en cours...' : 'CrÃ©er le ticket'}
        </button>
        <p className="note">
          Le bouton reste inactif tant que le titre est vide. Le refus
          (titre dÃ©jÃ  utilisÃ© ou trop long) vient du serveur.
        </p>
      </form>
    </section>
  );
}
