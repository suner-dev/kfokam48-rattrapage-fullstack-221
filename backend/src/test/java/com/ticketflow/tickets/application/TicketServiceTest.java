package com.ticketflow.tickets.application;

import com.ticketflow.tickets.application.dto.TicketCreationDto;
import com.ticketflow.tickets.application.dto.TicketDto;
import com.ticketflow.tickets.domain.RegleDeGestionVioleeException;
import com.ticketflow.tickets.domain.Statut;
import com.ticketflow.tickets.domain.Ticket;
import com.ticketflow.tickets.domain.TicketIntrouvableException;
import com.ticketflow.tickets.domain.TicketRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Règles de gestion du TicketService")
class TicketServiceTest {

    @Mock
    private TicketRepository repository;

    @InjectMocks
    private TicketService service;

    @Test
    @DisplayName("RG-01 — un ticket créé naît au statut OUVERT, horodaté par le serveur")
    void creerAppliqueRg01() {
        when(repository.titreExiste("Imprimante HS")).thenReturn(false);
        when(repository.sauvegarder(any(Ticket.class))).thenAnswer(inv -> inv.getArgument(0));

        TicketDto resultat = service.creer(new TicketCreationDto("Imprimante HS", "Page bloquée"));

        ArgumentCaptor<Ticket> captor = ArgumentCaptor.forClass(Ticket.class);
        verify(repository).sauvegarder(captor.capture());
        assertThat(captor.getValue().getStatut()).isEqualTo(Statut.OUVERT);
        assertThat(captor.getValue().getDateCreation()).isNotNull();
        assertThat(resultat.statut()).isEqualTo(Statut.OUVERT);
    }

    @Test
    @DisplayName("RG-01 — la description facultative vide est normalisée en null")
    void creerAvecDescriptionAbsente() {
        when(repository.titreExiste(any())).thenReturn(false);
        when(repository.sauvegarder(any(Ticket.class))).thenAnswer(inv -> inv.getArgument(0));

        service.creer(new TicketCreationDto("  Clavier qui bippe  ", "   "));

        ArgumentCaptor<Ticket> captor = ArgumentCaptor.forClass(Ticket.class);
        verify(repository).sauvegarder(captor.capture());
        assertThat(captor.getValue().getTitre()).isEqualTo("Clavier qui bippe");
        assertThat(captor.getValue().getDescription()).isNull();
    }

    @Test
    @DisplayName("RG-02 — un titre déjà utilisé est refusé, rien n'est inséré")
    void creerRefuseTitreDoublon() {
        when(repository.titreExiste("Écran noir")).thenReturn(true);

        assertThatThrownBy(() -> service.creer(new TicketCreationDto("Écran noir", null)))
                .isInstanceOf(RegleDeGestionVioleeException.class)
                .hasMessageContaining("RG-02")
                .hasMessageContaining("Écran noir");

        verify(repository, never()).sauvegarder(any());
    }

    @Test
    @DisplayName("RG-03 — la fermeture d'un ticket OUVERT aboutit à FERME")
    void fermerDepuisOuvert() {
        Ticket ticket = Ticket.nouveau("Wifi coupé", null);
        when(repository.parId(1L)).thenReturn(Optional.of(ticket));
        when(repository.sauvegarder(any(Ticket.class))).thenAnswer(inv -> inv.getArgument(0));

        TicketDto resultat = service.fermer(1L);

        assertThat(resultat.statut()).isEqualTo(Statut.FERME);
    }

    @Test
    @DisplayName("RG-03 — la fermeture d'un ticket EN_COURS est autorisée")
    void fermerDepuisEnCours() {
        Ticket ticket = Ticket.nouveau("Wifi coupé", null);
        placerEnCours(ticket);
        when(repository.parId(2L)).thenReturn(Optional.of(ticket));
        when(repository.sauvegarder(any(Ticket.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThat(service.fermer(2L).statut()).isEqualTo(Statut.FERME);
    }

    @Test
    @DisplayName("RG-03 — un ticket déjà FERME ne change plus d'état : 409")
    void refuserFermetureDunTicketFerme() {
        Ticket ticket = Ticket.nouveau("Wifi coupé", null);
        ticket.fermer();
        when(repository.parId(3L)).thenReturn(Optional.of(ticket));

        assertThatThrownBy(() -> service.fermer(3L))
                .isInstanceOf(RegleDeGestionVioleeException.class)
                .hasMessageContaining("RG-03");

        verify(repository, never()).sauvegarder(any());
    }

    @Test
    @DisplayName("Un identifiant inconnu lève TicketIntrouvableException (→ 404)")
    void refuserFermetureDunIdentifiantInconnu() {
        when(repository.parId(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.fermer(99L))
                .isInstanceOf(TicketIntrouvableException.class)
                .hasMessageContaining("99");
    }

    @Test
    @DisplayName("Sans filtre, la liste complète est retournée")
    void listerSansFiltre() {
        when(repository.tous()).thenReturn(List.of(Ticket.nouveau("A", null), Ticket.nouveau("B", null)));

        assertThat(service.lister(null)).hasSize(2);
        verify(repository).tous();
    }

    @Test
    @DisplayName("Avec filtre, seuls les tickets du statut demandé sont retournés")
    void listerAvecFiltre() {
        when(repository.parStatut(Statut.OUVERT)).thenReturn(List.of(Ticket.nouveau("A", null)));

        List<TicketDto> resultat = service.lister(Statut.OUVERT);

        assertThat(resultat).hasSize(1);
        assertThat(resultat.get(0).statut()).isEqualTo(Statut.OUVERT);
        verify(repository, never()).tous();
    }

    /**
     * Place un ticket au statut EN_COURS pour les besoins du test.
     * Aucun endpoint ne permet encore cette transition (le sujet n'impose
     * que trois endpoints) : on écrit directement dans le champ pour ne
     * pas élargir l'API du domaine.
     */
    private static void placerEnCours(Ticket ticket) {
        try {
            var champ = Ticket.class.getDeclaredField("statut");
            champ.setAccessible(true);
            champ.set(ticket, Statut.EN_COURS);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}
