package com.ticketflow.tickets.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

/**
 * Entité métier Ticket. Elle ne sort jamais de la couche service :
 * le contrôleur ne manipule que des DTO (voir {@code adapters.rest}).
 */
@Entity
@Table(name = "tickets",
        uniqueConstraints = @UniqueConstraint(name = "uk_tickets_titre", columnNames = "titre"))
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** RG-01 / RG-02 — obligatoire, ≤ 100 caractères, unique (contrainte uk_tickets_titre). */
    @Column(nullable = false, length = 100, unique = true)
    private String titre;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Statut statut;

    /** Générée par le serveur, jamais fournie par le client. */
    @Column(name = "date_creation", nullable = false, updatable = false)
    private Instant dateCreation;

    protected Ticket() {
        // Requise par JPA
    }

    /**
     * Fabrique du domaine : applique les invariants de création.
     * RG-01 — un ticket naît toujours au statut OUVERT, horodaté par le serveur.
     */
    public static Ticket nouveau(String titre, String description) {
        Ticket ticket = new Ticket();
        ticket.titre = titre;
        ticket.description = description;
        ticket.statut = Statut.OUVERT;
        ticket.dateCreation = Instant.now();
        return ticket;
    }

    /**
     * RG-03 — fermeture autorisée seulement si OUVERT ou EN_COURS.
     * La garde est vérifiée par le service avant l'appel ; cette méthode
     * refuse toute transition illimitale même si elle est appelée directement.
     */
    public void fermer() {
        if (!statut.peutEtreFerme()) {
            throw new IllegalStateException(
                    "Un ticket au statut " + statut + " ne peut plus changer d'état (RG-03).");
        }
        this.statut = Statut.FERME;
    }

    public Long getId() {
        return id;
    }

    public String getTitre() {
        return titre;
    }

    public String getDescription() {
        return description;
    }

    public Statut getStatut() {
        return statut;
    }

    public Instant getDateCreation() {
        return dateCreation;
    }
}
