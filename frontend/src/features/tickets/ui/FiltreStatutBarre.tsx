import type { FiltreStatut } from '../domain/ticket';
import { STATUTS, libelleStatut } from '../domain/ticket';

interface Props {
  valeur: FiltreStatut;
  onChange: (filtre: FiltreStatut) => void;
}

/**
 * Filtre par statut. Les valeurs viennent du contrat d'interface (STATUTS),
 * la requête réelle est traitée par le serveur : le frontend ne trie pas
 * une collection qu'il n'a pas demandée en entier.
 */
export function FiltreStatutBarre({ valeur, onChange }: Props) {
  return (
    <div className="filtres" role="group" aria-label="Filtrer les tickets par statut">
      <button
        type="button"
        className={`puce ${valeur === undefined ? 'puce-active' : ''}`}
        aria-pressed={valeur === undefined}
        onClick={() => onChange(undefined)}
      >
        Tous
      </button>
      {STATUTS.map((statut) => (
        <button
          key={statut}
          type="button"
          className={`puce puce-${statut.toLowerCase()} ${valeur === statut ? 'puce-active' : ''}`}
          aria-pressed={valeur === statut}
          onClick={() => onChange(statut)}
        >
          {libelleStatut(statut)}
        </button>
      ))}
    </div>
  );
}
