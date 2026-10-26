package com.ticketflow.handler;

import com.ticketflow.exception.TicketAlreadyExistsException;
import com.ticketflow.exception.TicketClosedException;
import com.ticketflow.exception.TicketNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.HashMap;
import java.util.Map;

/**
 * Gestionnaire global d'exceptions.
 * Transforme les mÃ©tiers exceptions en rÃ©ponses HTTP explicites (404, 409).
 * Aucun message gÃ©nÃ©rique de type "erreur serveur".
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(TicketNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(TicketNotFoundException ex) {
        Map<String, String> body = new HashMap<>();
        body.put("code", "404");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(TicketAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleAlreadyExists(TicketAlreadyExistsException ex) {
        Map<String, String> body = new HashMap<>();
        body.put("code", "409");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(TicketClosedException.class)
    public ResponseEntity<Map<String, String>> handleClosed(TicketClosedException ex) {
        Map<String, String> body = new HashMap<>();
        body.put("code", "409");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }
}
