# HR Evaluation System - Full System Manual

This document serves as the comprehensive guide for the HR Evaluation System. It covers the system architecture, frontend and backend components, business logic, and installation instructions.

> **Note**: This manual should be updated whenever there are changes to the system's logic, data structure, or architecture.

---

## 1. System Overview

The HR Evaluation System is a web-based application designed to facilitate performance assessments within the organization. It allows for:
*   **360-Degree Feedback**: Evaluations flow both downwards (Manager to Staff) and upwards (Staff to Manager).
*   **Hierarchical Management**: Users are organized in a tree structure (Department -> Section -> Unit).
*   **Score Calculation**: Automated scoring based on weighted criteria.
*   **Reporting**: Dashboards and CSV export capabilities.

### Architecture
The system operates as a hybrid application:
1.  **Frontend**: Built with **Next.js (React)**, utilizing Tailwind CSS and Shadcn UI for a modern, responsive interface.
2.  **Backend**: A **PHP** API (`api.php`) serving data from a **MySQL** database (`schema.sql`).
    *   *Current State*: The frontend is capable of running in "Mock Mode" using `lib/data.ts` or can be connected to the PHP API. The `api_test.htm` client verifies the backend independently.

---

## 2. Frontend (Next.js)

### Key Directories
*   `app/`: App Router pages (`layout.tsx`, `page.tsx`).
*   `components/`: Reusable UI components.
    *   `layout/`: `AppShell` (Main structure), `AppProvider` (Global state).
    *   `assessment/`: Evaluation logic and forms (`EvaluationTable`, `AssessmentPage`).
*   `lib/`: Core logic and types.
    *   `data.ts`: Mock data and initial organization structure.
    *   `helpers.ts`: Business logic functions (scoring, role detection).
    *   `types.ts`: TypeScript interfaces.

### Key Features
*   **State Management**: `AppProvider.tsx` manages the global state (current user, scores, view navigation) without Redux.
*   **Routing**: Single-page application feel within `AppShell` switching views based on state.

---

## 3. Backend (PHP & MySQL)

### Database Schema (`schema.sql`)
The MySQL database stores all persistent data.
*   **`users`**: Employee records, roles, and hierarchy (`parent_internal_id`).
*   **`evaluations`**: Stores scores (`evaluator_id`, `target_id`, `criteria_id`, `score`).
*   **`criteria`**: Assessment questions and weights.
*   **`system_config`**: Configuration like evaluation period dates.

### API (`api.php`)
Acts as the bridge between the database and the frontend.
*   **`GET ?action=get_init_data`**: Returns the full state (Users, Org Chart, Criteria) to initialize the app.
*   **`POST ?action=update_score`**: Saves scores in real-time.
*   **`POST ?action=login`**: Simple organization ID based authentication.

> For detailed API documentation, refer to **`BACKEND_MANUAL.md`**.

---

## 4. Business Logic & Formulas

The core logic is consolidated in `lib/helpers.ts` (Frontend) and mirrored in `api.php` (Backend).

### A. Roles
Roles are determined by keywords in the Position title:
*   **COMMITTEE**: Contains "กรรมการ"
*   **MANAGER**: Contains "ผู้จัดการ" (and not Assistant)
*   **ASST**: Contains "รอง" or "ผู้ช่วย"
*   **HEAD**: Contains "หัวหน้า"
*   **STAFF**: Default role if none of the above match.

### B. Scoring Formula
The Total Score (0-100) is calculated as:

$$
\text{Total Score} = \left( \frac{\sum (\text{Raw Score} / 4) \times \text{Weight}}{\sum \text{Total Weight}} \right) \times 100
$$

*   **Raw Score**: 1 to 4 (Adjustment needed if UI uses 1-5, currently mapped to 4 point scale internally or visually).
*   **Weight**: Defined in `criteria` table (e.g., 20, 10).

### C. Salary Groups
Salary groups are calculated for reporting:
*   **> 100,000**
*   **> 50,000**
*   **> 40,000**
*   **> 30,000**
*   **> 20,000**
*   **<= 20,000** (Default)

### D. Evaluation Flow
*   **Downwards**: Managers assess direct descendants.
*   **Upwards**: Staff assess direct ancestors (Feedback only, 20% weight logic is implied in reporting).
*   **Committee**: Assesses Managers/Heads/Assts.
*   **Exclusions**: Specific pairs defined in `exclusions` table are skipped (e.g. Conflict of Interest).

---

## 5. Installation & Setup

### Requirements
*   Node.js (v18+)
*   PHP (v7.4+)
*   MySQL (v5.7+)

### Step 1: Database Setup
1.  Create a database named `hr_evaluation_pro` (or let the schema create it).
2.  Import `schema.sql`:
    ```bash
    mysql -u root -p < schema.sql
    ```

### Step 2: Backend Setup
1.  Configure `api.php`:
    ```php
    $host = 'localhost';
    $dbname = 'hr_evaluation_pro';
    $username = 'root'; // Update your credentials
    $password = '';
    ```
2.  Run PHP Server:
    ```bash
    php -S localhost:8000
    ```

### Step 3: Frontend Setup
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Run Development Server:
    ```bash
    npm run dev
    ```
3.  Open `http://localhost:3000`.

---

## 6. Maintenance Guide

*   **Updating Logic**: If the scoring formula changes, update `calculateTotal` in `lib/helpers.ts` AND the corresponding reporting logic in `api.php`.
*   **New Users**: Insert into the `users` table via SQL or future Admin UI.
*   **New Criteria**: Insert into the `criteria` table.

For detailed backend maintenance, see `BACKEND_MANUAL.md`.
