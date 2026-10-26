import { useState, useEffect } from 'react';
import { ticketApi } from './services/api.js';
import TicketForm from './components/TicketForm.jsx';
import TicketList from './components/TicketList.jsx';

/**
 * Conteneur principal : gère l'état et les appels API.
 * Découpage : conteneur (App) + TicketList + TicketForm.
 * Gère les quatre états : chargement, données, liste vide, erreur.
 * Aucune donnée codée en dur : tout vient de l'API. Interface en français.
 */
export default function App() {
  const [tickets, setTickets] = useState([]);
  const [statutFiltre, setStatutFiltre] = useState('');
  const [etat, setEtat] = useState('chargement'); // chargement | donnees | vide | erreur
  const [erreurGlobale, setErreurGlobale] = useState(null);
  const [erreurFormulaire, setErreurFormulaire] = useState(null);

  async function chargerTickets() {
    setEtat('chargement');
    setErreurGlobale(null);
    try {
      const liste = await ticketApi.lister(statutFiltre || undefined);
      setTickets(liste);
      setEtat(liste.length === 0 ? 'vide' : 'donnees');
    } catch (err) {
      setErreurGlobale(
        err.status === 0
          ? 'Serveur injoignable : vÃ©rifiez que le backend est dÃ©marrÃ©.'
          : err.message || 'Erreur lors du chargement des tickets.'
      );
      setEtat('erreur');
    }
  }

  useEffect(() => {
    chargerTickets();
  }, [statutFiltre]);

  async function handleTicketCree(nouveauTicket) {
    // AprÃ¨s un succÃ¨s : la liste se rafraÃ®chit sans rechargement de page
    await chargerTickets();
  }

  async function handleFermer(id) {
    await chargerTickets();
  }

  return (
    <div className="app">
      <header>
        <h1>TicketFlow</h1>
        <p className="subtitle">Module Ticket — suivi des demandes utilisateurs</p>
      </header>

      {/* État global d'erreur (serveur injoignable, etc.) */}
      {etat === 'erreur' && (
        <div className="alert alert-error global" role="alert">
          {erreurGlobale}
          <button onClick={chargerTickets} className="btn btn-outline">
            Réessayer
          </button>
        </div>
      )}

      <main className="layout">
        <TicketForm onTicketCree={handleTicketCree} />
        {etat !== 'chargement' && (
          <TicketList
            tickets={tickets}
            statutFiltre={statutFiltre}
            onFermer={handleFermer}
            onStatutChange={(value) => setStatutFiltre(value)}
          />
        )}
      </main>
    </div>
  );
}
