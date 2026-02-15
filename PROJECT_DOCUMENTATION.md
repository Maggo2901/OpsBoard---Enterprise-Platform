# PROJEKT DOKUMENTATION: OPSBOARD ENTERPRISE PLATFORM

## 1. Executive Summary

### Überblick
OpsBoard - Enterprise Platform ist eine leichtgewichtige, selbst gehostete Projektmanagement-Lösung, die speziell für den internen Einsatz auf Oracle Linux VM-Umgebungen entwickelt wurde. Die Anwendung ermöglicht Teams die visuelle Organisation von Aufgaben nach der Kanban-Methodik (To Do, In Progress, Done).

### Zweck
Ersatz für Excel-basierte oder externe Task-Tracker durch eine datenschutzkonforme, performante On-Premise Lösung ohne externe Abhängigkeiten.

### Zielgruppe
Interne Betriebsteams, Entwickler und Projektmanager innerhalb einer geschlossenen Netzwerkinfrastruktur (Intranet/VPN).

### Technologiestack (High-Level)
*   **Frontend**: React 18 (Vite)
*   **Backend**: Node.js (Express)
*   **Datenbank**: SQLite (Embedded, Zero-Config)
*   **Deployment**: Podman Container (Docker-kompatibel)

---

## 2. Systemarchitektur

### Frontend Architektur
*   **Framework**: Single Page Application (SPA) basierend auf React 18 und Vite.
*   **Styling**: Tailwind CSS für Utility-First Design.
*   **State Management**:
    *   Lokaler React State (`useState`, `useReducer`) für UI-Logik.
    *   **Context API** (`AuthContext`) für globales Session-Management.
*   **Kommunikation**: Axios HTTP Client. Ein zentraler **Interceptor** normalisiert API-Antworten und packt das `{ success: true, data: [...] }` Format automatisch aus.
*   **Interaktivität**: `@dnd-kit` für performantes Drag & Drop (DnD) mit optimistischen UI-Updates.

### Backend Architektur
*   **Runtime**: Node.js Umgebung.
*   **Webserver**: Express.js REST API.
*   **Struktur**: Monolithischer Aufbau mit Controller-Pattern (`MVC` ohne View).
    *   `controllers/`: Geschäftslogik.
    *   `routes/`: API Endpoint Definitionen.
    *   `middleware/`: Upload-Handling, Error-Handling, Logging.
*   **Fehlerbehandlung**: Zentralisierte Error-Middleware für konsistente JSON-Antworten.

### Datenfluss
1.  Frontend initiiert Request (z.B. Task verschieben).
2.  Frontend aktualisiert UI sofort (**Optimistic Update**).
3.  Request geht via Nginx Reverse Proxy an Backend Container.
4.  Backend validiert Input und schreibt synchron (WAL-Mode) in SQLite.
5.  Bei Erfolg: Stille Bestätigung.
6.  Bei Fehler: Frontend fängt Exception, zeigt Alert und führt **Rollback** durch (`setRefreshTrigger`).

---

## 3. Technologiestack

### Core Components
| Bereich | Technologie | Version | Beschreibung |
| :--- | :--- | :--- | :--- |
| **Frontend** | React | 18.x | UI Library |
| **Build Tool** | Vite | Latest | HMR & Production Build |
| **Styling** | Tailwind CSS | 3.x | CSS Framework |
| **Icons** | Lucide React | Latest | SVG Icon Set |
| **Backend** | Node.js | 18-Alpine | Runtime Environment |
| **API Framework** | Express | 4.x | Webserver |
| **Datenbank** | SQLite | 3.x | via `better-sqlite3` |
| **Uploads** | Multer | Latest | Multipart Form Data Handling |

### Infrastructure
| Komponente | Technologie | Beschreibung |
| :--- | :--- | :--- |
| **Container Engine** | Podman | Daemonless Container Engine (RHEL Standard) |
| **Orchestrator** | Podman Compose | Docker Compose Kompatibilität |
| **Frontend Server** | Nginx | Alpine-basiert, Reverse Proxy, Static File Serving |

---

## 4. Datenbank Struktur

Die Datenbank ist eine relationale SQLite-Datei (`database.sqlite`), die im Write-Ahead-Logging (WAL) Modus betrieben wird, um höherer Concurrency standzuhalten.

### Tabellen & Beziehungen

1.  **`users`**
    *   `id` (PK), `name` (Unique)
    *   Dient aktuell als Referenz für `created_by` und Activity Logs.

2.  **`boards`**
    *   `id` (PK), `name`
    *   Root-Entity für Projekte.

3.  **`columns`**
    *   `id` (PK), `name`, `position`, `board_id` (FK -> `boards`)
    *   Definiert den Workflow (z.B. To Do -> Done).

4.  **`tasks`**
    *   `id` (PK), `title`, `description`, `priority`, `due_date`, `archived`
    *   `column_id` (FK -> `columns`), `board_id` (FK -> `boards`), `created_by` (FK -> `users`)
    *   Kernsdatensatz.

5.  **`labels`**
    *   `id` (PK), `name`, `color`
    *   Globale Label-Definitionen.

6.  **`task_labels`** (Junction Table)
    *   `task_id` (FK), `label_id` (FK)
    *   Many-to-Many Beziehung zwischen Tasks und Labels.

7.  **`attachments`**
    *   `id` (PK), `filename` (UUID), `original_name`, `path`
    *   `task_id` (FK -> `tasks`)

8.  **`activity_logs`**
    *   `id` (PK), `action`, `details`, `timestamp`
    *   `task_id` (FK -> `tasks`), `user_id` (FK -> `users`)
    *   Audit Trail für Änderungen.

### Konfiguration
*   **Foreign Keys**: Enforced (`PRAGMA foreign_keys = ON`).
*   **Indizes**: Vorhanden auf FK-Spalten und Suchfeldern (`archived`, `updated_at`) für Performance.

---

## 5. API Dokumentation

Alle Endpoints liefern standardmäßig JSON im Format: `{ success: true, data: ... }` oder `{ success: false, message: "Error" }`.

### Boards
*   `GET /api/boards` - Liste aller Boards.
*   `GET /api/boards/:id` - **Deep Fetch**: Board + Spalten + Tasks + Labels + Logs.
*   `POST /api/boards` - Erstellt neues Board (mit Default-Spalten).
*   `PUT /api/boards/:id` - Umbenennen.
*   `DELETE /api/boards/:id` - Löscht Board (Kaskadierend).

### Columns
*   `POST /api/columns` - Neue Spalte erstellen.
*   `PUT /api/columns/:id` - Spalte umbenennen.
*   `POST /api/columns/reorder` - Batch-Update der Spalten-Positionen.

### Tasks
*   `POST /api/tasks` - Task erstellen.
*   `PUT /api/tasks/:id` - Task Details update.
*   `PATCH /api/tasks/:id/move` - Task in neue Spalte verschieben (DnD).
*   `PATCH /api/tasks/:id/archive` - Task archivieren (Soft Delete).
*   `PATCH /api/tasks/:id/restore` - Task wiederherstellen.
*   `GET /api/archived-tasks?board_id=X` - Archivierte Tasks laden.
*   `POST /api/tasks/:id/attachments` - Datei hochladen.

### Users
*   `GET /api/users` - Alle User laden.
*   `POST /api/users` - User registrieren (einfach).

---

## 6. Feature Übersicht

| Feature | Beschreibung |
| :--- | :--- |
| **Drag & Drop** | Flüssiges Verschieben von Tasks zwischen Spalten und Umsortieren von Spalten selbst. |
| **Anhänge** | Upload beliebiger Dateitypen (bis 50MB). Speicherung mit UUID zur Kollisionsvermeidung. |
| **Labels** | Farbige Tags zur Kategorisierung (Many-to-Many), verwaltbar im Task-Modal. |
| **Aktivitäts-Log** | Automatische Protokollierung von Erstellung, Verschiebung, Updates und Uploads pro Task. |
| **Archivierung** | "Soft Delete" für Tasks, um das Board sauber zu halten. Separate Wiederherstellungs-Ansicht. |
| **Suche & Filter** | Client-seitige Volltextsuche im Header (filtert Titel & Beschreibung). |
| **Dark Mode** | Modernes UI mit Slate/Zinc Farbpalette, optimiert für lange Nutzung. |

---

## 7. Sicherheitskonzept

### 1. Upload Sicherheit
Das Upload-System wurde für Flexibilität im Intranet konzipiert, enthält aber Basis-Schutzmechanismen:
*   **Dateinamen**: Werden zu UUIDs randomisiert. Keine Pfadtraversierung möglich.
*   **Download-Zwang**: Dateien werden via `Content-Disposition: attachment` ausgeliefert.
    *   *Effekt*: HTML/JS-Dateien werden heruntergeladen statt im Browser ausgeführt (XSS-Schutz).
*   **Sperren**: Keine Dateitypen blockiert (Anforderung), aber 50MB Size Limit.

### 2. Authentifizierung ("Soft Auth")
*   **Status**: Das Frontend simuliert eine Session (`localStorage`).
*   **Risiko**: Das Backend validiert **keine** Tokens. Jeder im Netzwerk kann API-Calls absetzen.
*   **Mitigation**: Einsatz nur in vertrauenswürdigen Netzwerken (VPN/LAN) hinter Firewall.

### 3. Netzwerk
*   **CORS**: Restriktiv konfiguriert über `CORS_ORIGIN` Env-Variable.
*   **Isolation**: Backend und DB laufen in internen Containern ohne direkten Public-Access. Nur Nginx Port 8080 ist exponiert.

---

## 8. Performance Analyse

### Stärken
*   **Vite Build**: Extrem optimiertes Frontend-Asset-Bundle (Gzip, Minification).
*   **SQLite WAL**: Sehr schnelle Lesezugriffe, da das File-System der einzige Bottleneck ist.

### Schwächen / Bottlenecks
*   **N+1 Query Problem**: Beim Laden eines Boards (`getBoardDetails`) wird für jeden Task eine separate Query für Labels und Attachments gefeuert.
    *   *Skalierung*: Bei >500 Tasks pro Board spürbare Verzögerung beim Initial-Load.
*   **Full State Update**: Ein DnD-Move löst oft ein komplettes Re-Fetching des Boards aus, um Konsistenz zu garantieren.

---

## 9. Deployment Architektur

Das System ist als Multi-Container Applikation via Podman Compose definiert.

### Container 1: `opsboard-enterprise-backend`
*   **Image**: `node:18-alpine` (Minimal footprint).
*   **Environment**: `NODE_ENV=production`, `DB_PATH`, `PORT`.
*   **Volumes**:
    *   `opsboard-enterprise-data`: Persistenter Speicher für `database.sqlite`.
    *   `opsboard-enterprise-uploads`: Speicher für hochgeladene Dateien.

### Container 2: `opsboard-enterprise-frontend`
*   **Image**: `nginx:alpine`.
*   **Funktion**:
    1.  Liefert statische React-Files aus `/usr/share/nginx/html`.
    2.  **Reverse Proxy**: Leitet `/api/*` und `/uploads/*` an den Backend-Container weiter.
*   **Ports**: Exponiert Port 80 (gemappt auf Host 8080).

### Netzwerk
Frontend und Backend teilen sich ein internes Podman-Netzwerk. Frontend spricht Backend über den Hostnamen `opsboard-enterprise-backend` an.

---

## 10. Produktionsreife Bewertung (Score: 7/10)

### Geeignet für:
*   Interne Firmenteams (< 50 User).
*   Projekte mit moderatem Aufgabenvolumen (< 2000 Tasks/Board).
*   Umgebungen mit strikter Netzetrennung (kein Public Internet Access).

### Nicht geeignet für:
*   Öffentliche SaaS-Angebote (Fehlende Auth-Härtung).
*   Hochlast-Szenarien oder verteilte Datenbank-Bedürfnisse (SQLite Limitierung).

### Fazit
Das System ist "Production Ready" im Sinne von Stabilität, Deployment-Automatisierung und Usability. Es ist jedoch sicherheitstechnisch für den *internen* Gebrauch (Intranet) ausgelegt.

---

## 11. Zukunftserweiterungen

Folgende Schritte werden für Version 2.0 empfohlen:

1.  **Backend Auth**: Implementierung von JWT-Validierung oder Passport.js Middleware im Express-Backend.
2.  **Performance**:
    *   Refactoring von `getBoardDetails` auf effiziente SQL `JOIN`s statt Loops.
    *   Implementierung von Paginierung für Archiv und Logs.
3.  **Datenbank**: Optionale Unterstützung für PostgreSQL via Prisma oder Sequelize für größere Deployments.
4.  **Monitoring**: Health-Check Endpoint (`/health`) ist vorhanden, kann an Uptime-Kuma oder Prometheus angebunden werden.
