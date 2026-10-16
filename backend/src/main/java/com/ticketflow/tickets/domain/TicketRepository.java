package com.ticketflow.tickets.domain;

import java.util.List;
import java.util.Optional;

/**
 * Port de persistance des tickets (clean architecture : le domaine définit
 * le port, la couche adapters/out l'implémente via Spring Data JPA).
 */
public interface TicketRepository {

    Ticket sauvegarder(Ticket ticket);

    Optional<Ticket> parId(Long id);

    boolean titreExiste(String titre);

    List<Ticket> tous();

    List<Ticket> parStatut(Statut statut);
}
