package com.ticketflow.shared.error;

import com.ticketflow.tickets.domain.RegleDeGestionVioleeException;
import com.ticketflow.tickets.domain.TicketIntrouvableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.ticketflow.tickets.adapters.in.rest.dto.ErreurReponse;
import com.ticketflow.tickets.adapters.in.rest.dto.ErreurReponse.ErreurChamp;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Traduction centralisée des exceptions en réponses HTTP.
 * Le contrôleur reste exempt de logique ; c'est ici que 400 / 404 / 409
 * sont produits, avec un message qui dit pourquoi et nomme la règle.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** 400 — validation du DTO en entrée (RG-01 notamment). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErreurReponse> gererValidation(MethodArgumentNotValidException e,
                                                         HttpServletRequest requete) {
        List<ErreurChamp> erreurs = e.getBindingResult().getFieldErrors().stream()
                .map(fe -> new ErreurChamp(fe.getField(), fe.getDefaultMessage()))
                .toList();
        String message = erreurs.stream()
                .map(ErreurChamp::message)
                .collect(Collectors.joining(" "));
        return ResponseEntity.badRequest().body(
                ErreurReponse.deValidation(HttpStatus.BAD_REQUEST.value(),
                        HttpStatus.BAD_REQUEST.name(),
                        message.isEmpty() ? "La requête est invalide." : message,
                        requete.getRequestURI(), erreurs));
    }

    /** 400 — corps JSON absent, malformé ou champ inattendu. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErreurReponse> gererCorpsIllisible(HttpMessageNotReadableException e,
                                                             HttpServletRequest requete) {
        return ResponseEntity.badRequest().body(ErreurReponse.de(
                HttpStatus.BAD_REQUEST.value(), HttpStatus.BAD_REQUEST.name(),
                "Le corps de la requête est absent ou mal formé : un JSON « { \"titre\": ..., \"description\": ... } » est attendu.",
                null, requete.getRequestURI()));
    }

    /** 400 — valeur de filtre inconnue (ex. statut=BROUILLON). */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErreurReponse> gererTypeInvalide(MethodArgumentTypeMismatchException e,
                                                           HttpServletRequest requete) {
        String attendu = e.getRequiredType() != null && e.getRequiredType().isEnum()
                ? " Valeurs attendues : " + Arrays.toString(e.getRequiredType().getEnumConstants()) + "."
                : "";
        return ResponseEntity.badRequest().body(ErreurReponse.de(
                HttpStatus.BAD_REQUEST.value(), HttpStatus.BAD_REQUEST.name(),
                "La valeur « " + e.getValue() + " » fournie pour le paramètre « " + e.getName()
                        + " » est invalide." + attendu,
                null, requete.getRequestURI()));
    }

    /** 405 — verbe non pris en charge sur ce chemin. */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErreurReponse> gererVerbeInvalide(HttpRequestMethodNotSupportedException e,
                                                            HttpServletRequest requete) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(ErreurReponse.de(
                HttpStatus.METHOD_NOT_ALLOWED.value(), HttpStatus.METHOD_NOT_ALLOWED.name(),
                "Le verbe « " + e.getMethod() + " » n'est pas pris en charge pour « "
                        + requete.getRequestURI() + " ».",
                null, requete.getRequestURI()));
    }

    /** 404 — identifiant inconnu. */
    @ExceptionHandler(TicketIntrouvableException.class)
    public ResponseEntity<ErreurReponse> gererIntrouvable(TicketIntrouvableException e,
                                                          HttpServletRequest requete) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErreurReponse.de(
                HttpStatus.NOT_FOUND.value(), HttpStatus.NOT_FOUND.name(),
                e.getMessage(), null, requete.getRequestURI()));
    }

    /** 409 — règle de gestion violée (RG-02, RG-03). Le message nomme la règle. */
    @ExceptionHandler(RegleDeGestionVioleeException.class)
    public ResponseEntity<ErreurReponse> gererRegleViolee(RegleDeGestionVioleeException e,
                                                          HttpServletRequest requete) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ErreurReponse.de(
                HttpStatus.CONFLICT.value(), HttpStatus.CONFLICT.name(),
                e.getMessage(), e.getReference(), requete.getRequestURI()));
    }

    /** 405 / 404 « route inconnue » : réponse lisible plutôt que la page blanche du serveur. */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErreurReponse> gererRouteInconnue(NoResourceFoundException e,
                                                            HttpServletRequest requete) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErreurReponse.de(
                HttpStatus.NOT_FOUND.value(), HttpStatus.NOT_FOUND.name(),
                "La ressource « " + requete.getRequestURI() + " » n'existe pas.",
                null, requete.getRequestURI()));
    }

    /** 500 — filet de sécurité : journalisé, sans exposer de pile d'appels au client. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErreurReponse> gererImprevu(Exception e, HttpServletRequest requete) {
        log.error("Erreur inattendue sur {}", requete.getRequestURI(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ErreurReponse.de(
                HttpStatus.INTERNAL_SERVER_ERROR.value(), HttpStatus.INTERNAL_SERVER_ERROR.name(),
                "Le serveur n'a pas pu traiter la demande. Réessayez dans un instant.",
                null, requete.getRequestURI()));
    }
}
