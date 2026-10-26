package com.ticketflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO d'entrÃ©e : le client n'envoie que titre et description.
 * Tout le reste (id, statut, dateCreation) est dÃ©terminÃ© par le serveur.
 */
public class TicketRequestDTO {

    @NotBlank(message = "Le titre est obligatoire.")
    @Size(max = 100, message = "Le titre ne doit pas dÃ©passer 100 caractÃ¨res.")
    private String titre;

    @Size(max = 1000, message = "La description ne doit pas dÃ©passer 1000 caractÃ¨res.")
    private String description;

    public TicketRequestDTO() {
    }

    public TicketRequestDTO(String titre, String description) {
        this.titre = titre;
        this.description = description;
    }

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
