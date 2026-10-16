package com.ticketflow.tickets.application.dto;

import com.ticketflow.tickets.domain.Statut;
import com.ticketflow.tickets.domain.Ticket;

import java.time.Instant;

/**
 * DTO de sortie. C'est la seule représentation du ticket visible
 * de l'extérieur du module : l'entité JPA ne sort jamais du service.
 */
public record TicketDto(
        Long id,
        String titre,
        String description,
        Statut statut,
        Instant dateCreation
) {

    public static TicketDto depuis(Ticket ticket) {
        return new TicketDto(
                ticket.getId(),
                ticket.getTitre(),
                ticket.getDescription(),
                ticket.getStatut(),
                ticket.getDateCreation()
        );
    }
}
