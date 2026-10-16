package com.ticketflow.shared.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Personnalisation de la documentation OpenAPI : titre, version et
 * rappel des règles de gestion, pour que Swagger soit lisible tel quel.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI ticketFlowOpenApi() {
        return new OpenAPI().info(new Info()
                .title("TicketFlow API — service de support")
                .version("1.0.0")
                .description("""
                        Suivi des demandes des utilisateurs : création, listing filtrable
                        et fermeture de tickets.

                        Règles de gestion appliquées par le serveur :
                        - **RG-01** — le titre est obligatoire et ne dépasse pas 100 caractères ;
                          un ticket est créé avec le statut OUVERT.
                        - **RG-02** — deux tickets ne peuvent pas avoir le même titre (refus 409).
                        - **RG-03** — un ticket ne peut être fermé que s'il est OUVERT ou EN_COURS ;
                          un ticket FERME ne change plus d'état (refus 409).

                        Le client n'envoie que `titre` et `description` : `id`, `statut` et
                        `dateCreation` sont déterminés par le serveur.
                        """)
                .contact(new Contact().name("Ngansop Sumo Rainer — KFOKAM48 Batch 2 Phase 3"))
                .license(new License().name("Projet d'évaluation")));
    }
}
