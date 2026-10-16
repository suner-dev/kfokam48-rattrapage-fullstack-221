import { useState, type FormEvent } from 'react';
import type { ErreurApi } from '../../../shared/http/httpClient';
import type { NouvelleDemande } from '../domain/ticket';

interface Props {
  enCours: boolean;
  erreur: ErreurApi | null;
  onSoumettre: (demande: NouvelleDemande) => Promise<boolean>;
  onEffacerErreur: () => void;
}

/**
 * Formulaire de création.
 * Point volontaire : aucune limite de longueur côté client — le refus
 * d'un titre de plus de 100 caractères doit venir du serveur, avec son
 * message. Le bouton reste simplement inactif tant que le titre est vide.
 */
export function TicketFormulaire({ enCours, erreur, onSoumettre, onEffacerErreur }: Props) {
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [messageSucces, setMessageSucces] = useState<string | null>(null);

  const titreRenseigne = titre.trim().length > 0;

  async function soumettre(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (!titreRenseigne || enCours) return;

    onEffacerErreur();
    setMessageSucces(null);

    const succes = await onSoumettre({ titre: titre.trim(), description });
    if (succes) {
      setTitre('');
      setDescription('');
      setMessageSucces('Le ticket a été créé et apparaît dans la liste.');
    }
  }

  return (
    <section className="carte carte-formulaire" aria-labelledby="titre-formulaire">
      <header className="carte-entete">
        <h2 id="titre-formulaire">Nouvelle demande</h2>
        <p className="carte-sous-titre">Seuls le titre et la description sont envoyés.</p>
      </header>

      <form className="formulaire" onSubmit={soumettre} noValidate>
        <div className="champ">
          <label htmlFor="titre">Titre <span className="obligatoire">*</span></label>
          <input
            id="titre"
            name="titre"
            type="text"
            autoComplete="off"
            placeholder="Décrivez la demande en quelques mots"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            aria-invalid={erreur !== null}
            aria-describedby={erreur ? 'erreur-formulaire' : undefined}
          />
        </div>

        <div className="champ">
          <label htmlFor="description">Description <span className="facultatif">(facultative)</span></label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Précisez le contexte, les messages observés…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {erreur ? (
          <p id="erreur-formulaire" className="refus" role="alert">
            <span className="refus-code">{erreur.code}{erreur.regle ? ` · ${erreur.regle}` : ''}</span>
            {erreur.message}
          </p>
        ) : null}

        {messageSucces && !erreur ? (
          <p className="acceptation" role="status">{messageSucces}</p>
        ) : null}

        <div className="actions">
          <button type="submit" className="bouton bouton-primaire" disabled={!titreRenseigne || enCours}>
            {enCours ? 'Envoi en cours…' : 'Créer le ticket'}
          </button>
          <span className="aide">
            {titreRenseigne ? 'Prêt à être envoyé.' : 'Le titre est obligatoire.'}
          </span>
        </div>
      </form>
    </section>
  );
}
