-- Vérification côté base (partie A.4 du sujet) :
-- retrouver un ticket créé depuis Swagger, sans passer par l'API.

-- 1) Tous les tickets, du plus récent au plus ancien
SELECT id, titre, statut, date_creation
FROM tickets
ORDER BY date_creation DESC;

-- 2) Le ticket créé à l'instant depuis Swagger (statut OUVERT, horodaté serveur)
SELECT id, titre, description, statut, date_creation
FROM tickets
WHERE statut = 'OUVERT'
ORDER BY id DESC
LIMIT 1;

-- 3) Contrôle RG-02 : aucun titre ne doit revenir deux fois
SELECT titre, COUNT(*) AS occurrences
FROM tickets
GROUP BY titre
HAVING COUNT(*) > 1;

-- 4) Contrôle RG-01 : aucun titre ne doit dépasser 100 caractères
SELECT id, titre, LENGTH(titre) AS longueur
FROM tickets
WHERE LENGTH(titre) > 100;
