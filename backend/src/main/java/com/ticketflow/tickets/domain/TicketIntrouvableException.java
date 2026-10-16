package com.ticketflow.tickets.domain;

/**
 * Levée quand un identifiant ne correspond à aucun ticket.
 * Traduit côté REST en HTTP 404 Not Found.
 */
public class TicketIntrouvableException extends RuntimeException {

    public TicketIntrouvableException(Long id) {
        super("Aucun ticket ne correspond à l'identifiant " + id + ".");
    }
}
