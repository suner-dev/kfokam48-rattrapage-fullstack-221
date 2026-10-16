import { libelleStatut, type Statut } from '../domain/ticket';

/** Badge de couleur par statut (plus-value demandée « si vous finissez en avance »). */
export function StatutBadge({ statut }: { statut: Statut }) {
  return (
    <span className={`badge badge-${statut.toLowerCase()}`} title={statut}>
      {libelleStatut(statut)}
    </span>
  );
}
