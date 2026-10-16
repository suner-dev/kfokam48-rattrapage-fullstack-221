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
 * Confirmation avant fermeture. Pas de window.confirm ni d'alert() :
 * une boîte de dialogue accessible, focus géré, fermable à l'échappement.
 */
export function BoiteConfirmation({ ticket, enCours, onConfirmer, onAnnuler }: Props) {
  const boutonReferme = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    boutonReferme.current?.focus();
    function surTouche(evenement: KeyboardEvent) {
      if (evenement.key === 'Escape') onAnnuler();
    }
    document.addEventListener('keydown', surTouche);
    return () => document.removeEventListener('keydown', surTouche);
  }, [onAnnuler]);

  return (
    <div className="voile" role="presentation" onClick={enCours ? undefined : onAnnuler}>
      <div
        className="dialogue"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogue-titre"
        aria-describedby="dialogue-detail"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="dialogue-titre">Fermer ce ticket ?</h3>
        <p id="dialogue-detail">
          <strong>{ticket.titre}</strong> est au statut {libelleStatut(ticket.statut)}.
          Un ticket fermé ne peut plus changer d'état.
        </p>
        <div className="dialogue-actions">
          <button type="button" className="bouton bouton-secondaire" onClick={onAnnuler} disabled={enCours}>
            Annuler
          </button>
          <button ref={boutonReferme} type="button" className="bouton bouton-danger" onClick={onConfirmer} disabled={enCours}>
            {enCours ? 'Fermeture…' : 'Confirmer la fermeture'}
          </button>
        </div>
      </div>
    </div>
  );
}
