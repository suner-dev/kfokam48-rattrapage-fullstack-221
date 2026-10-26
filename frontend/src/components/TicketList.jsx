import { useState } from 'react';
import { ticketApi } from '../services/api.js';

/**
 * Composant de liste des tickets.
 * Affiche les colonnes : titre, statut, date de création, action.
 * Un bouton de fermeture par ligne (seulement si OUVERT ou EN_COURS),
 * avec confirmation avant l'appel.
 * Affiche le message du serveur en cas de 409 (ticket dÃ©jÃ  fermÃ©).
 */
export default function TicketList({ tickets, statutFiltre, onFermer, onStatutChange }) {
  const [confirmation, setConfirmation] = useState(null); // { id, titre } ou null
  const [erreur, setErreur] = useState(null);

  async function handleFermer(id) {
    try {
      setErreur(null);
      await ticketApi.fermer(id);
      setConfirmation(null);
      // Le conteneur (App) rechargera la liste aprÃ¨s la fermeture
      if (onFermer) {
        onFermer(id);
      }
    } catch (err) {
      setErreur(err.message || 'Impossible de fermer le ticket.');
      setConfirmation(null);
    }
  }

  const colonnes = ['Titre', 'Statut', 'Date de crÃ©ation', 'Action'];

  return (
    <section className="card ticket-list">
      <h2>Tickets</h2>
      {erreur && (
        <div className="alert alert-error" role="alert">
          {erreur}
        </div>
      )}
      <div className="filter">
        <label>Filtrer par statut :</label>
        <select
          value={statutFiltre}
          onChange={(e) => onStatutChange(e.target.value)}
        >
          <option value="">Tous</option>
          <option value="OUVERT">OUVERT</option>
          <option value="EN_COURS">EN_COURS</option>
          <option value="FERME">FERME</option>
        </select>
      </div>
      {tickets.length === 0 ? (
        <p className="empty">Aucun ticket.</p>
      ) : (
        <table>
          <thead>
            <tr>
              {colonnes.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.titre}</td>
                <td>
                  <span className={`badge badge-${ticket.statut.toLowerCase()}`}>
                    {ticket.statut}
                  </span>
                </td>
                <td>
                  {ticket.dateCreation
                    ? new Date(ticket.dateCreation).toLocaleString('fr-FR')
                    : '—'}
                </td>
                <td>
                  {ticket.statut === 'OUVERT' || ticket.statut === 'EN_COURS' ? (
                    <>
                      {confirmation?.id === ticket.id ? (
                        <div className="confirm">
                          Fermer « {ticket.titre} » ?
                          <button
                            onClick={() => handleFermer(ticket.id)}
                            className="btn btn-danger btn-small"
                          >
                            Oui
                          </button>
                          <button
                            onClick={() => setConfirmation(null)}
                            className="btn btn-outline btn-small"
                          >
                            Non
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmation({ id: ticket.id, titre: ticket.titre })}
                          className="btn btn-outline btn-small"
                        >
                          Fermer
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="badge badge-ferme">FermÃ©</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
