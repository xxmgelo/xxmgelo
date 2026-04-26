# Student Fee Management and Collection Dashboard

**Application Type:** Web Application  
**Document Type:** Technical Documentation  
**Version:** 1.0.0  
**Status:** Draft  
**Date:** 2026-04-25  
**Author(s):** [Replace with your name or group names]  
**Reviewed By:** [Replace with instructor/reviewer name]

## 1. Introduction

The Student Fee Management and Collection Dashboard is a web-based application developed to help school administrators manage student fee records, monitor balances, process collections, and review payment analytics in a single system. The application was built with React on the frontend and communicates with a local PHP-based API backend hosted at `http://localhost/aclcapi/api`. It supports common administrative tasks such as login, student management, fee management, payment recording, email reminders, receipt sending, and dashboard reporting. The system reduces reliance on manual spreadsheets and fragmented workflows by centralizing fee-related operations into one interface.

### 1.1 Statement of the problem

School administrators often experience difficulty managing student fee records when information is stored across spreadsheets, handwritten records, or separate tools. This setup makes it harder to update balances, confirm payments, track due accounts, and maintain consistent student information. Manual processes also increase the chance of duplicated records, incorrect balances, delayed follow-ups, and incomplete reporting. A dedicated information system is needed to centralize student financial data and improve the speed, accuracy, and visibility of collection-related work.

- Primary goal: To build a centralized web-based system for student fee management, payment tracking, and administrative reporting.
- Secondary goal: To reduce manual work by supporting student record maintenance, payment reminders, analytics, and fee updates in one platform.
- Target audience: School administrators, collection staff, finance staff, and authorized academic office personnel.

### 1.2 Scope

The project covers the design and implementation of a web application for managing students and their financial records in a local school environment. The system includes administrator authentication, student listing and filtering, fee editing, payment processing, email reminder generation, payment receipt sending, dashboard summaries, and analytics reporting. It supports both installment-based and full-payment-based fee tracking. The current implementation is intended for local deployment and connects to a local API and database.

- Functions or features of the web application:
- Administrator login and local session persistence
- Dashboard with summary metrics and charts
- Student directory with search and filtering
- Add, edit, and delete student records
- Fee structure editing and balance normalization
- Payment entry and balance recalculation
- Reminder email preparation and sending
- Payment receipt email preparation and sending
- Analytics and reporting for fee collection performance
- Administrator profile, password, theme, and preference management

- Application type:
- Web application
- Frontend and backend integrated system
- Designed primarily for desktop-based administrative use in a local deployment setup

### 1.3 Objectives

The project aims to provide a practical and reliable fee management platform for academic administration. It is designed to centralize student financial records, reduce repetitive manual work, and improve visibility over payment status and outstanding balances. The application also aims to improve communication by helping administrators send reminders and receipts directly from the system. A further objective is to support better decision-making through clear dashboard summaries and analytics reports.

- To centralize student fee and payment information in one system
- To provide a faster way to search, manage, and update student records
- To support both installment and full-payment workflows
- To reduce errors in balance computation through automated fee normalization
- To help staff send reminders and receipts more efficiently
- To provide charts and collection summaries for reporting and monitoring

## 2. System Architecture

The system follows a client-server architecture. The React frontend serves as the user-facing dashboard and handles interaction, filtering, local session storage, modal workflows, and visual analytics. The frontend communicates with a local PHP API through HTTP requests. The API is responsible for student, admin, reminder, and payment-related operations, while MySQL stores the persistent data. Some temporary UI state such as theme preference, login session, and cached payment detail fields are stored in browser local storage.

### 2.1 High-Level Diagram

```text
+-----------------------------+
| Administrator / Staff User  |
+-------------+---------------+
              |
              v
+-----------------------------+
| React Frontend Dashboard    |
| - Login                     |
| - Students                  |
| - Student Fee               |
| - Manage Fees               |
| - Analytics                 |
| - Admin Settings            |
+-------------+---------------+
              |
              | HTTP / JSON
              v
+-----------------------------+
| Local PHP API               |
| /admin_login.php            |
| /admins.php                 |
| /students.php               |
| /students_bulk.php          |
| /reminders.php              |
| /payment_receipts.php       |
+-------------+---------------+
              |
              v
+-----------------------------+
| MySQL Database              |
| - admins                    |
| - bse_students              |
| - bsis_students             |
| - removed_students          |
+-----------------------------+
```

### 2.2 Technology Stack

| Layer | Technology | Version | Purpose |
| --- | --- | --- | --- |
| Frontend Framework | React | 19.2.4 | Main single-page application interface |
| Frontend Language | JavaScript | ES6+ | Component logic, state handling, API calls, and client-side workflows |
| Frontend Build Tool | Create React App / react-scripts | 5.0.1 | Local development server and production build process |
| UI / Styling | CSS | Custom | Modular stylesheets for layout, theme, forms, tables, modals, sidebar, and dashboard views |
| Data Visualization | Chart.js | 4.4.1 | Dashboard and analytics chart rendering |
| React Chart Integration | react-chartjs-2 | 5.2.0 | React wrapper used to display Chart.js charts |
| Backend | PHP API | PHP 8.2.12 | Local API endpoints for login, students, admins, reminders, and receipts |
| Database | MariaDB | 10.4.32 | Persistent storage for admins, student profiles, removed students, and student financial records |
| API Communication | HTTP + JSON | N/A | Frontend uses `fetch()` to communicate with `http://localhost/aclcapi/api` |
| Authentication | Local admin login | N/A | Admin session is stored in browser `localStorage`; no JWT or OAuth implementation |
| Email Service | PHPMailer | 7.0.2 | Sends payment reminders and payment receipt emails through SMTP |
| Testing | Jest + React Testing Library | Installed | Unit and frontend utility testing through `react-scripts test` |
| Client Storage | Browser `localStorage` | N/A | Stores admin session, theme preferences, and payment-detail cache |

## 3. JSON API Reference

The frontend consumes a local PHP JSON API defined under `http://localhost/aclcapi/api`. The React request helper is implemented in [`src/utils/api.js`](/abs/path/c:/Users/admin/xxmgelo/src/utils/api.js), and the backend endpoint files are located in `C:\xampp\htdocs\aclcapi\api`.

### 3.1 General Conventions

#### Base URL

`http://localhost/aclcapi/api`

The frontend can override this default URL through the environment variable `REACT_APP_API_BASE`.

#### Request and Response Format

The frontend communicates with the backend using HTTP requests and JSON payloads. Requests that create or update records use `Content-Type: application/json`.

The current API does not use a global response envelope such as `{ "success": true, "data": ... }`. Instead, responses are endpoint-specific:

- Student list endpoints return arrays.
- Create and update endpoints commonly return objects such as `{ "student": {...} }`.
- Delete endpoints return objects such as `{ "deleted": true, "count": 1 }`.
- Login returns an object such as `{ "admin": {...} }`.

#### Date Format

Payment-related date fields use ISO 8601 format with a timezone when exchanged through the API, for example `2026-04-27T04:45:00Z`. The PHP backend normalizes accepted date values to UTC before saving them to MariaDB and returns student payment dates in ISO 8601 UTC format.

#### Pagination

The current API does not implement server-side pagination. Pagination shown in the frontend tables is handled on the client side after the student list is loaded.

#### Authentication

Administrator login is handled through `/admin_login.php`. After a successful login, the frontend stores the returned admin session in browser `localStorage` under the key `aclc_admin_session`.

The current system does not implement JWT, OAuth, token expiration, or a refresh-token endpoint.

#### Error Response Format

When a request fails, the frontend reads the `error` field and optional `details` field from the JSON response:

```json
{
  "error": "Student not found",
  "details": "Optional technical details"
}
```

### 3.2 Error Codes

The system uses standard HTTP status codes with JSON error messages. It does not define a separate custom error-key catalogue.

| HTTP Code | Meaning in This System | Typical Cause |
| --- | --- | --- |
| 400 | Bad Request | Missing JSON payload or invalid request format |
| 401 | Unauthorized | Invalid administrator login credentials |
| 404 | Not Found | Student, admin, or target record was not found |
| 405 | Method Not Allowed | Endpoint was called with an unsupported HTTP method |
| 422 | Validation Error | Required fields are missing, duplicate values exist, or a business rule rejected the request |
| 500 | Server Error | Database, email, or unexpected backend failure |

### 3.3 Endpoint Catalogue

#### Authentication - `/admin_login.php`

**POST `/admin_login.php`**  
Authenticates an administrator using an `identifier` and `password`.

Request body:

```json
{
  "identifier": "mainadmin",
  "password": "your-password"
}
```

Successful response shape:

```json
{
  "admin": {
    "id": 1,
    "username": "mainadmin",
    "email": "mainadmin@example.com",
    "full_name": "Ms. Jhea Pelonio",
    "role": "admin",
    "avatar": ""
  }
}
```

#### Students - `/students.php`

**GET `/students.php`**  
Returns the basic student list with profile fields only: `StudentID`, `Name`, `Program`, `YearLevel`, and `Gmail`.

**GET `/students.php?view=full`**  
Returns the full dashboard student list. This response combines profile data from `bse_students` and `bsis_students` with fee and payment data from `student_financials`.

**POST `/students.php?view=full`**  
Creates a new student profile and initializes the related financial record.

Minimal request body:

```json
{
  "StudentID": "22000080800",
  "Name": "Juan Dela Cruz",
  "Program": "Bachelor of Science in Information System (BSIS)",
  "YearLevel": "1st Year",
  "Gmail": "juan@example.com"
}
```

**PUT `/students.php?view=full`**  
Updates a student record. This endpoint can update profile fields, fee fields, payment status, payment dates, and payment amounts.

When changing the student ID, include `OriginalStudentID` so the API can locate the old record and keep the financial record linked.

```json
{
  "OriginalStudentID": "22000080800",
  "StudentID": "22000080811",
  "Name": "Juan Dela Cruz",
  "Program": "Bachelor of Science in Information System (BSIS)",
  "YearLevel": "2nd Year",
  "Gmail": "juan.updated@example.com"
}
```

**PATCH `/students.php?view=full`**  
Supported by the backend for partial student updates. It follows the same payload structure as `PUT`.

**DELETE `/students.php?student_id={student_id}&view=full`**  
Removes an active student record, deletes the linked financial record, and stores the student profile in `removed_students`.

**DELETE `/students.php?id={id}&view=full`**  
Deletes a student by internal row ID when a student ID is not available.

#### Bulk Students - `/students_bulk.php`

**POST `/students_bulk.php?view=full`**  
Accepts an array of normalized student objects and inserts or updates them in bulk. This endpoint exists in the backend, but Excel upload is not currently exposed in the frontend interface.

#### Administrators - `/admins.php`

**GET `/admins.php`**  
Returns administrator records.

**POST `/admins.php`**  
Creates a new administrator account.

**PUT `/admins.php`**  
Updates administrator information. The frontend sends different `action` values for profile and password updates.

Profile update example:

```json
{
  "action": "update_profile",
  "id": 1,
  "full_name": "Ms. Jhea Pelonio",
  "username": "mainadmin",
  "avatar": "data:image/png;base64,..."
}
```

Password update example:

```json
{
  "action": "update_password",
  "id": 1,
  "username": "mainadmin",
  "current_password": "old-password",
  "new_password": "new-password"
}
```

#### Payment Reminders - `/reminders.php`

**POST `/reminders.php`**  
Sends a payment reminder email using a generated subject, plain-text message, and HTML content.

Sample request fields:

```json
{
  "StudentID": "22000080800",
  "Name": "Juan Dela Cruz",
  "Gmail": "juan@example.com",
  "Program": "Bachelor of Science in Information System (BSIS)",
  "YearLevel": "1st Year",
  "PaymentMode": "installment",
  "TotalFee": 18000,
  "TotalBalance": 9000,
  "due_type": "installment_stage",
  "due_label": "Prelim",
  "due_amount": 1800,
  "subject": "Payment Reminder",
  "message": "Please settle your balance.",
  "html": "<p>Please settle your balance.</p>"
}
```

#### Payment Receipts - `/payment_receipts.php`

**POST `/payment_receipts.php`**  
Sends a payment receipt email after a successful payment save. The payload includes student profile fields, fee fields, payment metadata, receipt content, and generated HTML.

### 3.4 Sample Request / Response

#### POST `/admin_login.php`

Request:

```json
{
  "identifier": "mainadmin",
  "password": "secret123"
}
```

Response:

```json
{
  "admin": {
    "id": 1,
    "username": "mainadmin",
    "email": "mainadmin@example.com",
    "full_name": "Ms. Jhea Pelonio",
    "role": "admin",
    "avatar": ""
  }
}
```
## 4. Data Models

The application uses both persistent database tables and normalized frontend objects. The SQL schema is defined in [`aclcapi.sql`](/abs/path/c:/Users/admin/xxmgelo/aclcapi.sql).

### 4.1 `admins`

The `admins` table stores administrator account details.

| Field | Type | Description |
| --- | --- | --- |
| `id` | INT | Primary key |
| `username` | VARCHAR(50) | Unique login name |
| `email` | VARCHAR(120) | Unique email address |
| `full_name` | VARCHAR(120) | Admin full name |
| `avatar` | LONGTEXT | Optional base64/profile image data |
| `password_hash` | VARCHAR(255) | Hashed password |
| `role` | VARCHAR(30) | Account role, defaults to `admin` |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |

### 4.2 Student Resource

Student data is persisted in `bse_students` and `bsis_students`, while a deleted-record audit trail is stored in `removed_students`.

#### Core student fields

| Field | Type | Description |
| --- | --- | --- |
| `student_id` | VARCHAR(50) | Unique student identifier |
| `name` | VARCHAR(150) | Student full name |
| `program` | VARCHAR(150) | Program or course |
| `year_level` | VARCHAR(50) | Year level |
| `gmail` | VARCHAR(150) | Contact email |

#### Payment-tracking fields

| Field | Type | Description |
| --- | --- | --- |
| `downpayment_date` | DATETIME | Date paid for downpayment |
| `prelim_date` | DATETIME | Date paid for prelim |
| `midterm_date` | DATETIME | Date paid for midterm |
| `prefinal_date` | DATETIME | Date paid for pre-final |
| `final_date` | DATETIME | Date paid for finals |
| `total_balance_date` | DATETIME | Date full balance was settled |
| `downpayment_paid_amount` | DECIMAL(12,2) | Amount applied to downpayment |
| `prelim_paid_amount` | DECIMAL(12,2) | Amount applied to prelim |
| `midterm_paid_amount` | DECIMAL(12,2) | Amount applied to midterm |
| `prefinal_paid_amount` | DECIMAL(12,2) | Amount applied to pre-final |
| `final_paid_amount` | DECIMAL(12,2) | Amount applied to finals |
| `total_balance_paid_amount` | DECIMAL(12,2) | Amount applied to full balance |

#### Frontend-normalized student object

The frontend extends the database data with computed and workflow-oriented fields such as:

- `StudentID`
- `Name`
- `Program`
- `YearLevel`
- `Gmail`
- `PaymentMode`
- `TotalFee`
- `BaseTotalFee`
- `Discount`
- `Downpayment`
- `Prelim`
- `Midterm`
- `PreFinal`
- `Finals`
- `FullPaymentAmount`
- `TotalBalance`
- `CanRemind`
- `reminder_sent_token`

These are normalized in [`src/utils/fees.js`](/abs/path/c:/Users/admin/xxmgelo/src/utils/fees.js) to ensure that fee totals, installment balances, and reminder behavior remain consistent.

## 5. Frontend Application

The frontend is a single-page React application that uses component-level state and tab-based navigation rather than URL-based page routing. It focuses on a dashboard workflow for administrators and exposes the major functions of the system through the sidebar and modal interactions.

### 5.1 Project Structure

```text
src/
  App.js
  components/
    Header.js
    Navigation.js
    HomeDashboard.js
    AnalyticsReports.js
    UploadSection.js
    StudentFeeTable.js
    StudentFeeAdminTable.js
    ManageStudentTable.js
    StudentsTable.js
    PaymentModal.js
    AddStudentModal.js
    EditStudentModal.js
    ConfirmModal.js
    LoginPage.js
    AdminSettingsPage.js
  utils/
    api.js
    fees.js
    handlers.js
    reminders.js
    receipts.js
    analytics.js
  hooks/
    useTablePagination.js
  styles/
    *.css
```

Component responsibilities:

- `App.js`: Main state container and workflow coordinator
- `Navigation.js`: Sidebar navigation between views
- `HomeDashboard.js`: Summary metrics and dashboard charts
- `AnalyticsReports.js`: Collection analytics and report panels
- `UploadSection.js`: Search, filters, and top-of-view action controls
- `StudentFeeTable.js`: Payment and reminder operations for students
- `StudentFeeAdminTable.js`: Fee editing and financial management
- `ManageStudentTable.js`: Record maintenance actions
- `PaymentModal.js`: Payment capture and save workflow
- `AdminSettingsPage.js`: Profile, password, and preferences

### 5.2 State Management

State is managed primarily through React `useState`, `useEffect`, `useRef`, and `useCallback` hooks in `App.js`. There is no Redux, Zustand, Context API store, or external global state manager in the current codebase.

Major state domains include:

- Authentication state: current admin session, login loading, login error
- Student state: full student list, filtered results, selected student, add/edit forms
- UI state: active tab, dark mode, sidebar collapse, confirmation modals
- Payment state: payment modal visibility, selected payment target, payment cache
- Reminder state: sending status, reminder toast visibility, reminder tokens
- Preference state: theme colors and local appearance settings

Persistent client-side values stored in `localStorage`:

- `aclc_admin_session`
- `aclc_theme_preferences`
- `aclc_dark_mode`
- `aclc_payment_detail_cache`

### 5.3 Routing

The application does not currently use `react-router`. Instead, it renders different application sections based on the `activeTab` state in `App.js`.

Available main views:

- `home`
- `students`
- `studentFee`
- `manageStudent`
- `manageFee`
- `analytics`
- `adminSettings`

This approach keeps the application simple for local administrative use, but it also means there are no shareable URLs for specific views and no browser-history-based deep linking.

### 5.4 API Client

The API client is implemented in [`src/utils/api.js`](/abs/path/c:/Users/admin/xxmgelo/src/utils/api.js). A shared `request()` helper performs the following tasks:

- Prepends the configured `API_BASE`
- Sends JSON request headers
- Parses JSON responses when possible
- Throws descriptive errors when `response.ok` is false
- Returns parsed response data to calling functions

Frontend API functions include:

- `getStudents()`
- `createStudent()`
- `updateStudent()`
- `deleteStudent()`
- `upsertStudents()`
- `adminLogin()`
- `getAdmins()`
- `createAdmin()`
- `updateAdminProfile()`
- `updateAdminPassword()`
- `sendPaymentReminder()`
- `sendPaymentReceipt()`

## 6. Security Considerations

The current project is a locally deployed school administration system, so its security model is practical and lightweight rather than enterprise-scale. Even so, several important controls are visible in the implementation and schema.

### 6.1 Authentication & Authorisation

- Login is handled through `admin_login.php` and requires an identifier and password.
- Administrator account data is stored in the `admins` table.
- Passwords are stored as `password_hash`, indicating that plaintext password storage is not intended.
- The frontend only renders the dashboard after a successful login session is stored.
- Administrative settings such as profile and password changes require an authenticated session context.
- The current frontend stores the session in `localStorage`, which is simple for a local setup but is weaker than HttpOnly-cookie-based session storage.

### 6.2 Transport & Data

- API requests use JSON over HTTP to a configurable local base URL.
- User input is validated in frontend workflows for required fields and duplicate Gmail checks, but backend validation remains essential.
- The request helper avoids returning raw server internals and surfaces cleaner error messages when available.
- The system stores profile avatars as image payloads, so backend size validation and upload restrictions should be enforced.
- Payment emails and reminders include student information, so the email endpoints should log carefully and avoid exposing sensitive content unnecessarily.
- Browser `localStorage` contains session and preference data, so access should be limited to trusted devices and administrator workstations.

## 7. Key Functional Workflows

### 7.1 Login Workflow

1. The admin opens the application and sees the login page.
2. The admin submits an identifier and password.
3. The frontend sends the credentials to `/admin_login.php`.
4. On success, the returned admin object is stored in `localStorage`.
5. The dashboard loads and student data is fetched.

### 7.2 Payment Processing Workflow

1. The admin selects a student and opens the payment modal.
2. The frontend previews payment application using normalized fee logic.
3. The student record is updated through `/students.php?view=full`.
4. Payment dates and paid amounts are cached and persisted.
5. If the student has an email, the system attempts to send a receipt.

### 7.3 Reminder Workflow
 
1. The system evaluates whether the student is eligible for a reminder.
2. A reminder payload is generated with due label, due amount, and email content.
3. The frontend sends the payload to `/reminders.php`.
4. A reminder token is saved to avoid duplicate reminders for the same payment state.

## 8. Observations and Limitations

- The current implementation is designed for local deployment and assumes access to a local API and database.
- There is no URL routing or multi-page navigation structure.
- Authentication is frontend-session-based rather than token-based.
- The exact backend PHP source code is not included in this workspace, so backend validation and mail implementation details are inferred from client usage.
- The current SQL schema shows separate tables for `bse_students` and `bsis_students`, which may require additional abstraction if more programs are added later.
- The README is still mostly the default Create React App template and does not yet document the actual business system in detail.

## 9. Changelog

| Version | Date | Changes |
| --- | --- | --- |
| 1.0.0 | 2026-04-25 | Initial completed documentation draft based on the current React frontend, local API integration, and available SQL schema |

## 10. Appendix: Team Contribution

### Team Roster

Replace this section with your actual group members and roles.

| Name | Role | Primary Areas |
| --- | --- | --- |
| [Member 1] | Team Lead / Frontend Developer | UI, React components, dashboard |
| [Member 2] | Backend Developer | PHP API, authentication, email endpoints |
| [Member 3] | Analyst / Documentation | Requirements, documentation, validation |
| [Member 4] | QA / Database | Testing, SQL schema, data verification |

Possible roles:

- Team Lead
- Front-end developer
- Backend developer
- QA
- Analyst

Possible primary areas:

- Architecture
- User Interface Design and Development (frontend)
- API or Backend
- Database
- Testing
- Documentation

### Contribution Summary

Replace the percentages below with your actual team contribution values. Each row should total 100%.

| Lastname, Firstname | Frontend | Backend | Database | Testing | Architecture | Docs | Total |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [Member 1] | 40% | 10% | 10% | 10% | 20% | 10% | 100% |
| [Member 2] | 10% | 45% | 20% | 10% | 10% | 5% | 100% |
| [Member 3] | 10% | 10% | 10% | 10% | 20% | 40% | 100% |
| [Member 4] | 5% | 10% | 35% | 35% | 10% | 5% | 100% |

Note: update the names, exact percentages, and reviewer metadata before final submission.
