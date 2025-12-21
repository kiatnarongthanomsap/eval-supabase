# HR Evaluation System - Backend Manual

This document provides a comprehensive guide to the backend architecture, database schema, and API for the HR Evaluation System.

## 1. Database Schema (`schema.sql`)

The system uses a MySQL database named `hr_evaluation_pro`.

### Tables

*   **`users`**: Stores employee information and organizational hierarchy.
    *   `internal_id`: Unique string ID (e.g., `U_21`).
    *   `org_id`: Legacy integer ID.
    *   `parent_internal_id`: Links to the manager/supervisor.
    *   `role`: User role (`COMMITTEE`, `MANAGER`, `ASST`, `HEAD`, `STAFF`).
    *   `salary_group`: Derived grouping for salary reports.
*   **`criteria`**: Evaluation criteria definitions.
    *   `category`: `PERF` (Performance), `CHAR` (Characteristics), `EXEC` (Executive).
*   **`evaluations`**: Stores scores given by evaluators.
    *   Composite unique key on `(evaluator_internal_id, target_internal_id, criteria_id)`.
*   **`comments`**: Qualitative feedback.
*   **`exclusions`**: Rules for skipping specific evaluations.
*   **`system_config`**: Key-value store for global settings (e.g., assessment dates).
*   **`logs`**: System activity logs.

### Initial Data
The `schema.sql` file includes `INSERT` statements to populate the database with the initial organization chart, criteria, and configuration derived from the original TypeScript codebase.

---

## 2. PHP API (`api.php`)

The backend logic is encapsulated in a single `api.php` file. It connects to the MySQL database via PDO.

### Configuration
Update the database credentials at the top of `api.php`:
```php
$host = 'localhost';
$dbname = 'hr_evaluation_pro';
$username = 'root';
$password = '';
```

### Endpoints
The API is accessed via query parameters (`?action=...`). All responses are in JSON format.

#### `GET ?action=get_init_data`
Fetches all necessary data for the frontend application initialization.
*   **Returns**: object containing `users`, `criteria`, `scores`, `comments`, `exclusions`, `systemConfig`.

#### `POST ?action=login`
*   **Payload**: `{ "org_id": 21 }`
*   **Returns**: User object if found, or error.

#### `POST ?action=update_score`
Saves or updates a score for a specific criteria.
*   **Payload**:
    ```json
    {
      "evaluatorId": "U_xx",
      "targetId": "U_yy",
      "criteriaId": "1.1",
      "score": 85
    }
    ```

#### `POST ?action=update_comment`
Saves or updates a comment for a target.
*   **Payload**:
    ```json
    {
      "evaluatorId": "U_xx",
      "targetId": "U_yy",
      "comment": "Good job"
    }
    ```

#### `GET ?action=reset_data`
**Warning**: Truncates `evaluations` and `comments` tables. Used for testing.

---

## 3. Testing (`api_test.htm`)

A standalone HTML client is provided to verify the backend functionality without the full React frontend.

### Usage
1.  Host `api.php` (e.g., `php -S localhost:8000`).
2.  Open `api_test.htm` in a browser.
3.  Use the buttons to:
    *   **Get Init Data**: View the full JSON payload.
    *   **Test Login**: Verify user authentication.
    *   **Test Update**: Attempt to write data to the DB.

---

## Maintenance

*   **Logic Changes**: If salary calculation logic or role definitions change, update the logic in `api.php` (specifically `getInitData` formatting) and reflect any column changes in `schema.sql`.
*   **Data Changes**: To modify the initial organization structure, update the `INSERT` statements in `schema.sql`.
