import { TicketsEcran } from './features/tickets/ui/TicketsEcran';

/**
 * Composition racine. L'écran unique de l'épreuve est le conteneur
 * TicketsEcran ; App n'ajoute que le pied de page de repère.
 */
export function App() {
  return (
    <>
      <TicketsEcran />
      <footer className="pied">
        TicketFlow — API Spring Boot + PostgreSQL (Docker) · écran React
      </footer>
    </>
  );
}
