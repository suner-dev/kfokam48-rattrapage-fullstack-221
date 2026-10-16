import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErreurApi } from '../../../shared/http/httpClient';
import { ticketApi } from '../api/ticketApi';
import type { FiltreStatut, NouvelleDemande, Ticket } from '../domain/ticket';

/** Les quatre états que l'écran doit pouvoir afficher. */
export type EtatListe = 'chargement' | 'donnees' | 'vide' | 'erreur';

export type SensTri = 'recent' | 'ancien';

export interface EtatTickets {
  liste: Ticket[];
  etat: EtatListe;
  erreur: ErreurApi | null;
  filtre: FiltreStatut;
  sensTri: SensTri;
  compteurOuverts: number;
  totalCharge: number;

  changerFiltre: (filtre: FiltreStatut) => void;
  inverserTri: () => void;
  recharger: () => void;

  creer: (demande: NouvelleDemande) => Promise<boolean>;
  enCreation: boolean;
  erreurCreation: ErreurApi | null;
  effacerErreurCreation: () => void;

  fermer: (id: number) => Promise<ErreurApi | null>;
  idEnFermeture: number | null;
  erreurFermeture: ErreurApi | null;
  effacerErreurFermeture: () => void;
}

/**
 * Conteneur logique de l'écran : orchestration des appels, gestion des
 * quatre états et du rafraîchissement. Les composants d'affichage restent
 * stupides : ils reçoivent cet état et renvoient des intentions.
 */
export function useTickets(): EtatTickets {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [etat, setEtat] = useState<EtatListe>('chargement');
  const [erreur, setErreur] = useState<ErreurApi | null>(null);
  const [filtre, setFiltre] = useState<FiltreStatut>(undefined);
  const [sensTri, setSensTri] = useState<SensTri>('recent');

  const [enCreation, setEnCreation] = useState(false);
  const [erreurCreation, setErreurCreation] = useState<ErreurApi | null>(null);
  const [idEnFermeture, setIdEnFermeture] = useState<number | null>(null);
  const [erreurFermeture, setErreurFermeture] = useState<ErreurApi | null>(null);

  // Numérote les requêtes pour ignorer la réponse d'un appel dépassé.
  const numeroRequete = useRef(0);

  const charger = useCallback(
    async (filtreActif: FiltreStatut) => {
      const numero = ++numeroRequete.current;
      setEtat('chargement');
      setErreur(null);
      try {
        const donnee = await ticketApi.lister(filtreActif);
        if (numero !== numeroRequete.current) return;
        setTickets(donnee);
        setEtat(donnee.length === 0 ? 'vide' : 'donnees');
      } catch (e) {
        if (numero !== numeroRequete.current) return;
        const erreurApi = e instanceof ErreurApi ? e : new ErreurApi(500, "Le serveur n'a pas pu répondre.");
        setErreur(erreurApi);
        setEtat('erreur');
        setTickets([]);
      }
    },
    [],
  );

  useEffect(() => {
    void charger(filtre);
  }, [charger, filtre]);

  const listeTriee = useMemo(() => {
    const copie = [...tickets];
    copie.sort((a, b) => {
      const delta = new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime();
      return sensTri === 'recent' ? -delta : delta;
    });
    return copie;
  }, [tickets, sensTri]);

  const compteurOuverts = useMemo(() => tickets.filter((t) => t.statut === 'OUVERT').length, [tickets]);

  const changerFiltre = useCallback((nouveau: FiltreStatut) => {
    setFiltre(nouveau);
    setErreurFermeture(null);
  }, []);

  const inverserTri = useCallback(() => {
    setSensTri((sens) => (sens === 'recent' ? 'ancien' : 'recent'));
  }, []);

  const creer = useCallback(
    async (demande: NouvelleDemande): Promise<boolean> => {
      setEnCreation(true);
      setErreurCreation(null);
      try {
        await ticketApi.creer(demande);
        // Le sujet exige que la liste se rafraîchisse après un succès :
        // on redemande au serveur, source de vérité (statut et date viennent de lui).
        await charger(filtre);
        return true;
      } catch (e) {
        setErreurCreation(e instanceof ErreurApi ? e : new ErreurApi(500, "Le serveur n'a pas pu créer le ticket."));
        return false;
      } finally {
        setEnCreation(false);
      }
    },
    [charger, filtre],
  );

  const fermer = useCallback(
    async (id: number): Promise<ErreurApi | null> => {
      setIdEnFermeture(id);
      setErreurFermeture(null);
      try {
        const misAJour = await ticketApi.fermer(id);
        setTickets((actuels) => actuels.map((t) => (t.id === id ? misAJour : t)));
        return null;
      } catch (e) {
        const erreurApi =
          e instanceof ErreurApi ? e : new ErreurApi(500, "Le serveur n'a pas pu fermer le ticket.");
        setErreurFermeture(erreurApi);
        // Le refus peut venir d'un état que l'écran ne connaissait pas (ticket
        // fermé entre-temps) : on resynchronise la liste avec le serveur.
        void charger(filtre);
        return erreurApi;
      } finally {
        setIdEnFermeture(null);
      }
    },
    [charger, filtre],
  );

  return {
    liste: listeTriee,
    etat,
    erreur,
    filtre,
    sensTri,
    compteurOuverts,
    totalCharge: tickets.length,

    changerFiltre,
    inverserTri,
    recharger: () => void charger(filtre),

    creer,
    enCreation,
    erreurCreation,
    effacerErreurCreation: () => setErreurCreation(null),

    fermer,
    idEnFermeture,
    erreurFermeture,
    effacerErreurFermeture: () => setErreurFermeture(null),
  };
}
