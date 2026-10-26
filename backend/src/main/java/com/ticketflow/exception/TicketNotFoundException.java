package com.ticketflow.exception;

public class TicketNotFoundException extends RuntimeException {

    public TicketNotFoundException(Long id) {
        super("Ticket introuvable : identifiant " + id + " inconnu.");
    }
}
