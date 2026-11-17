# Arbre de décision des outils IA

> Apprendre à **penser l'IA** avant de l'utiliser. Un outil de raisonnement, pas un catalogue.

## Intention pédagogique

Cette web application n'est pas un catalogue d'outils. C'est un **outil de raisonnement** qui aide les utilisateurs à :

- Partir d'un **besoin professionnel réel**
- Appliquer une **logique de décision outillée**
- Dérouler un **workflow reproductible et contrôlé**
- Intégrer en permanence les **limites cognitives, techniques et éthiques** de l'IA

## Fonctionnalités

### Parcours 1 – Décision rapide (≈ 30 secondes)
- Sélection d'un besoin métier via des tuiles visuelles
- Recommandation immédiate : 1 outil principal + 1 alternative + 1 option souveraine
- Fiche synthèse décisionnelle complète

### Parcours 2 – Workflow guidé (≈ 3 à 8 minutes)
Déroulé pas à pas en 6 étapes :
1. **Préparer** – Objectif, données, cadre
2. **Produire** – Outil + prompt + méthode
3. **Vérifier** – Biais, erreurs, hallucinations
4. **Ajuster** – Itérations humaines
5. **Diffuser** – Format, traçabilité, responsabilité
6. **Capitaliser** – Prompt, méthode, retour d'expérience

### Glossaire intégré
Termes techniques expliqués simplement : RAG, Tokens, Hallucinations, Prompt, RCTI, etc.

## Besoins couverts

| Besoin | Description |
|--------|-------------|
| ✍️ Rédiger | Mail, note, courrier, CR, discours |
| 📋 Synthétiser | Dossier, rapports, réunions |
| 🔍 Rechercher & vérifier | Veille, sources, croisement |
| 🗂️ Connaissance projet | Corpus, RAG, base documentaire |
| 🎯 Présenter | Slides, supports visuels |
| ⚙️ Automatiser | Workflows, agents, intégrations |
| 🎙️ Compte-rendu réunion | Transcription, synthèse, CR automatisé |
| 📱 Plaud & enregistreurs IA | Enregistrement physique, transcription |
| 🚨 Gestion de crise | Guidelines, todolist, matrice |
| 🎬 Multimodal | Audio, transcription, vidéo, images |
| 👥 RH & organisation | Process, cadres, chartes, fiches de poste |
| 🎨 Créer des visuels | Illustration, images, inspiration |
| 🧠 Métaprompt | Faire créer un prompt expert par l'IA |
| 📊 Analyser des données | Tableaux, budgets, enquêtes, indicateurs |
| ♿ Langage clair & FALC | Simplifier un courrier, un formulaire, une info usager |
| 🤖 Agent IA | Déléguer une tâche multi-étapes (avec garde-fous) |

## Outils référencés

- **OpenAI** : ChatGPT, GPTs, Canvas, ChatGPT Images
- **Anthropic** : Claude 3.5 / Claude 4
- **Google** : Gemini, Gems, Gemini Notebook (ex-NotebookLM)
- **Mistral AI** : Mistral Vibe, ex-Le Chat (solution souveraine française)
- **Autres** : Perplexity, Gamma, Copilot, Plaud

## Stack technique

- **HTML** unique (Single Page App)
- **JavaScript** vanilla
- **Tailwind CSS** via CDN
- **Données** en JSON externe (`data.json`)
- **Déploiement** : GitHub Pages

Aucun backend requis. Zéro dépendance npm.

## Philosophie No-Code

Ce projet est construit en **vibe coding** avec Claude Code :
- Code lisible et compréhensible par des non-développeurs
- Modifications possibles sans compétences techniques avancées
- Démonstration de la co-construction humain / IA

## Rappel permanent

> ⚠️ L'IA peut produire des erreurs (hallucinations), des biais, et n'est jamais déterministe. La responsabilité finale reste humaine.

### Règles d'or secteur public
- Pas de données nominatives non cadrées
- Pas de décision automatisée
- Traçabilité minimale requise

## Structure des fichiers

```
/
├── index.html      # Application complète
├── data.json       # Données des recommandations et glossaire
└── README.md       # Ce fichier
```

## Utilisation

1. Cloner le repository
2. Ouvrir `index.html` dans un navigateur
3. Ou déployer sur GitHub Pages

```bash
git clone https://github.com/y-kerauffret/wepapp_formationIA.git
cd wepapp_formationIA
open index.html
```

## Auteur

**Yannick Kerauffret** – Formateur IA pour les collectivités territoriales

## Licence

Projet à usage pédagogique.

---

*Construit avec Claude Code – Anthropic*
