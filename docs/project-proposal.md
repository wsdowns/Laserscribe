# Project Proposal: Laserscribed & PowerScale

## 1. System Overview

**Laserscribed** is a centralized web-based community hub for laser engraving professionals and hobbyists. Its flagship application, **PowerScale**, is a crowd-sourced, version-controlled database for laser material settings.

Currently, laser settings are fragmented across Facebook groups, Reddit, and static spreadsheets. PowerScale solves this by providing a unified, searchable platform where users can discover, validate, and share machine-specific settings. The system uniquely bridges the gap between web applications and desktop software by natively importing and exporting **LightBurn (.clb)** XML library files.

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React (built with Vite) | User interface, in-browser .clb parsing |
| Styling | Tailwind CSS | Dark-themed responsive UI |
| Server State | TanStack Query | Data fetching, caching, synchronization |
| Client State | React Context | Cart/checkout state for .clb export |
| Backend | Go (REST API via Gin) | Business logic, .clb generation, auth |
| Database | MySQL | Persistent storage via sqlc |
| Authentication | JWT (JSON Web Tokens) | HTTP-only cookies, bcrypt password hashing |

---

## 2. Core Features

### In-Browser .clb Parsing
Users can drag-and-drop LightBurn library files. The React frontend locally parses the XML, extracts the settings, and stages them for bulk upload, eliminating manual data entry.

### "Add to Cart" LightBurn Export
Instead of downloading individual settings, users can use checkboxes to select multiple settings across different materials. A persistent "Checkout" bar aggregates these selections and triggers the Go backend to dynamically generate a single, unified .clb file for download.

### Faceted Data Discovery
High-performance filtering allowing users to cross-reference settings by **Material**, **Laser Type** (Diode, CO2, Fiber, UV), **Wattage**, and **Type of Marking** (Line, Fill, 3D Engrave, Image).

### Community Validation (Voting)
A gamified upvote/downvote system tied to authenticated user profiles ensures the most reliable settings rise to the top of the search results.

### Material Normalization
Backend logic that maps user-submitted material names (e.g., "3mm Plywood", "Birch 1/8") to a standardized canonical taxonomy to prevent database fragmentation.

---

## 3. Pages and User Flow

### A. The Dashboard / Search Hub (Home Page)

- **Search Interface:**
  - Material: Autocomplete text field (e.g., "Baltic Birch")
  - Type of Laser: Dropdown (Diode, CO2, Fiber, UV, Infrared)
  - Wattage: Dropdown (10W, 20W, 40W, 60W, 100W+)
  - Type of Marking: Dropdown (Line/Cut, Fill/Engrave, Offset Fill, Image, 3D Engrave/Sliced)
- **Results Table:** Displays matching settings sorted by community upvotes. Each row includes a checkbox for selection.
- **Detail Modal:** Clicking a row opens a modal mimicking LightBurn's "Cut Settings Editor" (showing Speed, Min/Max Power, Passes, Interval, Air Assist, etc.).
- **The "Checkout" Bar:** A sticky footer that appears when items are checked. Displays the total selected items and a "Download .clb Library" button.

### B. Authentication & Profile

- **Inline Login/Signup:** A self-contained panel on the home page. Users log in with Email/Password.
- **Profile Management:** Accessed via a top navigation dropdown. Allows users to change their password (requiring current password validation) and view a history of their contributed settings.

### C. The Contribution Dashboard (/contribute)

A split-screen interface offering two paths:

- **Path 1: Bulk Import (The Staging Area):** A dropzone for .clb files. Once dropped, a preview table appears. The user selects the Laser Type and Wattage globally for the imported list (since LightBurn .clb files don't store hardware info), then clicks "Publish to PowerScale."
- **Path 2: Manual Entry:** A standard web form mirroring LightBurn inputs for users who only want to contribute a single setting.

---

## 4. REST API Endpoints (Go)

| Method | Endpoint | Description | Auth Required? |
|--------|----------|-------------|----------------|
| POST | /api/auth/register | Creates a new user with a bcrypt-hashed password. | No |
| POST | /api/auth/login | Validates credentials and sets an HTTP-only JWT cookie. | No |
| GET | /api/auth/me | Validates the JWT cookie and returns user profile data. | Yes |
| PUT | /api/auth/password | Updates the user's password (requires current password). | Yes |
| GET | /api/materials | Retrieves the canonical taxonomy of materials. | No |
| GET | /api/settings | Fetches settings based on query params (?laser_type=CO2&wattage=60&marking_type=Fill). | No |
| POST | /api/settings | Accepts a JSON array (bulk) or object (single) to insert settings. | Yes |
| POST | /api/settings/{id}/vote | Casts an upvote/downvote for a specific setting. | Yes |
| POST | /api/export/lightburn | Accepts an array of setting_ids, aggregates data, returns .clb XML. | No |

---

## 5. Database Schema (MySQL)

The relational structure captures the specific hardware context (Laser Type) alongside the operation.

### 1. users Table

| Column | Type | Notes |
|--------|------|-------|
| id | PK, BIGINT | |
| email | VARCHAR, Unique | |
| password_hash | VARCHAR | bcrypt |
| display_name | VARCHAR | |
| created_at | TIMESTAMP | |

### 2. materials Table (The Canonical List)

| Column | Type | Notes |
|--------|------|-------|
| id | PK, BIGINT | |
| name | VARCHAR | e.g., "Baltic Birch" |
| thickness_mm | DECIMAL | |
| category | VARCHAR | e.g., "Wood", "Acrylic", "Metal" |

### 3. material_settings Table (The Core Data)

| Column | Type | Notes |
|--------|------|-------|
| id | PK, BIGINT | |
| user_id | FK, BIGINT | Extracted securely from JWT |
| material_id | FK, BIGINT | |
| laser_type | ENUM | 'Diode', 'CO2', 'Fiber', 'UV', 'Infrared' |
| machine_wattage | INT | e.g., 20, 60 |
| marking_type | ENUM | 'Line', 'Fill', 'Offset Fill', 'Image', '3D Engrave' |
| speed | DECIMAL | Stored strictly as mm/sec |
| min_power | DECIMAL | |
| max_power | DECIMAL | |
| passes | INT | |
| interval_mm | DECIMAL | Used for Scan DPI calculation |
| z_offset | DECIMAL | |
| air_assist | BOOLEAN | |
| votes_score | INT | Cached aggregate of upvotes/downvotes |
| created_at | TIMESTAMP | |

### 4. votes Table (To prevent duplicate voting)

| Column | Type | Notes |
|--------|------|-------|
| id | PK, BIGINT | |
| user_id | FK, BIGINT | |
| setting_id | FK, BIGINT | |
| vote_value | INT | +1 or -1 |
