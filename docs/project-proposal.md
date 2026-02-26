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

Settings are identified by **laser type + wattage** rather than a specific machine brand/model. This matches how LightBurn .clb files work — they encode laser parameters, not machine identity. A 60W CO2 setting works on any 60W CO2 machine regardless of manufacturer.

### 1. users

| Column | Type | Notes |
|--------|------|-------|
| id | PK, INT | |
| username | VARCHAR(50), Unique | |
| email | VARCHAR(255), Unique | |
| password_hash | VARCHAR(255) | bcrypt |
| display_name | VARCHAR(100) | |
| created_at | TIMESTAMP | |

### 2. material_categories

| Column | Type | Notes |
|--------|------|-------|
| id | PK, INT | |
| name | VARCHAR(100), Unique | e.g., "Wood", "Acrylic", "Metal" |

### 3. materials

| Column | Type | Notes |
|--------|------|-------|
| id | PK, INT | |
| category_id | FK → material_categories | |
| name | VARCHAR(200) | e.g., "3mm Birch Plywood" |
| slug | VARCHAR(200), Unique | URL-safe identifier |

### 4. material_aliases

| Column | Type | Notes |
|--------|------|-------|
| id | PK, INT | |
| material_id | FK → materials | |
| alias | VARCHAR(200) | e.g., "1/8 Inch Birch Plywood", "Baltic Birch 3mm" |

### 5. settings (The Core Data)

Maps 1:1 to LightBurn `.clb` CutSetting fields. See `docs/lightburn-clb-format.md` for field details.

| Column | Type | Notes |
|--------|------|-------|
| id | PK, INT | |
| user_id | FK → users | Extracted securely from JWT |
| material_id | FK → materials | |
| laser_type | ENUM | 'CO2', 'Fiber', 'Diode', 'UV', 'Infrared' |
| wattage | INT | e.g., 20, 60 |
| operation_type | ENUM | 'Cut' (Line), 'Scan' (Fill), 'ScanCut' (Fill+Line) |
| max_power | DECIMAL(7,3) | 0-100% |
| min_power | DECIMAL(7,3) | Default 0 |
| max_power2 | DECIMAL(7,3) | Nullable. Second laser max power |
| min_power2 | DECIMAL(7,3) | Nullable. Second laser min power |
| speed | DECIMAL(10,3) | mm/s |
| num_passes | INT | Default 1 |
| z_offset | DECIMAL(8,3) | Nullable |
| z_per_pass | DECIMAL(8,3) | Nullable |
| scan_interval | DECIMAL(8,4) | Nullable. Scan line spacing in mm |
| angle | DECIMAL(7,3) | Nullable. Scan angle in degrees |
| angle_per_pass | DECIMAL(7,3) | Nullable. Angle increment per pass |
| cross_hatch | BOOLEAN | Default FALSE |
| bidir | BOOLEAN | Default TRUE. Bidirectional scanning |
| scan_opt | VARCHAR(50) | Nullable. "mergeAll", "byGroup", "individual" |
| flood_fill | BOOLEAN | Default FALSE |
| auto_rotate | BOOLEAN | Default FALSE |
| overscan | DECIMAL(8,3) | Nullable |
| overscan_percent | DECIMAL(7,3) | Nullable |
| frequency | DECIMAL(12,3) | Nullable. Pulse frequency in Hz (fiber/galvo) |
| wobble_enable | BOOLEAN | Nullable. Fiber laser wobble mode |
| use_dot_correction | BOOLEAN | Nullable. Galvo dot correction |
| kerf | DECIMAL(8,4) | Nullable. Kerf offset in mm |
| run_blower | BOOLEAN | Nullable. Air assist |
| layer_name | VARCHAR(200) | Nullable |
| layer_subname | VARCHAR(200) | Nullable |
| priority | INT | Nullable |
| tab_count | INT | Nullable |
| tab_count_max | INT | Nullable |
| notes | TEXT | Nullable. User notes (not from CLB) |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | Auto-updated |

**Unique constraint:** `(user_id, material_id, operation_type, laser_type, wattage)`

### 6. votes

| Column | Type | Notes |
|--------|------|-------|
| id | PK, INT | |
| user_id | FK → users | |
| setting_id | FK → settings | |
| value | TINYINT | +1 or -1 |
| created_at | TIMESTAMP | |

**Unique constraint:** `(user_id, setting_id)`

---

## 6. Future Considerations

### Machine Brands & Models

The initial build intentionally omits machine brand and model tables. Settings are discoverable by laser type and wattage alone, which is sufficient for cross-machine compatibility.

When the community grows, we may add brand/model tables with an **alias system** (similar to material aliases) to normalize inconsistent naming conventions (e.g., "OMTech" vs "omtech" vs "Om Tech", "Gweike G2 50" vs "G2 50 Max"). This would enable browsing by machine ("show me all settings for my Gweike G2") without blocking uploads or requiring exact name matches. Brand/model would remain optional metadata on settings — never a required foreign key.
