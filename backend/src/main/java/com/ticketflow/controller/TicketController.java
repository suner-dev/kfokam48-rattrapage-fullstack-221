package com.ticketflow.controller;

import com.ticketflow.dto.TicketRequestDTO;
import com.ticketflow.dto.TicketResponseDTO;
import com.ticketflow.enums.Statut;
import com.ticketflow.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ContrÃ´leur Ticket.
 * Aucune logique métier ici : elle rÃ©side dans TicketService.
 * Trois endpoints : POST /api/tickets, GET /api/tickets, PATCH /api/tickets/{id}/fermer.
 */
@RestController
@Tag(name = "Ticket", description = "Gestion des tickets de support")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    /**
     * CrÃ©er un ticket.
     * Le client envoie uniquement titre et description.
     */
    @Operation(summary = "CrÃ©er un ticket", description = "CrÃ©e un ticket en statut OUVERT. Le client ne fournit que titre et description.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Ticket crÃ©e avec succÃ¨s",
                    content = @Content(schema = @Schema(implementation = TicketResponseDTO.class))),
            @ApiResponse(responseCode = "400", description = "Validation Ã©chouÃ©e (titre absent ou > 100 caractÃ¨res)"),
            @ApiResponse(responseCode = "409", description = "Titre dÃ©jÃ  utilisÃ© (RG-02)")
    })
    @PostMapping("/api/tickets")
    public ResponseEntity<TicketResponseDTO> creer(@Valid @RequestBody TicketRequestDTO request) {
        TicketResponseDTO created = ticketService.creer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Lister les tickets, optionnellement filtrÃ©s par statut.
     */
    @Operation(summary = "Lister les tickets", description = "Renvoie la liste des tickets, optionnellement filtrÃ©e par statut (OUVERT, EN_COURS, FERME).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Liste des tickets",
                    content = @Content(schema = @Schema(implementation = TicketResponseDTO.class)))
    })
    @GetMapping("/api/tickets")
    public ResponseEntity<List<TicketResponseDTO>> lister(
            @Parameter(description = "Filtrer par statut : OUVERT, EN_COURS, FERME (ou omit pour tous)")
            @RequestParam(required = false) Statut statut) {
        List<TicketResponseDTO> tickets = ticketService.lister(statut);
        return ResponseEntity.ok(tickets);
    }

    /**
     * Fermer un ticket.
     */
    @Operation(summary = "Fermer un ticket", description = "Passe un ticket en statut FERMÃ‰. AutorisÃ© uniquement si le ticket est OUVERT ou EN_COURS (RG-03).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Ticket fermÃ© avec succÃ¨s",
                    content = @Content(schema = @Schema(implementation = TicketResponseDTO.class))),
            @ApiResponse(responseCode = "404", description = "Ticket introuvable (identifiant inconnu)"),
            @ApiResponse(responseCode = "409", description = "Ticket dÃ©jÃ  FERMÃ‰ (RG-03)")
    })
    @PatchMapping("/api/tickets/{id}/fermer")
    public ResponseEntity<TicketResponseDTO> fermer(
            @Parameter(description = "Identifiant du ticket Ã  fermer", required = true)
            @PathVariable Long id) {
        TicketResponseDTO closed = ticketService.fermer(id);
        return ResponseEntity.ok(closed);
    }

    /**
     * Gestion d'erreur de validation (@Valid) -> 400 avec message prÃ©cis.
     */
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Map<String, String> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return errors;
    }
}
