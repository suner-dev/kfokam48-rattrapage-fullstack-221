package com.ticketflow.tickets.domain;

/**
 * Statuts possibles d'un ticket de support.
 * Libellés affichés en français ; valeurs techniques en français aussi
 * (OUVERT, EN_COURS, FERME) conformément au cahier des charges.
 */
public enum Statut {

    OUVERT("Ouvert"),
    EN_COURS("En cours"),
    FERME("Fermé");

    private final String label;

    Statut(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    /**
     * RG-03 — Seuls les tickets OUVERT ou EN_COURS peuvent être fermés.
     * Un ticket FERME ne change plus d'état.
     */
    public boolean peutEtreFerme() {
        return this == OUVERT || this == EN_COURS;
    }
}
