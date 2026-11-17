# Questions juridiques ouvertes (édition 0.5.3) — propositions à décider

Rien ici n'est intégré aux documents publiés. Ce ne sont pas des validations juridiques.
Sources consultées le 2026-11-17. À relire sur Légifrance avant intégration : certaines pages n'ont pu être lues que via un moteur de recherche.

## 1. Rôle contractuel de Google Commerce Limited (CGV, « billing »)

Source : Conditions d'utilisation de Google Play, version EEE — https://play.google.com/about/play-terms/eea/index.html (page datée du 29 mars 2025).
Points relevés :
- Le contenu de Google Play est « offered by Google Commerce Limited ». L'achat crée « a separate contract » avec Google Commerce Limited (Gordon House, Barrow Street, Dublin 4, Irlande).
- Le texte ne qualifie pas GCL d'agent du développeur. Le contenu peut provenir d'une autre source (le développeur).
- Google y décrit lui-même le droit de rétractation pour le contenu numérique et sa renonciation lors de la commande.

Clause proposée (remplace la 2e phrase de `clauses.billing`) :
> La vente est conclue avec Google Commerce Limited (Gordon House, Barrow Street, Dublin 4, Irlande) selon les conditions d'utilisation de Google Play (https://play.google.com/about/play-terms/eea/index.html). Google présente le prix localisé toutes taxes comprises, encaisse le paiement, valide la commande et envoie le reçu. JavaChrist fournit le contenu du jeu et répond de sa conformité (voir Garanties).

## 2. Rétractation et remboursements (`clauses.withdrawal`)

Sources :
- Code de la consommation, art. L221-28 13° — https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226820. Pas de rétractation pour le contenu numérique sans support matériel si trois conditions sont réunies : (a) consentement exprès préalable, (b) reconnaissance de la perte du droit, (c) confirmation selon le 2e alinéa de L221-13.
- Aide Google Play — https://support.google.com/googleplay/answer/2479637?hl=fr. La règle des « 48 heures » n'apparaît **pas** sur cette page à la date de lecture. Elle invite à contacter le développeur. Une page dédiée à l'EEE existe : https://support.google.com/googleplay/answer/7659581 (non lue).

Clause proposée (supprime le délai de 48 h non confirmé) :
> Les achats intégrés sont des contenus numériques fournis immédiatement après le paiement. Conformément à l'article L221-28 13° du Code de la consommation, le droit de rétractation ne s'applique pas lorsque vous avez, lors de la commande sur Google Play, demandé l'exécution immédiate, reconnu perdre ce droit et reçu la confirmation de cet accord. Les demandes de remboursement s'adressent à Google Play selon ses règles (https://support.google.com/googleplay/answer/2479637). Vous pouvez aussi écrire à support@javachrist.fr : JavaChrist examine chaque demande, notamment en cas d'achat payé mais non crédité.

À vérifier par toi : sur un achat réel, l'écran de commande Google Play recueille bien (a), (b) et (c) pour la France.

## 3. Encadré de la garantie légale de conformité (`clauses.guarantees`)

Sources :
- L224-25-12, 2e alinéa : fourniture **ponctuelle**. Le professionnel répond des défauts qui apparaissent dans les **deux ans** suivant la fourniture. C'est le cas des pièces et packs.
- L'encadré obligatoire pour ces contrats est fixé par l'**art. D211-3** et son annexe, créés par le décret n° 2022-946 du 29 juin 2022. L'art. D211-4 (https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045981112) vise la fourniture **continue** (3e alinéa). Il ne s'applique pas ici.
- Je n'ai pu lire que le modèle annexé à D211-4 (https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000045981322), pas celui de D211-3.

Proposition : reprendre **mot pour mot** le modèle annexé à l'article D211-3, copié depuis Légifrance (Code de la consommation › Partie réglementaire › Annexes). Le délai est « deux ans à compter de la fourniture ». Je ne le recopie pas de mémoire : le texte officiel doit être collé tel quel dans `clauses.guarantees`, encadré compris.

## 4. Coordonnées de l'hébergeur (`hosting.phone`, mentions légales)

Source : LCEN (loi n° 2004-575), art. 6 III 1 d) dans sa rédaction de 2020 (https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000042038977/2020-06-26/). Il exige « le nom, la dénomination ou la raison sociale et l'adresse et le numéro de téléphone » de l'hébergeur. Le III 2 permet à un éditeur non professionnel de ne donner que le nom et l'adresse de l'hébergeur, s'il s'est identifié auprès de lui.
À vérifier : la numérotation a pu changer avec la loi SREN de 2024 (article 1-1).

Constat : aucun numéro de téléphone de Vercel Inc. n'a été trouvé sur https://vercel.com/legal/terms ni sur https://vercel.com/legal/privacy-policy. Le seul numéro rencontré appartient à l'organisme d'arbitrage JAMS, pas à Vercel.

Options (aucun numéro inventé, pas de remplacement automatique par un e-mail) :
- A. Demander à Vercel un numéro officiel publiable (support ou privacy@vercel.com), puis le saisir.
- B. Si tu publies en qualité d'éditeur non professionnel et que Vercel a tes coordonnées, appliquer le III 2. Cela reste à confirmer avec ton statut réel : Cubelyo vend des achats, donc il y a probablement une activité professionnelle.
- C. Changer d'hébergeur pour un hébergeur qui publie un numéro.

## 5. Sauvegardes en ligne abandonnées — conservation et procédure (aucune purge lancée)

**Décidé (2026-11-17)** : 12 mois d'inactivité, audit mensuel en lecture seule, validation avant toute purge manuelle,
information dans la politique de confidentialité (édition 0.5.3, champ `retention` de `legal/firebase-draft.json`).
Audit : `npm run cloud:audit` (`scripts/cloud-audit.ts`, `src/server/audit.ts`), nombres seulement, aucun UID.
Critère retenu, plus strict que la proposition ci-dessous : `updatedAt` > 12 mois **et** dernière activité de l'identité
> 12 mois (`lastRefreshTime`, sinon `lastSignInTime`, sinon `creationTime`). Vérifié sur l'émulateur Auth
(`tests-firebase/audit.test.ts`) : `lastRefreshTime` avance au renouvellement du jeton, `lastSignInTime` non.
Le SDK renouvelle le jeton au plus une fois par heure d'utilisation, et seulement sauvegarde en ligne active :
une sauvegarde en pause n'enregistre aucune activité. `updatedAt` ne change que si la partie change : seul, il ne
suffisait pas. Le script de purge n'est pas écrit ; les preuves d'achat (`playPurchases`) en sont exclues (section 6).

Constat : une identité anonyme perdue (désinstallation sans effacement, changement d'appareil) laisse un document `players/{uid}/saves/prototype` inaccessible à son joueur, sans limite de durée.

Proposition :
- **Durée** : 12 mois sans écriture (`updatedAt`) et sans renouvellement de connexion (voir ci-dessus). La sauvegarde n'est écrite que lorsque la partie change.
- **Procédure** :
  1. Script d'audit en lecture seule, lancé chaque mois, qui compte les documents dont `updatedAt` a plus de 12 mois. Il n'écrit ni ne supprime rien.
  2. Tu valides le rapport.
  3. Script de purge séparé, lancé manuellement avec une confirmation explicite. Il supprime le document de sauvegarde, puis l'identité anonyme correspondante (Admin SDK `deleteUser`) si elle n'a aucune connexion depuis 12 mois.
  4. Un journal de purge conserve seulement le nombre et la date, sans UID.
  - Option plus tard : une règle TTL Firestore sur un champ `expiresAt` (`updatedAt` + 12 mois), seulement après ton accord.
- **Texte de confidentialité** à ajouter une fois décidé : « Une sauvegarde en ligne sans modification depuis 12 mois et l'identité anonyme associée sont supprimées. »
- Les drafts « confidentialite » et « droits-rgpd » restent en Brouillon tant que ce point n'est pas décidé et mis en place.

## 6. Registre des preuves d'attribution des achats (`playPurchases`) — durée à décider

Contenu par achat de pièces ou de pack : empreinte SHA-256 tronquée du jeton (pas le jeton), UID anonyme, produit,
contenu, dates d'attribution et de finalisation. Lecture et écriture réservées au serveur (règles Firestore : tout refusé
au client). Rôle : empêcher un second crédit et répondre aux réclamations (garantie de conformité, 2 ans).
Non supprimé par « Effacer ma sauvegarde » ni par la règle des 12 mois.

Proposition : conserver chaque preuve **3 ans** après l'attribution (garantie légale de 2 ans + marge de réclamation),
puis la supprimer par un script séparé, après ton accord. Les documents indiquent pour l'instant « durée maximale
non encore fixée » et la page Confidentialité reste en Brouillon sur ce point.
