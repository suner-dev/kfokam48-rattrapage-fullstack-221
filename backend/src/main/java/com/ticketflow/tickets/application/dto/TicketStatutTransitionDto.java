package com.ticketflow.tickets.application.dto;

import com.ticketflow.tickets.domain.Statut;

import jakarta.validation.constraints.NotNull;

/**
 * DTO d'entrée pour la transition de statut d'un ticket.
 * Le client ne choisit que le statut visé ; le serveur applique les règles
 * de gestion (un ticket FERME ne change plus d'état, RG-03).
 */
public record TicketStatutTransitionDto(

        @NotNull(message = "Le statut est obligatoire (valeurs : OUVERT, EN_COURS, FERME).")
        Statut statut

) {
}
