# Atlas Crowd Shield — Front-end

Console d'opérations + admin + vue supporter mobile pour une plateforme IA de sécurité de stade.

**Frontend pur (React + Vite).** Toutes les données sont du mock côté client — branchez votre backend en remplaçant les seeds dans `src/lib/data.js` et les fonctions de sauvegarde des pages Admin par des appels API.

---

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvre [http://localhost:5173](http://localhost:5173).

### Identifiants de démo

| Email             | Mot de passe |
| ----------------- | ------------ |
| `admin@atlas.ma`  | `atlas2025`  |

La session est persistée dans `localStorage` (clé `atlas.auth`). Le bouton de déconnexion est en haut à droite.

---

## Architecture

```
src/
├── main.jsx               Bootstrap React (StrictMode + createRoot)
├── App.jsx                Shell d'auth + router hash + NavBar global
├── index.css              Design tokens (couleurs/fonts/radii/shadows) + base
│
├── lib/
│   ├── router.js          useHashRouter — routing par #/segment (zéro deps)
│   ├── icons.jsx          Icônes SVG inline (Shield, Bell, Camera, …)
│   ├── flags.js           Drapeaux pays (MA, SN, CI, EG, …)
│   └── data.js            Seed data : stadiums, matches, gates, cameras, agents, events
│
├── components/            Composants réutilisables
│   ├── NavBar.jsx         Logo + 3 onglets + horloge live + avatar + logout
│   ├── Modal.jsx          Overlay + body, fermeture overlay/X/Echap
│   ├── Toast.jsx          Toast vert bottom-right, auto-disparition 3s
│   ├── Badge.jsx          ok / warn / crit / info / mute
│   ├── Button.jsx         primary / danger / ghost / outline
│   ├── FormField.jsx      TextField / NumberField / SelectField / TextArea / Toggle / Slider
│   ├── RadialKPI.jsx      Jauge radiale risque global avec dégradé vert→rouge
│   ├── StadiumIso.jsx     Stade isométrique 6 secteurs colorés + pulse d'alerte
│   ├── StadiumMini.jsx    Mini vue stade pour mobile Reports
│   ├── AreaChart.jsx      Chart live aire + ligne seuil 75 (rafraîchit toutes les 3s)
│   ├── Sparkline.jsx      Mini graph dans zone cards
│   ├── ZoneCard.jsx       Carte par porte (risk %, sparkline, occupancy bar)
│   ├── EventLog.jsx       Journal d'événements live (nouvel event toutes les 8s)
│   └── StatsBar.jsx       4 stats bas de page (supporters, agents, …)
│
└── pages/
    ├── Login.jsx          Logo + email + password + creds démo affichés
    ├── Ops.jsx            Hero alerte + KPI radial + stade + chart + zones + event log + stats
    ├── Admin.jsx          Sidebar 5 sections + content area
    ├── Reports.jsx        Vue mobile 480px supporter (match, alerte, porte, stade, alertes, infos)
    └── admin/
        ├── Matchs.jsx     Table + wizard 3 étapes + modals delete/QR/view
        ├── Cameras.jsx    8 cartes + add/edit/flux/delete
        ├── Agents.jsx     Table 6 lignes + add/edit/delete
        ├── Portes.jsx     6 cartes + cycle OUVERT/RESTREINT/FERMÉ + edit
        └── Parametres.jsx Sliders + toggles + selects + statut système
```

---

## Pages

### `#/login`
Logo Atlas + formulaire email/password. Identifiants démo affichés dans la card. Shake sur soumission vide. Redirection vers `/ops` après succès.

### `#/ops` — Security Ops
- **Hero d'alerte** rouge avec compte à rebours `07:00` (tick chaque seconde) + boutons DISPATCH / Acknowledge
- **KPI radial** (jauge globale, oscille ±2 pts toutes les 5s)
- **Stade isométrique** 6 secteurs colorés + ring pulsant sur la zone en alerte
- **Area chart** 90 secondes glissantes (nouveau point toutes les 3s)
- **6 zone cards** (porte, risk %, sparkline, occupancy)
- **Event log live** (nouvel événement toutes les 8s)
- **Stats bar** : supporters, agents, incidents évités, caméras

### `#/admin` (et sous-routes `/matchs`, `/cameras`, `/agents`, `/portes`, `/parametres`)
- **Matchs** : table + wizard 3 étapes
  - Étape 1 : équipes (drapeaux), compétition, date, stade (auto-remplit capacité/caméras/portes)
  - Étape 2 : capacités, 6 portes config (localisation/secteur/actif), seuils critique/warning, refresh IA
  - Étape 3 : agents total, distribution par porte avec progress bar, responsable, plan évac, notes
  - Modals : QR (faux QR déterministe + URL `atlas.ma/match/xxx` copiable), Détails, Supprimer
- **Caméras** : 8 cartes, badge ACTIVE/OFFLINE, toggle in-place, modal flux (faux feed bruité), add/edit avec lat/lng
- **Agents** : table 6 agents (DEPLOYED / STANDBY / OFF), add/edit/delete
- **Portes** : 6 cartes, bouton statut full-width qui cycle OUVERT → RESTREINT → FERMÉ, edit avec checkboxes caméras
- **Paramètres** : 2 colonnes — config (seuils, notifications, sécurité) + statut système (services, uptime, restart IA)

### `#/reports`
Vue mobile 480px centrée. Header match (score live + minute qui s'incrémente), bannière alerte avec countdown, carte porte qui cycle SAFE → WARNING → CRITICAL toutes les 8s, mini stade SVG (porte du supporter en surbrillance), feed alertes, infos pratiques, footer.

---

## Brancher votre backend

Tous les fichiers Admin gardent leur état localement via `useState`. Pour brancher une API :

1. Remplacez les seeds importés depuis `lib/data.js` par des `useEffect(() => { fetch(...) }, [])`
2. Dans les handlers `save` / `delete` / `toggleStatus`, remplacez les `setState` par des appels POST/PATCH/DELETE puis re-fetch
3. Le `useToast()` est déjà en place pour afficher les retours backend

L'auth (`src/App.jsx`) stocke `{ email, name, role }` dans `localStorage`. À remplacer par un token JWT + intercepteur `fetch`.

---

## Design tokens

Tout est dans `src/index.css` sous `:root`. Aucun framework UI — juste des CSS variables :

- `--accent` / `--accent-2` / `--accent-deep` — bleu électrique
- `--red` / `--orange` / `--green` (+ variantes `-2`)
- `--bg-0` à `--bg-elev` — paliers de fond
- `--fg-0` à `--fg-3` — paliers de texte
- `--font-ui` (Manrope) / `--font-mono` (JetBrains Mono)
- `--r-sm` à `--r-2xl` — radii

Pour changer l'accent global, modifiez les 4 variables `--accent*` dans `:root`.

---

## Dépendances

```
react@18.3.1
react-dom@18.3.1
vite@5.4.10
@vitejs/plugin-react@4.3.4
```

**Aucune autre dépendance.** Pas de react-router (hash router maison), pas de bibliothèque UI, pas de bibliothèque de charts (SVG inline), pas d'icon set externe (SVG inline).
