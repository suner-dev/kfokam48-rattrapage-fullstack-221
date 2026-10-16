package com.ticketflow.tickets.domain;

/**
 * Levée lorsqu'une règle de gestion est violée.
 * Le référentiel de la règle figure dans le message (RG-02, RG-03),
 * traduit côté REST en HTTP 409 Conflict.
 */
public class RegleDeGestionVioleeException extends RuntimeException {

    private final String reference;

    public RegleDeGestionVioleeException(String reference, String message) {
        super(message);
        this.reference = reference;
    }

    public String getReference() {
        return reference;
    }
}
