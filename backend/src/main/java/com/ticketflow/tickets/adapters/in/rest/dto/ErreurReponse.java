package com.ticketflow.tickets.adapters.in.rest.dto;

import java.time.Instant;
import java.util.List;

/**
 * Corps de réponse d'erreur standardisé, documenté dans Swagger.
 * Le message nomme toujours la règle violée (RG-02, RG-03) ou la cause
 * de l'échec de validation : jamais un simple « erreur serveur ».
 */
public record ErreurReponse(
        Instant horodatage,
        int code,
        String statut,
        String message,
        String regle,
        String chemin,
        List<ErreurChamp> erreurs
) {

    /** Détail d'une erreur de validation champ par champ. */
    public record ErreurChamp(String champ, String message) {
    }

    public static ErreurReponse de(int code, String statut, String message, String regle, String chemin) {
        return new ErreurReponse(Instant.now(), code, statut, message, regle, chemin, List.of());
    }

    public static ErreurReponse deValidation(int code, String statut, String message, String chemin,
                                             List<ErreurChamp> erreurs) {
        return new ErreurReponse(Instant.now(), code, statut, message, null, chemin, erreurs);
    }
}
