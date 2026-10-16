package com.ticketflow.tickets.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO d'entrée pour la création d'un ticket.
 * Le client n'envoie QUE titre et description : le statut, la date de
 * création et l'identifiant sont déterminés par le serveur.
 */
public record TicketCreationDto(

        @NotBlank(message = "Le titre est obligatoire (RG-01).")
        @Size(max = 100, message = "Le titre ne peut pas dépasser 100 caractères (RG-01).")
        String titre,

        @Size(max = 2000, message = "La description ne peut pas dépasser 2000 caractères.")
        String description
) {
}
