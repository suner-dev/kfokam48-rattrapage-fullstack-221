package com.ticketflow.dto;

import com.ticketflow.enums.Statut;
import java.time.LocalDateTime;

/**
 * DTO de sortie : l'entitÃ© Ticket ne sort jamais du service.
 * Seul ce DTO est exposÃ© au client.
 */
public class TicketResponseDTO {

    private Long id;
    private String titre;
    private String description;
    private Statut statut;
    private LocalDateTime dateCreation;

    public TicketResponseDTO() {
    }

    public TicketResponseDTO(Long id, String titre, String description, Statut statut, LocalDateTime dateCreation) {
        this.id = id;
        this.titre = titre;
        this.description = description;
        this.statut = statut;
        this.dateCreation = dateCreation;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Statut getStatut() {
        return statut;
    }

    public void setStatut(Statut statut) {
        this.statut = statut;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }
}
