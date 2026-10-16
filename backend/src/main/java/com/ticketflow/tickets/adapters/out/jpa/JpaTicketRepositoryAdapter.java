package com.ticketflow.tickets.adapters.out.jpa;

import com.ticketflow.tickets.domain.Statut;
import com.ticketflow.tickets.domain.Ticket;
import com.ticketflow.tickets.domain.TicketRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Adaptateur de sortie : implémente le port du domaine en déléguant
 * à Spring Data JPA. Le reste de l'application ignore PostgreSQL et JPA.
 */
@Repository
public class JpaTicketRepositoryAdapter implements TicketRepository {

    private final TicketJpaRepository jpa;

    public JpaTicketRepositoryAdapter(TicketJpaRepository jpa) {
        this.jpa = jpa;
    }

    @Override
    public Ticket sauvegarder(Ticket ticket) {
        return jpa.save(ticket);
    }

    @Override
    public Optional<Ticket> parId(Long id) {
        return jpa.findById(id);
    }

    @Override
    public boolean titreExiste(String titre) {
        return jpa.existsByTitre(titre);
    }

    @Override
    public List<Ticket> tous() {
        return jpa.findAllByOrderByDateCreationDescIdDesc();
    }

    @Override
    public List<Ticket> parStatut(Statut statut) {
        return jpa.findByStatutOrderByDateCreationDescIdDesc(statut);
    }
}
