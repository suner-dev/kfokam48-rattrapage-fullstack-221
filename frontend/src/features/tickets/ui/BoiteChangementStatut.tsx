import { useEffect, useRef } from 'react';
import type { Ticket } from '../domain/ticket';
import { libelleStatut } from '../domain/ticket';

interface Props {
  ticket: Ticket;
  enCours: boolean;
  onConfirmer: () => void;
  onAnnuler: () => void;
}

/**
 * Confirmation avant changement de statut. Pas de window.confirm ni d'alert() :
 * une boîte de dialogue accessible, focus géré, fermable à l'échappement.
 */
export function BoiteChangementStatut({ ticket, enCours, onConfirmer, onAnnuler }: Props) {
  const boutonReferme = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    boutonReferme.current?.focus();
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.key === 'Escape') onAnnuler();
    }
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [onAnnuler]);

  const statutCible = ticket.statut === 'OUVERT' ? 'EN_COURS' : 'OUVERT';

  return (
    <div className="voile" role="presentation" onClick={enCours ? undefined : onAnnuler}>
      <div
        className="dialogue"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogue-statut-titre"
        aria-describedby="dialogue-statut-detail"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="dialogue-statut-titre">Changer le statut de ce ticket ?</h3>
        <p id="dialogue-statut-detail">
          <strong>{ticket.titre}</strong> est au statut{' '}
          <strong>{libelleStatut(ticket.statut)}</strong>. Passer en{' '}
          <strong>{libelleStatut(statutCible)}</strong> ?
        </p>
        <div className="dialogue-actions">
          <button type="button" className="bouton bouton-secondaire" onClick={onAnnuler} disabled={enCours}>
            Annuler
          </button>
          <button
            ref={boutonReferme}
            type="button"
            className="bouton bouton-statut"
            onClick={onConfirmer}
            disabled={enCours}
          >
            {enCours ? 'Modification…' : 'Confirmer le changement'}
          </button>
        </div>
      </div>
    </div>
  );
}
