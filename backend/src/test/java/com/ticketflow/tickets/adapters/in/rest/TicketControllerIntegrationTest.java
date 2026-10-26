package com.ticketflow.tickets.adapters.in.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ticketflow.tickets.adapters.out.jpa.TicketJpaRepository;
import com.ticketflow.tickets.application.dto.TicketCreationDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Bout en bout sur la couche HTTP : codes de retour attendus (201, 200,
 * 400, 404, 409) et messages qui nomment la règle violée.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Contrat HTTP de /api/tickets")
class TicketControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper json;

    @Autowired
    private TicketJpaRepository tickets;

    private String corps(String titre, String description) throws Exception {
        return json.writeValueAsString(new TicketCreationDto(titre, description));
    }

    /** Chaque test part d'une base vide : les compteurs de la liste sont deterministes. */
    @BeforeEach
    void viderLaBase() {
        tickets.deleteAll();
    }

    @Test
    @DisplayName("POST /api/tickets renvoie 201 avec statut OUVERT et date générée")
    void creerTicket() throws Exception {
        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corps("Imprimante du 3e bloquée", "Le bac papier se coince")))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", containsString("/api/tickets/")))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.statut").value("OUVERT"))
                .andExpect(jsonPath("$.dateCreation").isNotEmpty())
                .andExpect(jsonPath("$.titre").value("Imprimante du 3e bloquée"));
    }

    @Test
    @DisplayName("RG-01 — titre absent : 400 avec le motif de refus")
    void refuserTitreAbsent() throws Exception {
        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("description", "sans titre"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400))
                .andExpect(jsonPath("$.message", containsString("titre est obligatoire")))
                .andExpect(jsonPath("$.erreurs[0].champ").value("titre"));
    }

    @Test
    @DisplayName("RG-01 — titre de 101 caractères : 400 avec le motif de refus")
    void refuserTitreTropLong() throws Exception {
        String titre = "a".repeat(101);
        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corps(titre, null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("100 caractères")));
    }

    @Test
    @DisplayName("RG-02 — titre déjà utilisé : 409 nommant la règle")
    void refuserTitreDoublon() throws Exception {
        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corps("Écran noir au démarrage", null)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corps("Écran noir au démarrage", "encore")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.regle").value("RG-02"))
                .andExpect(jsonPath("$.message", containsString("RG-02")));
    }

    @Test
    @DisplayName("GET /api/tickets liste, et le filtre statut restreint le résultat")
    void listerEtFiltrer() throws Exception {
        mockMvc.perform(post("/api/tickets").contentType(MediaType.APPLICATION_JSON)
                        .content(corps("Clavier sans réponse", null)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/tickets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].statut").value("OUVERT"));

        mockMvc.perform(get("/api/tickets").param("statut", "OUVERT"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)));

        mockMvc.perform(get("/api/tickets").param("statut", "FERME"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("Filtre inconnu : 400 qui énumère les valeurs attendues")
    void refuserFiltreInconnu() throws Exception {
        mockMvc.perform(get("/api/tickets").param("statut", "BROUILLON"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("BROUILLON")))
                .andExpect(jsonPath("$.message", containsString("EN_COURS")));
    }

    @Test
    @DisplayName("PATCH /api/tickets/{id}/fermer : 200 puis 409 au second appel")
    void fermerPuisRefuser() throws Exception {
        String reponse = mockMvc.perform(post("/api/tickets").contentType(MediaType.APPLICATION_JSON)
                        .content(corps("Cafétière en panne", null)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(reponse).get("id").asLong();

        mockMvc.perform(patch("/api/tickets/{id}/fermer", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("FERME"));

        mockMvc.perform(patch("/api/tickets/{id}/fermer", id))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.regle").value("RG-03"))
                .andExpect(jsonPath("$.message", containsString("RG-03")));
    }

    @Test
    @DisplayName("Identifiant inconnu : 404 lisible")
    void fermerTicketInexistant() throws Exception {
        mockMvc.perform(patch("/api/tickets/{id}/fermer", 4242L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("4242")));
    }

    @Test
    @DisplayName("Le client ne peut pas imposer statut ou date : les extra sont ignorés")
    void ignorerLesChampsServeur() throws Exception {
        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"titre": "Badge non reconnu", "description": null,
                                 "statut": "FERME", "dateCreation": "2020-01-01T00:00:00Z"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statut").value("OUVERT"));
    }

    @Test
    @DisplayName("PATCH /api/tickets/{id}/statut : OUVERT → EN_COURS renvoie 200")
    void passerEnCours() throws Exception {
        String reponse = mockMvc.perform(post("/api/tickets").contentType(MediaType.APPLICATION_JSON)
                        .content(corps("Cafétière en panne", null)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(reponse).get("id").asLong();

        mockMvc.perform(patch("/api/tickets/{id}/statut", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"statut\": \"EN_COURS\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("EN_COURS"));
    }

    @Test
    @DisplayName("PATCH /api/tickets/{id}/statut : EN_COURS → OUVERT renvoie 200")
    void repasserOuvert() throws Exception {
        String reponse = mockMvc.perform(post("/api/tickets").contentType(MediaType.APPLICATION_JSON)
                        .content(corps("Cafétière en panne", null)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(reponse).get("id").asLong();

        mockMvc.perform(patch("/api/tickets/{id}/statut", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"statut\": \"EN_COURS\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/tickets/{id}/statut", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"statut\": \"OUVERT\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("OUVERT"));
    }

    @Test
    @DisplayName("PATCH /api/tickets/{id}/statut sur ticket FERME : 409 RG-03")
    void refuserChangementDepuisFerme() throws Exception {
        String reponse = mockMvc.perform(post("/api/tickets").contentType(MediaType.APPLICATION_JSON)
                        .content(corps("Cafétière en panne", null)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(reponse).get("id").asLong();

        mockMvc.perform(patch("/api/tickets/{id}/fermer", id))
                .andExpect(status().isOk());

        mockMvc.perform(patch("/api/tickets/{id}/statut", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"statut\": \"EN_COURS\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.regle").value("RG-03"))
                .andExpect(jsonPath("$.message", containsString("RG-03")));
    }

    @Test
    @DisplayName("PATCH /api/tickets/{id}/statut id inconnu : 404")
    void changementTicketInexistant() throws Exception {
        mockMvc.perform(patch("/api/tickets/{id}/statut", 4242L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"statut\": \"EN_COURS\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("4242")));
    }

    @Test
    @DisplayName("PATCH /api/tickets/{id}/statut statut absent : 400")
    void refuserStatutAbsent() throws Exception {
        String reponse = mockMvc.perform(post("/api/tickets").contentType(MediaType.APPLICATION_JSON)
                        .content(corps("Cafétière en panne", null)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(reponse).get("id").asLong();

        mockMvc.perform(patch("/api/tickets/{id}/statut", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }
}
