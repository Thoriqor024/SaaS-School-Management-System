# SiswaHub — Multi-school Management Platform

A SaaS school management system for a group of schools and their branches. It is the **core central database** for students, teachers, staff and general employees, plus operational modules that supplement the existing legacy systems.

Built with **Laravel 11 · Inertia.js · React 18 · Tailwind CSS 3 · SQLite/MySQL**.

---

## What is inside

| Area | Capabilities |
| --- | --- |
| **Global identity (HRD)** | Students with guardian profiles, teachers/staff/general employees, UUID keys, RBAC, school + branch scoping |
| **Assets & inventory** | Categories, fixed assets and consumables, quantity, condition, status, location, assigned employee, branch |
| **Transport** | Fleet (plate, capacity, tax/insurance), routes with ordered stops, driver assignment, student passengers, daily pickup/drop-off logs |
| **Library** | Book catalog with barcode field, categories, student/staff memberships with loan limits, issue/return circulation, overdue tracking, printable Code 128 + QR labels and a scanner lookup page |
| **Clinic** | Visit log with vitals and disposition, allergy/chronic-condition medical records, medicine stock with dispensing that decrements stock |
| **Mess / cafeteria** | Daily menus with menu items, kitchen inventory with restock + expiry, meal logs per branch and 7-day trend |
| **Dashboard & reports** | Headcount cards, inventory condition, active routes, clinic visits, library activity, per-school breakdown, cross-module report page with print, CSV and PDF export |
| **Profiles** | Photo upload for students and employees (public disk, remove/replace), with initials fallback |

**Intentionally excluded:** fee collection, invoicing, accounting/payroll and dormitory allocation. Those remain in the legacy systems and integrate with this platform through the integration API (students and employees support writes; operational modules are read-only).

---

## Requirements

- PHP **8.2+** with `pdo_sqlite`, `mbstring`, `dom`, `curl`, `zip`, `bcmath`
- Composer 2
- Node.js 18+ and npm
- SQLite (default, zero configuration) or MySQL/PostgreSQL

## Local setup

```bash
# 1. PHP dependencies
composer install

# 2. Environment
cp .env.example .env
php artisan key:generate

# 3. Database (SQLite by default)
touch database/database.sqlite
php artisan migrate --seed

# 4. Frontend
npm install
npm run build     # production assets
# or: npm run dev # Vite dev server with hot reload

# 5. Public file storage for uploaded photos
php artisan storage:link

# 6. Serve
php artisan serve
```

Open <http://localhost:8000> and sign in with one of the demo accounts below.

### Using MySQL instead of SQLite

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=siswahub
DB_USERNAME=root
DB_PASSWORD=
```

Then run `php artisan migrate --seed` again. All primary keys are UUIDs, so no schema changes are needed.

## Demo accounts

Password for every account: **`password`**

| Email | Role | Scope |
| --- | --- | --- |
| `admin@siswahub.test` | Super Admin | All schools, all modules |
| `principal@siswahub.test` | School Admin | Nusantara Global School |
| `hr@siswahub.test` | HR Manager | Students, employees, accounts |
| `assets@siswahub.test` | Asset Manager | Inventory |
| `library@siswahub.test` | Librarian | Library |
| `clinic@siswahub.test` | Clinic Officer | Clinic |
| `transport@siswahub.test` | Transport Manager | Fleet, routes, passengers |
| `cafeteria@siswahub.test` | Cafeteria Manager | Menus, kitchen stock, meal logs |
| `teacher@siswahub.test` | Teacher | Read-only students, library, clinic |

The login screen has one-click buttons for the first four accounts.

## Seed data

`php artisan migrate --seed` creates a realistic demo group:

- **3 schools / 7 branches** (Jakarta, Bandung, Surabaya)
- **~205 students** with guardians, classes and statuses
- **70 employees** — teachers, administrative staff and general employees
- Asset categories, ~105 asset records across branches
- 7 vehicles, 7 routes with stops, passenger assignments and 5 days of passenger logs
- ~168 book titles across branches, memberships for students/staff, active/overdue/returned loans
- Medical records, ~100 clinic visits with medicines dispensed, low-stock and expiring medicines
- Menus for past/upcoming days, kitchen inventory, daily meal logs

To reset: `php artisan migrate:fresh --seed`

## Role-based access control

Roles and permissions are stored in the database (`roles`, `permissions`, pivot tables) and editable at **Access → Roles & permissions**. Every route is protected by the `permission` middleware (`students.view`, `assets.manage`, `clinic.view`, …). Super Admin bypasses checks. New accounts are created at **Access → Login accounts**; staff records themselves stay in the employee module.

## Integration readiness (legacy finance & dormitory)

- Every primary key is a **UUID** (`HasUuids`), safe to store in legacy tables.
- Student identity is keyed on UUID, with unique `nisn` when present.
- Employees share one table with a `type` discriminator (`teacher`, `staff`, `general`).
- Each record carries `school_id` and nullable `branch_id`.

JSON API (see **Settings → Integration** in the app):

```
GET    /api/v1/schools
GET    /api/v1/students?school_id=&branch_id=&status=&updated_since=&per_page=
GET    /api/v1/students/{uuid}
POST   /api/v1/students
PUT    /api/v1/students/{uuid}      (PATCH merges with the stored record)
DELETE /api/v1/students/{uuid}
GET    /api/v1/employees
POST   /api/v1/employees
PUT    /api/v1/employees/{uuid}     (PATCH supported)
DELETE /api/v1/employees/{uuid}
GET    /api/v1/assets
GET    /api/v1/transport/routes
GET    /api/v1/library/loans
GET    /api/v1/clinic/visits
GET    /api/v1/dashboard/summary
```

Set a key in `.env` (never commit it):

```env
INTEGRATION_API_KEY=your-long-random-secret
```

Then call with either header:

```bash
curl -H "X-API-Key: $INTEGRATION_API_KEY" http://localhost:8000/api/v1/students?per_page=25
# or: -H "Authorization: Bearer $INTEGRATION_API_KEY"

# Create a student (201 Created)
curl -X POST http://localhost:8000/api/v1/students \
  -H "X-API-Key: $INTEGRATION_API_KEY" -H "Content-Type: application/json" \
  -d '{"school_id":"<uuid>","full_name":"Nadia Putri","gender":"female","status":"active"}'

# Partial update (200 OK) and delete (204 No Content)
curl -X PATCH http://localhost:8000/api/v1/students/<uuid> \
  -H "X-API-Key: $INTEGRATION_API_KEY" -H "Content-Type: application/json" -d '{"classroom":"10A"}'
curl -X DELETE http://localhost:8000/api/v1/students/<uuid> -H "X-API-Key: $INTEGRATION_API_KEY"
```

Writes validate with the same rules as the web forms and return `422` with an `errors` object on failure.
Without a configured key the endpoints answer `503`; a wrong key answers `401`.

## Project layout

```
app/Http/Controllers          Module controllers (students, employees, assets, transport, library, clinic, cafeteria, reports, access, labels, exports)
app/Http/Controllers/Api/V1   Integration API (read + student/employee writes)
app/Support                   Shared rules, report aggregation, media (photo/barcode/QR) helpers
app/Http/Middleware           Inertia shared props, permission + API key middleware
app/Models                    UUID Eloquent models with school scoping
database/migrations           Schema for all modules
database/seeders              Demo group data
resources/js/Layouts          Responsive app shell (desktop sidebar + mobile drawer)
resources/js/Components       Design system: cards, tables, modal, badges, pagination
resources/js/Pages            One folder per module (Inertia + React)
routes/web.php                Web routes with permission middleware
routes/api.php                Integration API routes
```

## Useful commands

```bash
php artisan migrate:fresh --seed   # rebuild demo data
php artisan route:list             # inspect modules and permissions
php artisan test                   # 18 feature tests / 300 assertions (in-memory SQLite)
npm run dev                        # Vite hot reload (run alongside php artisan serve)
npm run build                      # compile assets for production
```

## Notes

- Mobile support is first-class: tables collapse into stacked records, filters wrap, navigation becomes a drawer, dialogs are bottom sheets.
- Clinic medicine dispensing and library circulation update stock/copy counts atomically inside database transactions.
- Library books and assets each have a printable label (**Print label** icon in the list, or **Library → Scan**) with a Code 128 barcode and a QR code. `Library → Scan` accepts scanner input and finds the matching book or asset; book barcodes are generated automatically (`BK-XXXXXXXX`) when left empty.
- Reports can be downloaded as CSV (Excel-friendly UTF-8) or PDF from the report page; both share the same aggregation as the on-screen page.
- Photos live on the `public` disk under `/storage/photos/...`; run `php artisan storage:link` after cloning.
- Asset codes and employee numbers are unique identifiers intended for physical labels and legacy reconciliation.

## Tests

The suite in `tests/Feature` is the permanent version of the module audit:

| File | Covers |
| --- | --- |
| `PageAccessTest` | Every page of every module renders (43 URLs) |
| `ModuleCrudTest` | Create → update → delete for schools, branches, students, employees, accounts, roles, assets, vehicles, routes, stops, passengers, logs, books, categories, members, loans, medicine, visits, dispense, records, menus, inventory, restock, meal logs |
| `CrossModuleTest` | New student reaches reports, loans change stock and the student profile, clinic dispense changes medicine stock, transport assignment appears on the profile |
| `TenancyTest` | School admin cannot read/write another school, role edits and school creation are super-admin only, teacher is read-only, non-super-admin without a school sees nothing |
| `ApiTest` | Every read endpoint, key enforcement (401/503), student + employee create/update/delete, validation (422) |
| `MediaExportTest` | Photo upload/remove, label generation, scan lookup, CSV + PDF export |

`phpunit.xml` points the suite at an in-memory SQLite database, so it never touches the demo data.
