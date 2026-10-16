import type { ReactNode } from 'react';

/**
 * Briques des quatre états d'un écran de liste.
 * Un écran qui n'affiche que le cas nominal est incomplet : chaque état
 * a sa propre rendu, avec un message explicite pour l'utilisateur.
 */

export function EtatChargement({ label }: { label: string }): ReactNode {
  return (
    <div className="etat etat-chargement" role="status" aria-live="polite">
      <span className="rouleau" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}

export function EtatVide({ titre, detail }: { titre: string; detail: string }): ReactNode {
  return (
    <div className="etat etat-vide" role="status">
      <svg viewBox="0 0 64 64" className="dessin" aria-hidden="true">
        <rect x="8" y="14" width="48" height="36" rx="6" />
        <path d="M8 26h48" />
        <path d="M20 38h24" />
      </svg>
      <p className="titre">{titre}</p>
      <p className="detail">{detail}</p>
    </div>
  );
}

export function EtatErreur({
  message,
  onReessayer,
}: {
  message: string;
  onReessayer: () => void;
}): ReactNode {
  return (
    <div className="etat etat-erreur" role="alert">
      <p className="titre">Le chargement a échoué</p>
      <p className="detail">{message}</p>
      <button type="button" className="bouton bouton-primaire" onClick={onReessayer}>
        Réessayer
      </button>
    </div>
  );
}
