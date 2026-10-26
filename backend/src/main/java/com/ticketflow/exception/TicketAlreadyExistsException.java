package com.ticketflow.exception;

public class TicketAlreadyExistsException extends RuntimeException {

    public TicketAlreadyExistsException(String titre) {
        super("RG-02 : un ticket avec le titre \"" + titre + "\" existe dÃ©jÃ .");
    }
}
