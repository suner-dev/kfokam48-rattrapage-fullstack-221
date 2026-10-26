import { useState } from 'react';
import { EtatChargement, EtatErreur, EtatVide } from '../../../shared/ui/Etats';
import { useTickets } from '../application/useTickets';
import type { Ticket } from '../domain/ticket';
import { BoiteChangementStatut } from './BoiteChangementStatut';
import { BoiteConfirmation } from './BoiteConfirmation';
import { FiltreStatutBarre } from './FiltreStatutBarre';
import { TicketFormulaire } from './TicketFormulaire';
import { TicketTableau } from './TicketTableau';

/**
 * Conteneur de l'écran : il tient l'état, déclenche les appels via le
 * service ticketApi (à travers useTickets) et les distribue aux composants
 * d'affichage. Aucun fetch ici.
 */
export function TicketsEcran() {
  const usage = useTickets();
  const [ticketAAfermer, setTicketAAfermer] = useState<Ticket | null>(null);
  const [ticketAChangerStatut, setTicketAChangerStatut] = useState<Ticket | null>(null);

  async function confirmerFermeture() {
    if (!ticketAAfermer) return;
    // Le refus éventuel (409 RG-03) est porté par usage.erreurFermeture :
    // la boîte se referme et le message du serveur s'affiche sous la liste.
    await usage.fermer(ticketAAfermer.id);
    setTicketAAfermer(null);
  }

  async function confirmerChangementStatut() {
    if (!ticketAChangerStatut) return;
    const statutCible =
      ticketAChangerStatut.statut === 'OUVERT' ? 'EN_COURS' : 'OUVERT';
    // Le refus éventuel (409 RG-03) est porté par usage.erreurChangementStatut :
    // la boîte se referme et le message du serveur s'affiche sous la liste.
    await usage.changerStatut(ticketAChangerStatut.id, statutCible);
    setTicketAChangerStatut(null);
  }

  function rendreListe() {
    switch (usage.etat) {
      case 'chargement':
        return <EtatChargement label="Chargement des tickets…" />;
      case 'erreur':
        return <EtatErreur message={usage.erreur?.message ?? 'Erreur inconnue.'} onReessayer={usage.recharger} />;
      case 'vide':
        return (
          <EtatVide
            titre="Aucun ticket"
            detail={
              usage.filtre
                ? 'Aucun ticket au statut demandé. Changez de filtre pour voir les autres demandes.'
                : 'Créez une première demande avec le formulaire ci-dessus.'
            }
          />
        );
      case 'donnees':
        return (
          <TicketTableau
            tickets={usage.liste}
            sensTri={usage.sensTri}
            enFermeture={usage.idEnFermeture}
            enChangementStatut={usage.idEnChangementStatut}
            onTri={usage.inverserTri}
            onDemandeFermeture={setTicketAAfermer}
            onDemandeChangementStatut={setTicketAChangerStatut}
          />
        );
    }
  }

  return (
    <main className="page">
      <header className="page-entete">
        <div>
          <h1>Support — demandes des utilisateurs</h1>
          <p className="page-lede">
            Suivi des tickets : création, consultation et fermeture. Les règles de gestion
            sont appliquées par le serveur, l'écran n'affiche que ce qu'il renvoie.
          </p>
        </div>
        <div className="indicateurs">
          <div className="indicateur">
            <span className="indicateur-valeur">{usage.compteurOuverts}</span>
            <span className="indicateur-legende">ouverts</span>
          </div>
          <div className="indicateur">
            <span className="indicateur-valeur">{usage.totalCharge}</span>
            <span className="indicateur-legende">au total</span>
          </div>
        </div>
      </header>

      <div className="grille">
        <TicketFormulaire
          enCours={usage.enCreation}
          erreur={usage.erreurCreation}
          onSoumettre={usage.creer}
          onEffacerErreur={usage.effacerErreurCreation}
        />

        <section className="carte carte-liste" aria-labelledby="titre-liste">
          <header className="carte-entete carte-entete-range">
            <div>
              <h2 id="titre-liste">Tickets</h2>
              <p className="carte-sous-titre">La liste vient de GET /api/tickets, filtre appliqué par le serveur.</p>
            </div>
            <button type="button" className="bouton bouton-secondaire" onClick={usage.recharger}>
              Recharger
            </button>
          </header>

          <FiltreStatutBarre valeur={usage.filtre} onChange={usage.changerFiltre} />

          {usage.erreurFermeture ? (
            <p className="refus refus-liste" role="alert">
              <span className="refus-code">
                {usage.erreurFermeture.code}
                {usage.erreurFermeture.regle ? ` · ${usage.erreurFermeture.regle}` : ''}
              </span>
              {usage.erreurFermeture.message}
              <button type="button" className="bouton-fermer-banniere" onClick={usage.effacerErreurFermeture} aria-label="Masquer le message">
                ×
              </button>
            </p>
          ) : null}
          {usage.erreurChangementStatut ? (
            <p className="refus refus-liste" role="alert">
              <span className="refus-code">
                {usage.erreurChangementStatut.code}
                {usage.erreurChangementStatut.regle ? ` · ${usage.erreurChangementStatut.regle}` : ''}
              </span>
              {usage.erreurChangementStatut.message}
              <button type="button" className="bouton-fermer-banniere" onClick={usage.effacerErreurChangementStatut} aria-label="Masquer le message">
                ×
              </button>
            </p>
          ) : null}

          <div className="zone-liste" aria-busy={usage.etat === 'chargement'}>
            {rendreListe()}
          </div>
        </section>
      </div>

      {ticketAAfermer ? (
        <BoiteConfirmation
          ticket={ticketAAfermer}
          enCours={usage.idEnFermeture === ticketAAfermer.id}
          onConfirmer={confirmerFermeture}
          onAnnuler={() => setTicketAAfermer(null)}
        />
      ) : null}
      {ticketAChangerStatut ? (
        <BoiteChangementStatut
          ticket={ticketAChangerStatut}
          enCours={usage.idEnChangementStatut === ticketAChangerStatut.id}
          onConfirmer={confirmerChangementStatut}
          onAnnuler={() => setTicketAChangerStatut(null)}
        />
      ) : null}
    </main>
  );
}
