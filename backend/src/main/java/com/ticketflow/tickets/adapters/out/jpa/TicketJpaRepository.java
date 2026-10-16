package com.ticketflow.tickets.adapters.out.jpa;

import com.ticketflow.tickets.domain.Statut;
import com.ticketflow.tickets.domain.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Port Spring Data JPA vers la base PostgreSQL. Purement technique :
 * il n'est exposé qu'à l'adaptateur {@link JpaTicketRepositoryAdapter}.
 */
public interface TicketJpaRepository extends JpaRepository<Ticket, Long> {

    boolean existsByTitre(String titre);

    List<Ticket> findAllByOrderByDateCreationDescIdDesc();

    List<Ticket> findByStatutOrderByDateCreationDescIdDesc(Statut statut);
}
