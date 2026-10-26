import {
  formaterDate,
  libelleStatut,
  peutProposerChangementStatut,
  peutProposerFermeture,
  statutCiblePourChangement,
  type Ticket,
} from '../domain/ticket';
import { StatutBadge } from './StatutBadge';

interface Props {
  tickets: Ticket[];
  sensTri: 'recent' | 'ancien';
  enFermeture: number | null;
  enChangementStatut: number | null;
  onTri: () => void;
  onDemandeFermeture: (ticket: Ticket) => void;
  onDemandeChangementStatut: (ticket: Ticket) => void;
}

/**
 * Composant de liste : pur affichage. Il ne connaît ni fetch ni l'état
 * applicatif, il reçoit des tickets et émet des intentions.
 */
export function TicketTableau({ tickets, sensTri, enFermeture, enChangementStatut, onTri, onDemandeFermeture, onDemandeChangementStatut }: Props) {
  return (
    <div className="table-wrapper">
      <table className="table">
        <caption className="visuellement-cache">Liste des tickets de support</caption>
        <thead>
          <tr>
            <th scope="col" className="col-titre">Titre</th>
            <th scope="col" className="col-statut">Statut</th>
            <th scope="col" className="col-date">
              <button type="button" className="bouton-tri" onClick={onTri} title="Tri par date de création">
                Date de création
                <span aria-hidden="true">{sensTri === 'recent' ? '↓' : '↑'}</span>
              </button>
            </th>
            <th scope="col" className="col-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const fermable = peutProposerFermeture(ticket.statut);
            const enCours = enFermeture === ticket.id;
            const changementPossible = peutProposerChangementStatut(ticket.statut);
            const enChangement = enChangementStatut === ticket.id;
            const statutCible = statutCiblePourChangement(ticket.statut);
            return (
              <tr key={ticket.id}>
                <td className="col-titre">
                  <span className="titre-ticket">{ticket.titre}</span>
                  {ticket.description ? (
                    <span className="description-ticket">{ticket.description}</span>
                  ) : null}
                </td>
                <td className="col-statut">
                  <StatutBadge statut={ticket.statut} />
                </td>
                <td className="col-date">{formaterDate(ticket.dateCreation)}</td>
                <td className="col-action">
                  <div className="actions">
                    {fermable ? (
                      <button
                        type="button"
                        className="bouton bouton-fermer"
                        disabled={enCours}
                        onClick={() => onDemandeFermeture(ticket)}
                      >
                        {enCours ? 'Fermeture…' : 'Fermer'}
                      </button>
                    ) : (
                      <span className="aucune-action">—</span>
                    )}
                    {changementPossible ? (
                      <button
                        type="button"
                        className="bouton bouton-statut"
                        disabled={enChangement}
                        onClick={() => onDemandeChangementStatut(ticket)}
                      >
                        {enChangement ? 'Modification…' : `Passer ${libelleStatut(statutCible)}`}
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
