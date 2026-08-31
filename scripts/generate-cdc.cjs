const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  AlignmentType,
  HeadingLevel,
  LevelFormat,
  BorderStyle,
  WidthType,
  ShadingType,
  VerticalAlign,
  PageNumber,
  PageBreak,
  TabStopType,
  TabStopPosition,
} = require("docx");

const A4_W = 11906;
const A4_H = 16838;
const MARGIN = 1134; // 2 cm
const CONTENT_W = A4_W - MARGIN * 2; // 9638
const TEAL = "0F766E";
const CYAN = "0369A1";
const DARK = "0F172A";
const MUTED = "475569";
const LIGHT = "ECFEFF";
const HEADER_BG = "0F766E";
const ALT = "F8FAFC";
const WHITE = "FFFFFF";
const LINE = "CBD5E1";
const WARN_BG = "FEF3C7";
const OK_BG = "DCFCE7";

const thin = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const borders = { top: thin, bottom: thin, left: thin, right: thin };
const noBorder = {
  style: BorderStyle.NONE,
  size: 0,
  color: "FFFFFF",
};
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

function run(text, opts = {}) {
  return new TextRun({
    text,
    font: "Arial",
    size: opts.size ?? 22,
    bold: opts.bold ?? false,
    italics: opts.italics ?? false,
    color: opts.color ?? DARK,
    underline: opts.underline ? {} : undefined,
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 160, before: opts.before ?? 0, line: 276 },
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    children: [run(text, opts)],
  });
}

function mixed(parts, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 160, before: opts.before ?? 0, line: 276 },
    alignment: opts.align ?? AlignmentType.JUSTIFIED,
    children: parts.map((part) =>
      typeof part === "string" ? run(part) : run(part.text, part)
    ),
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: TEAL, space: 4 } },
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: TEAL })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: CYAN })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: DARK })],
  });
}

function bullet(text, ref = "bullets") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80, line: 276 },
    children: [run(text, { size: 21 })],
  });
}

function numbered(text, ref = "numbers") {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80, line: 276 },
    children: [run(text, { size: 21 })],
  });
}

function caption(text) {
  return new Paragraph({
    spacing: { before: 60, after: 200 },
    alignment: AlignmentType.CENTER,
    children: [run(text, { size: 18, italics: true, color: MUTED })],
  });
}

function spacer(after = 200) {
  return new Paragraph({ spacing: { after }, children: [] });
}

function cell(text, width, opts = {}) {
  const fill = opts.fill ?? WHITE;
  const align = opts.align ?? AlignmentType.LEFT;
  const bold = opts.bold ?? false;
  const color = opts.color ?? DARK;
  const lines = Array.isArray(text) ? text : [text];
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 70, bottom: 70, left: 100, right: 100 },
    columnSpan: opts.span,
    children: lines.map(
      (line, i) =>
        new Paragraph({
          alignment: align,
          spacing: { after: i === lines.length - 1 ? 0 : 40 },
          children: [run(String(line), { size: opts.size ?? 18, bold, color })],
        })
    ),
  });
}

function table(headers, rows, widths) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      cell(h, widths[i], { fill: HEADER_BG, bold: true, color: WHITE, size: 18 })
    ),
  });
  const body = rows.map(
    (row, r) =>
      new TableRow({
        children: row.map((value, i) =>
          cell(value, widths[i], {
            fill: r % 2 === 1 ? ALT : WHITE,
            size: 18,
          })
        ),
      })
  );
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [headerRow, ...body],
  });
}

function kvTable(pairs) {
  const w1 = 2800;
  const w2 = CONTENT_W - w1;
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [w1, w2],
    rows: pairs.map(
      ([k, v], i) =>
        new TableRow({
          children: [
            cell(k, w1, { fill: i % 2 ? ALT : LIGHT, bold: true, size: 18 }),
            cell(v, w2, { fill: i % 2 ? ALT : WHITE, size: 18 }),
          ],
        })
    ),
  });
}

function coverLine(label, value) {
  return new Paragraph({
    spacing: { after: 80 },
    tabStops: [{ type: TabStopType.LEFT, position: 3200 }],
    children: [
      run(label, { bold: true, size: 22, color: MUTED }),
      run("\t"),
      run(value, { size: 22 }),
    ],
  });
}

const children = [
  // COVER
  new Paragraph({
    spacing: { after: 80 },
    alignment: AlignmentType.CENTER,
    children: [run("STAGE — INFORMATIQUE ET ICT4D", { size: 20, bold: true, color: TEAL })],
  }),
  new Paragraph({
    spacing: { after: 400 },
    alignment: AlignmentType.CENTER,
    border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: TEAL, space: 8 } },
    children: [run("Cahier des charges", { size: 20, color: MUTED })],
  }),
  new Paragraph({
    spacing: { before: 200, after: 80 },
    alignment: AlignmentType.CENTER,
    children: [run("APPLICATION MOBILE ET PANEL D’ADMINISTRATION", { size: 28, bold: true, color: DARK })],
  }),
  new Paragraph({
    spacing: { after: 80 },
    alignment: AlignmentType.CENTER,
    children: [run("Plateforme d’éducation à la santé sexuelle", { size: 36, bold: true, color: TEAL })],
  }),
  new Paragraph({
    spacing: { after: 80 },
    alignment: AlignmentType.CENTER,
    children: [run("et reproductive et de prévention des VBG", { size: 36, bold: true, color: TEAL })],
  }),
  new Paragraph({
    spacing: { before: 120, after: 400 },
    alignment: AlignmentType.CENTER,
    children: [run("JaSanté", { size: 48, bold: true, color: CYAN })],
  }),
  spacer(200),
  kvTable([
    ["Nom du projet", "JaSanté"],
    ["Nature du document", "Cahier des charges fonctionnel et technique"],
    ["Version", "1.0"],
    ["Date", "24 août 2026"],
    ["Statut", "Document de référence du stage"],
    ["Périmètre", "Application mobile anonyme + panel d’administration web"],
    ["Public visé", "Jeunes et communautés ; équipes éducatives et associatives"],
    ["Langues", "Français et anglais"],
  ]),
  spacer(300),
  p("Ce document définit le besoin, le périmètre, les exigences, les contraintes et les critères d’acceptation de la plateforme JaSanté. Il sert de référence unique pour le développement, la validation et la soutenance du stage.", { italics: true, color: MUTED, align: AlignmentType.LEFT }),
  new Paragraph({ children: [new PageBreak()] }),

  // TOC
  h1("Table des matières"),
  p("1. Objet du document"),
  p("2. Contexte et justification"),
  p("3. Objectifs du stage et de la solution"),
  p("4. Périmètre du projet"),
  p("5. Acteurs et cas d’utilisation"),
  p("6. Exigences fonctionnelles — application mobile"),
  p("7. Exigences fonctionnelles — panel d’administration"),
  p("8. Exigences non fonctionnelles"),
  p("9. Architecture et contraintes techniques"),
  p("10. Données, confidentialité et sécurité"),
  p("11. Planning, jalons et livrables"),
  p("12. Critères d’acceptation"),
  p("13. Glossaire"),
  new Paragraph({ children: [new PageBreak()] }),

  h1("1. Objet du document"),
  p("Le présent cahier des charges décrit la plateforme JaSanté, composée d’une application mobile destinée aux bénéficiaires et d’un panel d’administration destiné aux équipes de l’organisation. Il précise le besoin métier, les fonctionnalités attendues, les exclusions, les contraintes techniques, le modèle de données, le calendrier de réalisation et les conditions de recette."),
  p("Il s’applique à l’ensemble du stage. Toute évolution de périmètre doit être consignée par avenant ou mise à jour versionnée de ce document."),
  h2("1.1 Documents de référence"),
  bullet("Plan de stage (phases, durées, jalons et livrables)."),
  bullet("Diagramme de cas d’utilisation (utilisateur anonyme et administrateur)."),
  bullet("Diagrammes de séquence (consultation mobile et publication administrative)."),
  bullet("Modèle conceptuel de données (catégories, articles, vidéos, questions, réponses, ressources)."),
  bullet("Spécification du panel d’administration (specs/001-admin-panel)."),

  h1("2. Contexte et justification"),
  h2("2.1 Problématique"),
  p("L’accès à une information fiable, claire et non stigmatisante sur la santé sexuelle et reproductive (SSR) et la prévention des violences basées sur le genre (VBG) reste inégal. Les jeunes et les communautés concernées ont besoin d’un canal discret, bilingue et utilisable même en situation de réseau instable. Les organisations éducatives et associatives ont, de leur côté, besoin de publier, actualiser et retirer des contenus sans dépendre d’un développeur pour chaque modification."),
  h2("2.2 Réponse proposée"),
  p("JaSanté est une plateforme d’éducation et d’orientation. L’application mobile permet de consulter des articles, des vidéos, des quiz d’auto-évaluation et un annuaire de ressources d’aide, sans créer de compte. Le panel web permet à un administrateur authentifié de gérer ces contenus, de les publier et de les retirer. Une base unique alimente les deux interfaces : seuls les contenus publiés sont visibles sur le mobile."),
  h2("2.3 Principes directeurs"),
  numbered("Anonymat du bénéficiaire : aucun compte utilisateur n’est exigé sur l’application mobile.", "principes"),
  numbered("Maîtrise éditoriale : l’organisation publie et retire les contenus sans intervention technique quotidienne.", "principes"),
  numbered("Accessibilité : interface lisible, contrastes suffisants, navigation clavier côté admin, prise en charge des lecteurs d’écran côté mobile.", "principes"),
  numbered("Résilience : consultation possible hors ligne des contenus déjà synchronisés.", "principes"),
  numbered("Moindre collecte : aucune donnée de santé personnelle n’est enregistrée pour les utilisateurs de l’application.", "principes"),

  h1("3. Objectifs du stage et de la solution"),
  h2("3.1 Objectif général"),
  p("Concevoir, réaliser et livrer une plateforme opérationnelle d’éducation à la SSR et de prévention des VBG, composée d’un client mobile anonyme et d’un panel d’administration sécurisé, connectés à un backend commun."),
  h2("3.2 Objectifs spécifiques"),
  numbered("Permettre à un utilisateur anonyme de consulter des contenus éducatifs classés par thématique, en français ou en anglais.", "obj"),
  numbered("Permettre la lecture de vidéos éducatives hébergées sur YouTube, avec un lecteur intégré et des messages d’erreur explicites.", "obj"),
  numbered("Proposer un quiz d’auto-évaluation avec correction immédiate et explication pédagogique.", "obj"),
  numbered("Mettre à disposition un annuaire de ressources d’aide (appel, WhatsApp, ville, type de structure).", "obj"),
  numbered("Donner à l’administrateur un espace web pour créer, modifier, publier et retirer catégories, articles, vidéos, quiz et ressources.", "obj"),
  numbered("Garantir que seuls les contenus publiés sont accessibles au public, et que les écritures sont réservées aux comptes administrateurs.", "obj"),
  numbered("Livrer un APK installable, un panel déployable, un schéma de données documenté et un README de mise en œuvre.", "obj"),
  h2("3.3 Publics cibles"),
  table(
    ["Public", "Besoin principal", "Canal"],
    [
      ["Jeunes et communautés", "S’informer de façon discrète, bilingue et hors ligne", "Application mobile"],
      ["Équipes éducatives / associatives", "Publier et actualiser les contenus", "Panel d’administration"],
      ["Encadrement du stage", "Valider les jalons, l’accessibilité et la sécurité", "Livrables et recette"],
    ],
    [2800, 4238, 2600]
  ),
  caption("Tableau 1 — Publics cibles et canaux"),

  h1("4. Périmètre du projet"),
  h2("4.1 Inclus dans le stage"),
  table(
    ["Composant", "Périmètre livré"],
    [
      ["Application mobile", "Accueil, catalogue d’articles, détail d’article, vidéothèque, quiz, annuaire d’aide, langue FR/EN, cache hors ligne, accessibilité de base"],
      ["Panel d’administration", "Connexion, tableau de bord, CRUD catégories, articles, vidéos YouTube, questions de quiz, ressources d’aide, brouillon / publié / retiré"],
      ["Backend", "Schéma PostgreSQL, authentification administrateur, stockage des images d’articles, politiques d’accès, données de démonstration"],
      ["Documentation", "README technique, migrations, guide d’administration, cahier des charges, diagrammes"],
    ],
    [2800, 6838]
  ),
  caption("Tableau 2 — Périmètre inclus"),
  h2("4.2 Exclu du stage (hors périmètre)"),
  p("Les éléments suivants ne font pas partie de la livraison du stage. Ils pourront faire l’objet d’une évolution ultérieure."),
  bullet("Création de comptes ou profils pour les utilisateurs de l’application mobile."),
  bullet("Chatbot, forum communautaire ou messagerie entre utilisateurs."),
  bullet("Signalement d’urgence géolocalisé, bouton d’alerte vers les forces de l’ordre, ou carte interactive."),
  bullet("Hébergement de fichiers vidéo : les vidéos restent sur YouTube ; le système stocke le lien et les métadonnées."),
  bullet("Multiples rôles éditoriaux (rédacteur, relecteur, super-administrateur) : un seul rôle administrateur est prévu."),
  bullet("Analytics comportementaux, tracking publicitaire, ou recueil de données de santé identifiantes."),
  bullet("Publication sur les stores (Google Play / App Store) : un APK signé de démonstration est livré, pas une mise en production magasin."),
  h2("4.3 Hypothèses"),
  bullet("L’organisation fournit les comptes administrateurs, les contenus pédagogiques, le lien de la chaîne vidéo et les éléments de charte."),
  bullet("Le réseau mobile des bénéficiaires peut être intermittent ; le cache local est donc obligatoire pour les contenus déjà consultés ou synchronisés."),
  bullet("Les deux langues de contenu sont le français et l’anglais."),
  bullet("Les ressources d’aide (téléphone, WhatsApp, ville) sont fournies et tenues à jour par l’organisation, pas générées automatiquement."),

  h1("5. Acteurs et cas d’utilisation"),
  h2("5.1 Acteurs"),
  table(
    ["Acteur", "Description", "Authentification"],
    [
      ["Utilisateur (bénéficiaire)", "Personne qui consulte l’application pour s’informer, s’auto-évaluer et trouver de l’aide", "Aucune"],
      ["Administrateur", "Membre autorisé de l’organisation, chargé de gérer les contenus", "Email et mot de passe"],
      ["Système externe YouTube", "Héberge et diffuse les vidéos éducatives", "Lien public"],
    ],
    [2600, 4638, 2400]
  ),
  caption("Tableau 3 — Acteurs"),
  h2("5.2 Cas d’utilisation — utilisateur mobile"),
  table(
    ["ID", "Cas d’utilisation", "Résultat attendu"],
    [
      ["CU-U-01", "Consulter les thématiques et articles, y compris hors ligne", "Les articles publiés de la langue choisie s’affichent ; le cache local prend le relais sans réseau"],
      ["CU-U-02", "Visionner une vidéo YouTube intégrée", "Le lecteur s’ouvre ; un message clair s’affiche si le lien est invalide ou inaccessible"],
      ["CU-U-03", "Passer un quiz d’auto-évaluation", "L’utilisateur répond, voit la correction, le score et l’explication pédagogique"],
      ["CU-U-04", "Consulter l’annuaire des ressources d’aide", "Les fiches affichent type, ville et contacts ; appel et WhatsApp s’ouvrent lorsque fournis"],
      ["CU-U-05", "Configurer la langue FR/EN", "Le choix est conservé sur l’appareil et filtre les contenus affichés"],
    ],
    [1400, 3600, 4638]
  ),
  caption("Tableau 4 — Cas d’utilisation mobile"),
  h2("5.3 Cas d’utilisation — administrateur"),
  table(
    ["ID", "Cas d’utilisation", "Résultat attendu"],
    [
      ["CU-A-01", "S’authentifier sur le panel web", "Accès au tableau de bord ; refus si les identifiants sont invalides ou si le compte n’est pas administrateur"],
      ["CU-A-02", "Gérer les catégories (CRUD)", "Création, renommage, suppression ; suppression bloquée si des contenus y sont encore rattachés"],
      ["CU-A-03", "Gérer les articles (CRUD + publication)", "Brouillon, publication, retrait ; image et texte alternatif ; visibilité publique uniquement si publié"],
      ["CU-A-04", "Gérer la vidéothèque YouTube (CRUD + publication)", "Lien validé, métadonnées préremplies ou saisies, publication contrôlée"],
      ["CU-A-05", "Gérer les questions et options de quiz", "Question, 2 à 6 réponses, une seule bonne réponse, explication pédagogique"],
      ["CU-A-06", "Mettre à jour l’annuaire d’aide", "Fiches de structures (nom, type, ville, contacts) créées, modifiées ou supprimées"],
      ["CU-A-07", "Suivre l’inventaire éditorial", "Le tableau de bord affiche les totaux par type de contenu et par statut de publication"],
    ],
    [1400, 3600, 4638]
  ),
  caption("Tableau 5 — Cas d’utilisation administration"),
  h2("5.4 Scénarios de bout en bout"),
  h3("Scénario S1 — Publication d’un article"),
  numbered("L’administrateur se connecte au panel.", "s1"),
  numbered("Il crée ou sélectionne une catégorie.", "s1"),
  numbered("Il saisit le titre, le corps, la langue, l’image et le texte alternatif, puis enregistre en brouillon.", "s1"),
  numbered("Il publie l’article.", "s1"),
  numbered("L’utilisateur ouvre l’application, éventuellement après synchronisation, et lit l’article dans la langue choisie.", "s1"),
  h3("Scénario S2 — Retrait d’un contenu"),
  numbered("L’administrateur ouvre un article ou une vidéo publié.", "s2"),
  numbered("Il le passe à l’état « retiré ».", "s2"),
  numbered("L’enregistrement reste gérable dans le panel mais n’est plus proposé aux utilisateurs anonymes.", "s2"),
  h3("Scénario S3 — Aide d’urgence"),
  numbered("L’utilisateur ouvre l’onglet d’aide.", "s3"),
  numbered("Il consulte une ressource de sa ville ou du type recherché.", "s3"),
  numbered("Il lance un appel ou une conversation WhatsApp lorsque le contact est renseigné.", "s3"),

  h1("6. Exigences fonctionnelles — application mobile"),
  p("Les exigences ci-dessous sont testables. Elles concernent uniquement le client destiné aux bénéficiaires."),
  table(
    ["ID", "Exigence", "Priorité"],
    [
      ["RF-M-01", "L’application MUST être utilisable sans création de compte ni identification.", "P1"],
      ["RF-M-02", "L’application MUST afficher uniquement les contenus dont le statut est « publié ».", "P1"],
      ["RF-M-03", "L’application MUST proposer le français et l’anglais, et conserver le choix sur l’appareil.", "P1"],
      ["RF-M-04", "L’application MUST présenter un accueil avec thématiques et contenus récents.", "P1"],
      ["RF-M-05", "L’application MUST lister les articles par catégorie, avec recherche ou filtrage.", "P1"],
      ["RF-M-06", "L’application MUST afficher le détail d’un article (titre, image, corps) de façon lisible.", "P1"],
      ["RF-M-07", "L’application MUST lister les vidéos publiées et ouvrir un lecteur YouTube intégré.", "P1"],
      ["RF-M-08", "L’application MUST afficher un message explicite si une vidéo ne peut pas être lue.", "P1"],
      ["RF-M-09", "L’application MUST proposer un quiz : question, options, une bonne réponse, score et explication.", "P2"],
      ["RF-M-10", "L’application MUST afficher un annuaire de ressources avec type, ville et contacts.", "P2"],
      ["RF-M-11", "L’application MUST permettre d’ouvrir un appel téléphonique ou WhatsApp lorsque le lien est fourni.", "P2"],
      ["RF-M-12", "L’application MUST conserver en cache local les contenus déjà synchronisés pour une consultation hors ligne.", "P1"],
      ["RF-M-13", "L’application MUST indiquer clairement l’état hors ligne et resynchroniser au retour du réseau.", "P1"],
      ["RF-M-14", "L’application MUST rester utilisable avec un lecteur d’écran, des contrastes élevés et des zones tactiles suffisantes.", "P2"],
      ["RF-M-15", "L’application MUST NOT envoyer ni stocker de données de santé identifiantes vers le backend.", "P1"],
    ],
    [1400, 7038, 1200]
  ),
  caption("Tableau 6 — Exigences fonctionnelles mobile"),

  h1("7. Exigences fonctionnelles — panel d’administration"),
  table(
    ["ID", "Exigence", "Priorité"],
    [
      ["RF-A-01", "Le système MUST n’autoriser l’accès au panel et aux actions de gestion qu’aux comptes administrateurs authentifiés.", "P1"],
      ["RF-A-02", "Le système MUST fournir une connexion et une déconnexion, et protéger toutes les pages d’administration.", "P1"],
      ["RF-A-03", "Le système MUST permettre de créer, renommer et supprimer des catégories, et MUST empêcher la suppression d’une catégorie encore utilisée.", "P1"],
      ["RF-A-04", "Le système MUST permettre de créer, consulter, modifier, enregistrer en brouillon, publier, retirer et supprimer des articles (titre, corps, image, texte alternatif, catégorie, langue, statut).", "P1"],
      ["RF-A-05", "Le système MUST permettre d’envoyer et de remplacer l’image d’un article, avec texte alternatif obligatoire lorsqu’une image est présente.", "P1"],
      ["RF-A-06", "Le système MUST permettre de gérer des fiches vidéo (lien YouTube, catégorie, langue, titre, description, vignette, statut de publication).", "P1"],
      ["RF-A-07", "Le système MUST tenter de récupérer le titre et la vignette à partir d’un lien YouTube valide, et MUST autoriser la saisie manuelle si la récupération échoue.", "P2"],
      ["RF-A-08", "Le système MUST gérer des questions de quiz : catégorie, énoncé, options, exactement une bonne réponse, explication pédagogique.", "P2"],
      ["RF-A-09", "Le système MUST gérer des ressources d’aide : nom, type, ville, moyen de contact ; appel et WhatsApp optionnels.", "P2"],
      ["RF-A-10", "Le système MUST afficher un tableau de bord avec les totaux par type de contenu et les comptes par statut pour articles et vidéos.", "P3"],
      ["RF-A-11", "Le système MUST présenter des états de validation, d’erreur, de chargement et de liste vide lisibles.", "P1"],
      ["RF-A-12", "Le système MUST offrir une interface responsive, opérable au clavier, avec focus visible, contrastes suffisants et champs étiquetés.", "P1"],
      ["RF-A-13", "Le système MUST restreindre l’accès public aux seuls contenus publiés et réserver toutes les écritures aux administrateurs.", "P1"],
      ["RF-A-14", "Le système MUST NOT collecter ni gérer de données personnelles des utilisateurs de l’application mobile.", "P1"],
    ],
    [1400, 7038, 1200]
  ),
  caption("Tableau 7 — Exigences fonctionnelles administration"),
  h2("7.1 Règles de gestion éditoriale"),
  bullet("Statuts autorisés : brouillon, publié, retiré."),
  bullet("Un contenu publié a une date de publication renseignée ; un brouillon ou un contenu retiré n’en a pas."),
  bullet("Les langues de contenu sont fr et en."),
  bullet("Une question de quiz comporte 2 à 6 options et exactement une option correcte."),
  bullet("Un lien YouTube invalide, inaccessible ou non pris en charge est rejeté avec un message clair."),
  bullet("La suppression d’un élément destructif (catégorie utilisée, question, ressource) demande une confirmation."),

  h1("8. Exigences non fonctionnelles"),
  h2("8.1 Accessibilité"),
  bullet("RNF-01 — Contrastes visés au niveau WCAG AA pour les écrans principaux."),
  bullet("RNF-02 — Panel : navigation clavier complète pour la connexion et la création d’un article ; nom accessible sur les contrôles testés."),
  bullet("RNF-03 — Mobile : balises sémantiques pour TalkBack / VoiceOver sur les parcours principaux."),
  h2("8.2 Performance et usage"),
  bullet("RNF-04 — Un administrateur atteint le tableau de bord en moins de 30 secondes après une connexion réussie."),
  bullet("RNF-05 — Un administrateur crée et publie un contenu complet en 3 minutes maximum lorsque les informations sont prêtes."),
  bullet("RNF-06 — Listes d’administration paginées (au plus 25 éléments par page) ; écran principal utilisable en moins de 2 secondes sur un réseau large bande habituel."),
  bullet("RNF-07 — Le mobile affiche les contenus en cache sans délai bloquant lorsque le réseau est absent."),
  h2("8.3 Disponibilité et résilience"),
  bullet("RNF-08 — En cas d’absence de réseau, l’application mobile reste consultable pour les contenus déjà synchronisés et l’indique à l’utilisateur."),
  bullet("RNF-09 — Un échec d’envoi d’image ne doit pas publier un article cassé ; l’administrateur peut réessayer ou rester en brouillon."),
  h2("8.4 Sécurité"),
  bullet("RNF-10 — Aucune clé de rôle service n’est embarquée dans le client mobile ni dans le navigateur du panel."),
  bullet("RNF-11 — Chaque table exposée et chaque objet de stockage est protégé par des politiques d’accès (lecture publique limitée au publié ; écriture administrateur)."),
  bullet("RNF-12 — Une session expirée interrompt l’action d’administration et redemande une connexion, sans exposer de données protégées."),
  h2("8.5 Qualité logicielle"),
  bullet("RNF-13 — Le panel se construit sans erreur de typage et passe le linter du projet."),
  bullet("RNF-14 — L’application mobile passe l’analyse statique et les tests automatisés du dépôt."),
  bullet("RNF-15 — Un README décrit l’installation, la configuration du backend, le build et la recette manuelle."),

  h1("9. Architecture et contraintes techniques"),
  h2("9.1 Vue d’ensemble"),
  p("La plateforme s’organise en trois blocs : le client mobile, le panel web, et un backend managé unique. Les deux clients parlent au même schéma de données. Le mobile ne fait que lire les contenus publiés. Le panel authentifie l’administrateur et réalise les écritures."),
  table(
    ["Bloc", "Rôle", "Contrainte de réalisation"],
    [
      ["Application mobile", "Consultation anonyme, cache, quiz, aide", "Flutter ; pas de compte utilisateur"],
      ["Panel d’administration", "Gestion éditoriale et publication", "Application web React / TypeScript / Vite déjà amorcée"],
      ["Backend", "Données, auth, images, règles d’accès", "Supabase (PostgreSQL, Auth, Storage, RLS)"],
      ["Vidéos", "Diffusion des contenus audiovisuels", "YouTube ; pas d’upload de fichiers vidéo"],
    ],
    [2400, 3600, 3638]
  ),
  caption("Tableau 8 — Blocs d’architecture"),
  h2("9.2 Flux principaux"),
  p("Consultation : l’utilisateur ouvre un article ou une vidéo dans l’application ; le client interroge les tables publiées (ou le cache local) puis affiche le contenu."),
  p("Publication : l’administrateur saisit un article, une vidéo ou une catégorie dans le panel ; le backend enregistre l’opération après contrôle d’appartenance à la liste des administrateurs ; le contenu n’apparaît sur le mobile qu’une fois publié."),
  h2("9.3 Contraintes imposées au stage"),
  numbered("Conserver l’application web existante pour le panel ; ne pas introduire un second framework front-end.", "contr"),
  numbered("Utiliser Supabase comme backend ; ne pas développer une API métier parallèle.", "contr"),
  numbered("Activer la sécurité au niveau des lignes sur toutes les tables exposées.", "contr"),
  numbered("Limiter le premier livrable à un seul rôle administrateur.", "contr"),
  numbered("Respecter le principe de simplicité : toute dépendance supplémentaire doit justifier un besoin présent.", "contr"),

  h1("10. Données, confidentialité et sécurité"),
  h2("10.1 Entités métier"),
  table(
    ["Entité", "Rôle", "Champs essentiels"],
    [
      ["Administrateur", "Compte autorisé à gérer le panel", "Identifiant du compte authentifié"],
      ["Catégorie", "Regroupement thématique", "Nom, description optionnelle"],
      ["Article", "Fiche éducative bilingue", "Titre, corps, image, texte alternatif, catégorie, langue, statut"],
      ["Vidéo", "Fiche YouTube éducative", "URL, identifiant, titre, description, vignette, catégorie, langue, statut"],
      ["Question de quiz", "Item d’auto-évaluation", "Énoncé, explication, catégorie, langue, statut"],
      ["Option de quiz", "Réponse possible", "Texte, position, indicateur de bonne réponse"],
      ["Ressource d’aide", "Fiche d’orientation", "Nom, type, ville, téléphone, WhatsApp, description, langue, statut"],
    ],
    [2200, 2800, 4638]
  ),
  caption("Tableau 9 — Entités métier"),
  h2("10.2 Matrice d’accès"),
  table(
    ["Acteur", "Catégories", "Contenus éditoriaux", "Images d’articles"],
    [
      ["Visiteur anonyme (mobile)", "Références des contenus publiés", "Enregistrements publiés uniquement", "Images des articles publiés uniquement"],
      ["Compte authentifié non admin", "Aucun accès", "Aucun accès", "Aucun accès"],
      ["Administrateur autorisé", "CRUD complet", "CRUD complet", "CRUD complet"],
    ],
    [2600, 2346, 2346, 2346]
  ),
  caption("Tableau 10 — Matrice d’accès"),
  h2("10.3 Confidentialité"),
  p("L’application mobile n’exige pas de compte. Elle ne collecte pas de nom, d’adresse, de géolocalisation continue, ni de dossier de santé. Les scores de quiz restent sur l’appareil. Les ressources d’aide sont des informations institutionnelles (nom de structure, ville, contacts publics), pas des dossiers de bénéficiaires."),
  p("Les seuls comptes nominatifs sont ceux des administrateurs, créés par l’organisation. Les secrets de configuration ne sont pas versés dans le dépôt."),

  h1("11. Planning, jalons et livrables"),
  p("Le stage est organisé en six phases techniques, sur sept semaines, conformément au plan de réalisation."),
  table(
    ["Phase", "Durée", "Travaux", "Livrable", "Jalon"],
    [
      ["1. Architecture et fondations UI", "Semaine 1", "Projet mobile, thème accessible, navigation, localisation FR/EN, modèles et données de démonstration, dépôt Git", "Squelette navigable, changement de langue, données simulées", "Validation de l’architecture mobile"],
      ["2. Modules contenus", "Semaines 2-3", "Accueil, catalogue, détail d’article, cache d’images, vidéos YouTube", "Code Articles et Vidéos ; version alpha navigable", "Démonstration consultation et lecture vidéo"],
      ["3. Modules interactifs et accessibilité", "Semaine 4", "Quiz, annuaire d’aide, paramètres, sémantique d’accessibilité", "Application complète en mode hors ligne simulé", "Validation des écrans et de l’accessibilité"],
      ["4. Backend", "Semaine 5", "Projet Supabase, schéma, politiques d’accès, stockage, données initiales", "Schéma SQL, script d’initialisation, instance opérationnelle", "Validation base et sécurité"],
      ["5. Connexion mobile–backend", "Semaine 6", "Remplacement des données simulées, cache hors ligne, tests d’intégration", "Version bêta connectée ; rapport de tests", "Validation du flux dynamique"],
      ["6. Finalisation et build", "Semaine 7", "Panel d’administration, APK, README, nettoyage du dépôt, préparation de soutenance", "APK, panel, documentation, dépôt final", "Soutenance"],
    ],
    [1800, 1400, 2200, 2238, 2000]
  ),
  caption("Tableau 11 — Planning de réalisation"),
  h2("11.1 Livrables de fin de stage"),
  numbered("Application mobile Flutter, avec APK installable de démonstration.", "liv"),
  numbered("Panel d’administration web opérationnel.", "liv"),
  numbered("Schéma de données, politiques d’accès et bucket d’images.", "liv"),
  numbered("README d’installation, de configuration et de recette.", "liv"),
  numbered("Diagrammes (cas d’utilisation, séquences, modèle de données) et présent cahier des charges.", "liv"),
  numbered("Dépôt Git finalisé pour la soutenance.", "liv"),

  h1("12. Critères d’acceptation"),
  p("La recette est réussie si l’ensemble des critères suivants est vérifié, sans connaître le détail d’implémentation."),
  table(
    ["ID", "Critère", "Preuve"],
    [
      ["CA-01", "Un administrateur se connecte et atteint le tableau de bord en moins de 30 secondes", "Parcours chronométré"],
      ["CA-02", "Un administrateur crée et publie un article, une vidéo, une question de quiz et une ressource en 3 minutes chacun lorsque les contenus sont prêts", "Parcours chronométré"],
      ["CA-03", "100 % des tentatives d’accès au panel sans authentification sont refusées", "Recette de sécurité"],
      ["CA-04", "100 % des actions de gestion respectent les champs obligatoires et les règles de statut", "Recette fonctionnelle"],
      ["CA-05", "Un utilisateur clavier peut se connecter et créer un article sans souris", "Recette d’accessibilité panel"],
      ["CA-06", "Le tableau de bord reflète, après actualisation, les créations, publications, retraits et suppressions", "Comparaison listes / totaux"],
      ["CA-07", "Un utilisateur mobile sans compte lit un article publié, lance une vidéo, termine un quiz et ouvre une ressource d’aide", "Parcours mobile de bout en bout"],
      ["CA-08", "Un article retiré disparaît de l’application tout en restant gérable dans le panel", "Recette de publication"],
      ["CA-09", "Sans réseau, l’application affiche les contenus déjà synchronisés et signale l’état hors ligne", "Recette hors ligne"],
      ["CA-10", "Le changement de langue FR/EN est conservé et filtre les contenus affichés", "Recette de localisation"],
    ],
    [1200, 5438, 3000]
  ),
  caption("Tableau 12 — Critères d’acceptation"),
  h2("12.1 Cas limites à vérifier"),
  bullet("Lien YouTube invalide ou inaccessible : message clair ; saisie manuelle des métadonnées possible."),
  bullet("Question de quiz sans bonne réponse ou avec plusieurs bonnes réponses : enregistrement refusé."),
  bullet("Suppression d’une catégorie encore utilisée : opération bloquée."),
  bullet("Échec d’envoi d’image : pas d’article publié cassé."),
  bullet("Session administrateur expirée : action interrompue, reconnexion demandée, aucune donnée protégée exposée."),

  h1("13. Glossaire"),
  table(
    ["Terme", "Définition"],
    [
      ["SSR", "Santé sexuelle et reproductive"],
      ["VBG", "Violences basées sur le genre"],
      ["JaSanté", "Nom de la plateforme (application mobile + panel + backend)"],
      ["Bénéficiaire / utilisateur", "Personne qui consulte l’application sans compte"],
      ["Administrateur", "Personne autorisée à gérer les contenus via le panel"],
      ["Brouillon", "Contenu enregistré, non visible sur l’application"],
      ["Publié", "Contenu visible par les utilisateurs anonymes"],
      ["Retiré", "Contenu retiré de l’application, encore gérable dans le panel"],
      ["Annuaire d’aide", "Liste de structures et contacts d’orientation (santé, associations, assistance)"],
      ["RLS", "Contrôle d’accès au niveau des lignes de la base de données"],
      ["Hors ligne", "Usage de l’application sans réseau, à partir du cache local"],
    ],
    [2400, 7238]
  ),
  caption("Tableau 13 — Glossaire"),
  spacer(300),
  p("Fin du cahier des charges — JaSanté v1.0 — 24 août 2026.", { italics: true, color: MUTED, align: AlignmentType.CENTER }),
];

const doc = new Document({
  creator: "Stage ICT4D — JaSanté",
  title: "Cahier des charges — JaSanté",
  description:
    "Cahier des charges du stage : application mobile et panel d’administration pour l’éducation à la santé sexuelle et reproductive et la prévention des VBG.",
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 22, color: DARK },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: TEAL },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: CYAN },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: DARK },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "principes", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "obj", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "s1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "s2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "s3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "contr", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "liv", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: A4_W, height: A4_H },
          margin: { top: 1418, right: MARGIN, bottom: 1418, left: MARGIN },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: TEAL, space: 6 } },
              spacing: { after: 120 },
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                run("JaSanté  —  Cahier des charges", { size: 16, color: TEAL, bold: true }),
                run("\t"),
                run("Stage ICT4D", { size: 16, color: MUTED }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              border: { top: { style: BorderStyle.SINGLE, size: 6, color: LINE, space: 6 } },
              spacing: { before: 80 },
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              children: [
                run("Application mobile et panel d’administration  ·  SSR et prévention des VBG", { size: 16, color: MUTED }),
                run("\t"),
                run("Page ", { size: 16, color: MUTED }),
                new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: MUTED }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

const outDir = "C:\\Users\\patri\\Documents\\ICT4D\\stage";
const outFile = path.join(outDir, "Cahier_des_charges_JaSante.docx");
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outFile, buffer);
  const copy = path.join("C:\\Users\\patri\\Documents\\ICT4D\\stage\\JaSante_Admin", "Cahier_des_charges_JaSante.docx");
  fs.writeFileSync(copy, buffer);
  console.log("Wrote", outFile);
  console.log("Copy", copy);
});
