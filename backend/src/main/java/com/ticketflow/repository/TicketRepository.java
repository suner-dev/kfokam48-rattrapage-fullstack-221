package com.ticketflow.repository;

import com.ticketflow.entity.Ticket;
import com.ticketflow.enums.Statut;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

/**
 * Repository des tickets.
 * Fournit la liste filtrÃ©e par statut (endpoint GET /api/tickets).
 */
public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

    Optional<Ticket> findByTitre(String titre);

    @Query("SELECT t FROM Ticket t WHERE (:statut IS NULL OR t.statut = :statut) ORDER BY t.dateCreation DESC")
    List<Ticket> findByStatutOptional(@Param("statut") Statut statut);
}
