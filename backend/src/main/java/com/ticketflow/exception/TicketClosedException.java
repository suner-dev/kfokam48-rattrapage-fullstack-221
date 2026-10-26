package com.ticketflow.exception;

public class TicketClosedException extends RuntimeException {

    public TicketClosedException(Long id) {
        super("RG-03 : le ticket " + id + " est dÃ©jÃ  FERMÃ‰. Un ticket FERMÃ‰ ne change plus d'Ã©tat.");
    }
}
