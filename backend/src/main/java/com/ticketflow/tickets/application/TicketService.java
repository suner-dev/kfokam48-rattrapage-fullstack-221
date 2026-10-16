package com.ticketflow.tickets.application;

import com.ticketflow.tickets.application.dto.TicketCreationDto;
import com.ticketflow.tickets.application.dto.TicketDto;
import com.ticketflow.tickets.domain.RegleDeGestionVioleeException;
import com.ticketflow.tickets.domain.Statut;
import com.ticketflow.tickets.domain.Ticket;
import com.ticketflow.tickets.domain.TicketIntrouvableException;
import com.ticketflow.tickets.domain.TicketRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Couche application : toutes les règles de gestion vivent ici.
 * Le contrôleur ne contient aucune logique métier, il se contente de
 * traduire HTTP <-> service.
 */
@Service
public class TicketService {

    private final TicketRepository repository;

    public TicketService(TicketRepository repository) {
        this.repository = repository;
    }

    /**
     * RG-01 — statut OUVERT et date générés par la fabrique du domaine.
     * RG-02 — unicité du titre vérifiée avant insertion ; la contrainte
     * unique de la base sert de filets de sécurité en cas de concurrence
     * (la DataIntegrityViolationException est retraduite en 409).
     */
    @Transactional
    public TicketDto creer(TicketCreationDto dto) {
        String titre = dto.titre().strip();
        if (repository.titreExiste(titre)) {
            throw new RegleDeGestionVioleeException(
                    "RG-02",
                    "Un ticket porte déjà le titre « " + titre + " » : les titres doivent être uniques (RG-02).");
        }
        try {
            Ticket ticket = repository.sauvegarder(Ticket.nouveau(titre, description(dto)));
            return TicketDto.depuis(ticket);
        } catch (DataIntegrityViolationException e) {
            // Course perdue de quelques millisecondes : le même titre vient d'être inséré.
            // La contrainte d'unicité protège l'invariant, et le client reçoit exactement
            // le même message qu'avec la vérification amont.
            throw new RegleDeGestionVioleeException(
                    "RG-02",
                    "Un ticket porte déjà le titre « " + titre + " » : les titres doivent être uniques (RG-02).");
        }
    }

    /** Liste complète, ou filtrée par statut si le filtre est fourni. */
    @Transactional(readOnly = true)
    public List<TicketDto> lister(Statut statut) {
        List<Ticket> tickets = (statut == null) ? repository.tous() : repository.parStatut(statut);
        return tickets.stream().map(TicketDto::depuis).toList();
    }

    /**
     * RG-03 — fermeture autorisée seulement depuis OUVERT ou EN_COURS.
     * 404 si l'identifiant est inconnu, 409 si la règle est violée.
     */
    @Transactional
    public TicketDto fermer(Long id) {
        Ticket ticket = repository.parId(id)
                .orElseThrow(() -> new TicketIntrouvableException(id));
        if (!ticket.getStatut().peutEtreFerme()) {
            throw new RegleDeGestionVioleeException(
                    "RG-03",
                    "Le ticket n°" + id + " est déjà FERME : un ticket fermé ne change plus d'état (RG-03).");
        }
        ticket.fermer();
        return TicketDto.depuis(repository.sauvegarder(ticket));
    }

    /** Description facultative : une valeur vide est normalisée en null. */
    private static String description(TicketCreationDto dto) {
        return (dto.description() == null || dto.description().isBlank())
                ? null
                : dto.description().strip();
    }
}
