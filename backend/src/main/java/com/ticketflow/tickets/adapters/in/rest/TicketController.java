package com.ticketflow.tickets.adapters.in.rest;

import com.ticketflow.tickets.adapters.in.rest.dto.ErreurReponse;
import com.ticketflow.tickets.application.TicketService;
import com.ticketflow.tickets.application.dto.TicketCreationDto;
import com.ticketflow.tickets.application.dto.TicketDto;
import com.ticketflow.tickets.domain.Statut;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;

/**
 * Adaptateur d'entrée HTTP. Aucune règle de gestion ici : le contrôleur
 * se limite à vérifier la syntaxe (@Valid), déléguer au service et traduire
 * le résultat en réponse HTTP.
 */
@RestController
@RequestMapping("/api/tickets")
@Tag(name = "Tickets", description = "Suivi des demandes de support")
public class TicketController {

    private final TicketService service;

    public TicketController(TicketService service) {
        this.service = service;
    }

    @Operation(summary = "Créer un ticket",
            description = "Le client n'envoie que titre et description. Le statut (OUVERT), "
                    + "l'identifiant et la date de création sont déterminés par le serveur. "
                    + "RG-01 : titre obligatoire, 100 caractères maximum. RG-02 : titre unique.")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            description = "Données saisies par l'utilisateur : titre obligatoire, description facultative",
            required = true,
            content = @Content(examples = @ExampleObject(name = "demande standard", value = """
                    {
                      "titre": "Clavier du poste 8 hors service",
                      "description": "Aucune touche ne répond, câble contrôlé."
                    }
                    """)
            ))
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Ticket créé",
                    content = @Content(schema = @Schema(implementation = TicketDto.class))),
            @ApiResponse(responseCode = "400", description = "Validation échouée (titre absent ou trop long)",
                    content = @Content(schema = @Schema(implementation = ErreurReponse.class))),
            @ApiResponse(responseCode = "409", description = "Règle RG-02 violée : titre déjà utilisé",
                    content = @Content(schema = @Schema(implementation = ErreurReponse.class)))
    })
    @PostMapping
    public ResponseEntity<TicketDto> creer(@Valid @RequestBody TicketCreationDto dto,
                                           UriComponentsBuilder uriBuilder) {
        TicketDto cree = service.creer(dto);
        return ResponseEntity
                .created(uriBuilder.path("/api/tickets/{id}").buildAndExpand(cree.id()).toUri())
                .body(cree);
    }

    @Operation(summary = "Lister les tickets",
            description = "Retourne tous les tickets, ou uniquement ceux du statut demandé via le filtre.")
    @ApiResponse(responseCode = "200", description = "Liste des tickets",
            content = @Content(schema = @Schema(implementation = TicketDto.class)))
    @GetMapping
    public List<TicketDto> lister(
            @Parameter(description = "Filtre optionnel par statut",
                    schema = @Schema(implementation = Statut.class))
            @RequestParam(name = "statut", required = false) Statut statut) {
        return service.lister(statut);
    }

    @Operation(summary = "Fermer un ticket",
            description = "RG-03 : seul un ticket OUVERT ou EN_COURS peut être fermé ; "
                    + "un ticket FERME ne change plus d'état.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ticket fermé",
                    content = @Content(schema = @Schema(implementation = TicketDto.class))),
            @ApiResponse(responseCode = "404", description = "Identifiant inconnu",
                    content = @Content(schema = @Schema(implementation = ErreurReponse.class))),
            @ApiResponse(responseCode = "409", description = "Règle RG-03 violée : ticket déjà fermé",
                    content = @Content(schema = @Schema(implementation = ErreurReponse.class)))
    })
    @PatchMapping("/{id}/fermer")
    public TicketDto fermer(@PathVariable Long id) {
        return service.fermer(id);
    }
}
