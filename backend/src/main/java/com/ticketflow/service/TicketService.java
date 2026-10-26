package com.ticketflow.service;

import com.ticketflow.dto.TicketRequestDTO;
import com.ticketflow.dto.TicketResponseDTO;
import com.ticketflow.entity.Ticket;
import com.ticketflow.enums.Statut;
import com.ticketflow.exception.TicketAlreadyExistsException;
import com.ticketflow.exception.TicketClosedException;
import com.ticketflow.exception.TicketNotFoundException;
import com.ticketflow.repository.TicketRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class TicketService {

    private final TicketRepository ticketRepository;

    public TicketService(TicketRepository ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    /**
     * CrÃ©e un ticket.
     * RÃ¨gle RG-01 : titre obligatoire, statut OUVERT d'offi
     * RÃ¨gle RG-02 : titre unique (pas de doublon).
     * Le client ne fournit que titre et description.
     */
    @Transactional
    public TicketResponseDTO creer(TicketRequestDTO request) {
        // RG-02 : vÃ©rifier l'unicitÃ© du titre
        if (ticketRepository.findByTitre(request.getTitre()).isPresent()) {
            throw new TicketAlreadyExistsException(request.getTitre());
        }

        Ticket ticket = new Ticket(
                request.getTitre(),
                request.getDescription(),
                Statut.OUVERT, // RG-01 : crÃ©e en statut OUVERT
                LocalDateTime.now() // date de crÃ©ation gÃ©nÃ©rÃ©e par le serveur
        );

        Ticket saved = ticketRepository.save(ticket);
        return versDTO(saved);
    }

    /**
     * Liste les tickets, optionnellement filtrÃ©s par statut.
     */
    public List<TicketResponseDTO> lister(Statut statut) {
        List<Ticket> tickets = ticketRepository.findByStatutOptional(statut);
        return tickets.stream()
                .map(this::versDTO)
                .collect(Collectors.toList());
    }

    /**
     * Ferme un ticket.
     * RÃ¨gle RG-03 : fermeture autorisÃ©e uniquement si OUVERT ou EN_COURS.
     * Un ticket FERMÃ‰ est figÃ©.
     */
    @Transactional
    public TicketResponseDTO fermer(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new TicketNotFoundException(id));

        if (ticket.getStatut() == Statut.FERME) {
            throw new TicketClosedException(id);
        }

        ticket.setStatut(Statut.FERME);
        Ticket saved = ticketRepository.save(ticket);
        return versDTO(saved);
    }

    private TicketResponseDTO versDTO(Ticket ticket) {
        return new TicketResponseDTO(
                ticket.getId(),
                ticket.getTitre(),
                ticket.getDescription(),
                ticket.getStatut(),
                ticket.getDateCreation()
        );
    }
}
