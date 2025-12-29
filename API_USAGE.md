# NanoPass Backend - API Documentation

Complete API guide for Vue 3 frontend integration with the NanoPass password management system.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Base Setup](#base-setup)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Usage Examples](#usage-examples)

---

## Authentication

The API uses **Laravel Sanctum** for token-based authentication. All protected endpoints require an `Authorization` header.

### CSRF Token

**Endpoint:** `GET /api/sanctum/csrf-cookie`

Get CSRF token for authentication requests.

**Request:**

```javascript
// Optional - may be needed for initial setup
const response = await fetch("/api/sanctum/csrf-cookie");
```

---

## Base Setup

### Vue 3 API Client Configuration

```javascript
// composables/useApi.js
import { ref } from "vue";

const API_BASE_URL = "http://localhost/api";
const token = ref(localStorage.getItem("auth_token") || null);

const headers = {
    "Content-Type": "application/json",
    ...(token.value && { Authorization: `Bearer ${token.value}` }),
};

export const apiCall = async (method, endpoint, data = null) => {
    try {
        const config = {
            method,
            headers,
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "API Error");
        }

        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
};

export const setToken = (newToken) => {
    token.value = newToken;
    localStorage.setItem("auth_token", newToken);
};
```

---

## API Endpoints

### 1. AUTHENTICATION

#### Register User

**Endpoint:** `POST /api/register`
**Auth Required:** No
**Admin Only:** No

**Request Body:**

```json
{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "password_confirmation": "SecurePass123!",
    "department_id": 1,
    "admin": false
}
```

**Response (201):**

```json
{
    "message": "User registered successfully",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "department_id": 1,
        "admin": false,
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    },
    "token": "1|abc123def456..."
}
```

**Vue 3 Example:**

```javascript
const register = async (formData) => {
    const response = await apiCall("POST", "/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password,
        department_id: formData.departmentId || null,
        admin: false,
    });

    setToken(response.token);
    return response.user;
};
```

---

#### Login User

**Endpoint:** `POST /api/login`
**Auth Required:** No
**Admin Only:** No

**Request Body:**

```json
{
    "username": "john_doe",
    "password": "SecurePass123!"
}
```

**Response (200):**

```json
{
    "message": "Login successful",
    "user": {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "department_id": 1,
        "admin": false,
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    },
    "token": "1|abc123def456..."
}
```

**Vue 3 Example:**

```javascript
const login = async (username, password) => {
    const response = await apiCall("POST", "/login", { username, password });
    setToken(response.token);
    return response.user;
};
```

---

#### Get User Profile

**Endpoint:** `GET /api/profile`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
{
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "department_id": 1,
    "admin": false,
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Logout User

**Endpoint:** `POST /api/logout`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
{
    "message": "Logged out successfully"
}
```

---

### 2. DEPARTMENTS

#### Get All Departments

**Endpoint:** `GET /api/departments`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
[
    {
        "id": 1,
        "department_name": "IT Department",
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    },
    {
        "id": 2,
        "department_name": "HR Department",
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    }
]
```

---

#### Get Department by ID

**Endpoint:** `GET /api/departments/{id}`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
{
    "id": 1,
    "department_name": "IT Department",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Get Department Users

**Endpoint:** `GET /api/departments/{id}/users`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
[
    {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "department_id": 1,
        "admin": false
    },
    {
        "id": 2,
        "username": "jane_smith",
        "email": "jane@example.com",
        "department_id": 1,
        "admin": false
    }
]
```

---

#### Create Department

**Endpoint:** `POST /api/departments`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "department_name": "Finance Department"
}
```

**Response (201):**

```json
{
    "id": 3,
    "department_name": "Finance Department",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Update Department

**Endpoint:** `PUT /api/departments/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "department_name": "Finance & Accounting"
}
```

**Response (200):**

```json
{
    "id": 3,
    "department_name": "Finance & Accounting",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T11:00:00Z"
}
```

---

#### Delete Department

**Endpoint:** `DELETE /api/departments/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
{
    "message": "Department deleted successfully"
}
```

---

### 3. CATEGORIES

#### Get All Categories

**Endpoint:** `GET /api/categories`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
[
    {
        "id": 1,
        "category_name": "Email Systems",
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    },
    {
        "id": 2,
        "category_name": "Database Systems",
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    }
]
```

---

#### Get Category by ID

**Endpoint:** `GET /api/categories/{id}`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
{
    "id": 1,
    "category_name": "Email Systems",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Get Category Systems

**Endpoint:** `GET /api/categories/{id}/systems`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
[
    {
        "id": 1,
        "system_name": "Gmail Admin",
        "category_id": 1,
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    },
    {
        "id": 2,
        "system_name": "Outlook",
        "category_id": 1,
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    }
]
```

---

#### Create Category

**Endpoint:** `POST /api/categories`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "category_name": "Cloud Services"
}
```

**Response (201):**

```json
{
    "id": 3,
    "category_name": "Cloud Services",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Update Category

**Endpoint:** `PUT /api/categories/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "category_name": "Cloud & Hosting Services"
}
```

**Response (200):**

```json
{
    "id": 3,
    "category_name": "Cloud & Hosting Services",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T11:00:00Z"
}
```

---

#### Delete Category

**Endpoint:** `DELETE /api/categories/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
{
    "message": "Category deleted successfully"
}
```

---

### 4. SYSTEMS

#### Get All Systems

**Endpoint:** `GET /api/systems`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
[
    {
        "id": 1,
        "system_name": "Gmail Admin",
        "category_id": 1,
        "category": {
            "id": 1,
            "category_name": "Email Systems"
        },
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    }
]
```

---

#### Get System by ID

**Endpoint:** `GET /api/systems/{id}`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
{
    "id": 1,
    "system_name": "Gmail Admin",
    "category_id": 1,
    "category": {
        "id": 1,
        "category_name": "Email Systems"
    },
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Get System Permissions

**Endpoint:** `GET /api/systems/{id}/permissions`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
[
    {
        "id": 1,
        "system_id": 1,
        "user_id": 5,
        "admin_id": 1,
        "date_time_expiry": "2025-12-31T23:59:59Z",
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    }
]
```

---

#### Get System Passwords

**Endpoint:** `GET /api/systems/{id}/passwords`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
[
    {
        "id": 1,
        "system_id": 1,
        "title": "Admin Account",
        "username": "admin@gmail.com",
        "is_active": true,
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    }
]
```

---

#### Get System Password (Admin)

**Endpoint:** `GET /api/systems/{id}/password`
**Auth Required:** Yes
**Admin Only:** Yes

Returns the most recent password for the system.

**Response (200):**

```json
{
    "id": 1,
    "system_id": 1,
    "title": "Admin Account",
    "username": "admin@gmail.com",
    "password": "encrypted_password_string",
    "notes": "Primary admin account",
    "is_active": true,
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Create System

**Endpoint:** `POST /api/systems`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "system_name": "Jira Cloud",
    "category_id": 1
}
```

**Response (201):**

```json
{
    "id": 5,
    "system_name": "Jira Cloud",
    "category_id": 1,
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Update System

**Endpoint:** `PUT /api/systems/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "system_name": "Jira Cloud Pro",
    "category_id": 1
}
```

**Response (200):**

```json
{
    "id": 5,
    "system_name": "Jira Cloud Pro",
    "category_id": 1,
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T11:00:00Z"
}
```

---

#### Delete System

**Endpoint:** `DELETE /api/systems/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
{
    "message": "System deleted successfully"
}
```

---

### 5. PASSWORDS

#### Get All Passwords (Admin)

**Endpoint:** `GET /api/passwords`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
[
    {
        "id": 1,
        "system_id": 1,
        "title": "Admin Account",
        "username": "admin@gmail.com",
        "password": "encrypted_password",
        "notes": "Main admin account",
        "is_active": true,
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    }
]
```

---

#### Get Password by ID (Admin)

**Endpoint:** `GET /api/passwords/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
{
    "id": 1,
    "system_id": 1,
    "title": "Admin Account",
    "username": "admin@gmail.com",
    "password": "encrypted_password",
    "notes": "Main admin account",
    "is_active": true,
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Get Accessible Passwords (User)

**Endpoint:** `GET /api/passwords/accessible`
**Auth Required:** Yes
**Admin Only:** No

Returns passwords for systems the user has permission to access.

**Response (200):**

```json
[
    {
        "id": 1,
        "system_id": 1,
        "title": "Admin Account",
        "username": "admin@gmail.com",
        "is_active": true,
        "system": {
            "id": 1,
            "system_name": "Gmail Admin"
        }
    }
]
```

---

#### Get Passwords by System

**Endpoint:** `GET /api/passwords/system/{systemId}`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
[
    {
        "id": 1,
        "system_id": 1,
        "title": "Admin Account",
        "username": "admin@gmail.com",
        "password": "encrypted_password",
        "is_active": true,
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    },
    {
        "id": 2,
        "system_id": 1,
        "title": "Support Account",
        "username": "support@gmail.com",
        "password": "encrypted_password",
        "is_active": false,
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    }
]
```

---

#### Get Active Passwords by System (User)

**Endpoint:** `GET /api/passwords/system/{systemId}/active`
**Auth Required:** Yes
**Admin Only:** No

Returns only active passwords for the specified system (if user has permission).

**Response (200):**

```json
[
    {
        "id": 1,
        "system_id": 1,
        "title": "Admin Account",
        "username": "admin@gmail.com",
        "is_active": true
    }
]
```

---

#### Access Password (User Request)

**Endpoint:** `POST /api/passwords/access`
**Auth Required:** Yes
**Admin Only:** No

User requests to access a specific password. The system verifies user permissions before returning the actual password.

**Request Body:**

```json
{
    "system_id": 1,
    "user_id": 5,
    "password_id": 1
}
```

**Response (200):**

```json
{
    "id": 1,
    "system_id": 1,
    "title": "Admin Account",
    "username": "admin@gmail.com",
    "password": "actual_password_value",
    "notes": "Main admin account",
    "system": {
        "id": 1,
        "system_name": "Gmail Admin",
        "category": {
            "id": 1,
            "category_name": "Email Systems"
        }
    }
}
```

---

#### Create Password (Admin)

**Endpoint:** `POST /api/passwords`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "system_id": 1,
    "title": "Backup Admin",
    "username": "backup_admin@gmail.com",
    "password": "BackupPass123!",
    "notes": "Backup administrator account",
    "is_active": true
}
```

**Response (201):**

```json
{
    "id": 3,
    "system_id": 1,
    "title": "Backup Admin",
    "username": "backup_admin@gmail.com",
    "password": "encrypted_password",
    "notes": "Backup administrator account",
    "is_active": true,
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Update Password (Admin)

**Endpoint:** `PUT /api/passwords/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "title": "Backup Admin Updated",
    "username": "backup_admin2@gmail.com",
    "password": "NewBackupPass456!",
    "notes": "Updated backup account",
    "is_active": true
}
```

**Response (200):**

```json
{
    "id": 3,
    "system_id": 1,
    "title": "Backup Admin Updated",
    "username": "backup_admin2@gmail.com",
    "password": "encrypted_password",
    "notes": "Updated backup account",
    "is_active": true,
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T11:00:00Z"
}
```

---

#### Toggle Password Active Status

**Endpoint:** `POST /api/passwords/{id}/toggle-active`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "is_active": false
}
```

**Response (200):**

```json
{
    "id": 3,
    "system_id": 1,
    "title": "Backup Admin Updated",
    "username": "backup_admin2@gmail.com",
    "is_active": false,
    "updated_at": "2025-12-23T11:15:00Z"
}
```

---

#### Delete Password

**Endpoint:** `DELETE /api/passwords/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
{
    "message": "Password deleted successfully"
}
```

---

### 6. PERMISSIONS

#### Get All Permissions

**Endpoint:** `GET /api/permissions`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
[
    {
        "id": 1,
        "admin_id": 1,
        "system_id": 1,
        "user_id": 5,
        "date_time_expiry": "2025-12-31T23:59:59Z",
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    }
]
```

---

#### Get Permission by ID

**Endpoint:** `GET /api/permissions/{id}`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
{
    "id": 1,
    "admin_id": 1,
    "system_id": 1,
    "user_id": 5,
    "date_time_expiry": "2025-12-31T23:59:59Z",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Get Permissions by User

**Endpoint:** `GET /api/permissions/user/{userId}`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
[
    {
        "id": 1,
        "admin_id": 1,
        "system_id": 1,
        "user_id": 5,
        "date_time_expiry": "2025-12-31T23:59:59Z",
        "system": {
            "id": 1,
            "system_name": "Gmail Admin"
        }
    }
]
```

---

#### Get Permissions by System

**Endpoint:** `GET /api/permissions/system/{systemId}`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
[
    {
        "id": 1,
        "admin_id": 1,
        "system_id": 1,
        "user_id": 5,
        "date_time_expiry": "2025-12-31T23:59:59Z",
        "user": {
            "id": 5,
            "username": "jane_smith"
        }
    }
]
```

---

#### Get Active Permissions (User)

**Endpoint:** `GET /api/permissions/active`
**Auth Required:** Yes
**Admin Only:** No

Returns all active permissions for the authenticated user (not expired).

**Response (200):**

```json
[
    {
        "id": 1,
        "admin_id": 1,
        "system_id": 1,
        "user_id": 5,
        "date_time_expiry": "2025-12-31T23:59:59Z",
        "system": {
            "id": 1,
            "system_name": "Gmail Admin"
        }
    }
]
```

---

#### Check Permission

**Endpoint:** `POST /api/permissions/check`
**Auth Required:** Yes
**Admin Only:** No

Verify if user has permission to access a specific system.

**Request Body:**

```json
{
    "system_id": 1,
    "user_id": 5
}
```

**Response (200):**

```json
{
    "has_permission": true,
    "permission": {
        "id": 1,
        "admin_id": 1,
        "system_id": 1,
        "user_id": 5,
        "date_time_expiry": "2025-12-31T23:59:59Z"
    }
}
```

**Response (403) - No Permission:**

```json
{
    "has_permission": false,
    "message": "User does not have permission to access this system"
}
```

---

#### Create Permission (Admin)

**Endpoint:** `POST /api/permissions`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "system_id": 1,
    "user_id": 5,
    "date_time_expiry": "2025-12-31T23:59:59"
}
```

**Response (201):**

```json
{
    "id": 2,
    "admin_id": 1,
    "system_id": 1,
    "user_id": 5,
    "date_time_expiry": "2025-12-31T23:59:59Z",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Update Permission (Admin)

**Endpoint:** `PUT /api/permissions/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "date_time_expiry": "2026-01-31T23:59:59"
}
```

**Response (200):**

```json
{
    "id": 2,
    "admin_id": 1,
    "system_id": 1,
    "user_id": 5,
    "date_time_expiry": "2026-01-31T23:59:59Z",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T11:00:00Z"
}
```

---

#### Delete Permission (Admin)

**Endpoint:** `DELETE /api/permissions/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
{
    "message": "Permission deleted successfully"
}
```

---

### 7. DESCRIPTIONS

#### Get All Descriptions

**Endpoint:** `GET /api/descriptions`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
[
    {
        "id": 1,
        "system_id": 1,
        "description": "Main email system for company administration",
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    }
]
```

---

#### Get Description by ID

**Endpoint:** `GET /api/descriptions/{id}`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
{
    "id": 1,
    "system_id": 1,
    "description": "Main email system for company administration",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Get Description by System

**Endpoint:** `GET /api/descriptions/system/{systemId}`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
{
    "id": 1,
    "system_id": 1,
    "description": "Main email system for company administration",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Create Description (Admin)

**Endpoint:** `POST /api/descriptions`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "system_id": 1,
    "description": "Main email system for company administration"
}
```

**Response (201):**

```json
{
    "id": 1,
    "system_id": 1,
    "description": "Main email system for company administration",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Update Description (Admin)

**Endpoint:** `PUT /api/descriptions/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "description": "Updated: Main email system for all company communications"
}
```

**Response (200):**

```json
{
    "id": 1,
    "system_id": 1,
    "description": "Updated: Main email system for all company communications",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T11:00:00Z"
}
```

---

#### Delete Description (Admin)

**Endpoint:** `DELETE /api/descriptions/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
{
    "message": "Description deleted successfully"
}
```

---

### 8. POLICIES

#### Get All Policies

**Endpoint:** `GET /api/policies`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
[
    {
        "id": 1,
        "name": "Password Security Policy",
        "description": "All passwords must be 12+ characters",
        "regex_text": "All passwords must be 12+ characters",
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    }
]
```

---

#### Get Policy by ID

**Endpoint:** `GET /api/policies/{id}`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
{
    "id": 1,
    "policy_name": "Password Security Policy",
    "description": "All passwords must be 12+ characters",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Create Policy (Admin)

**Endpoint:** `POST /api/policies`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "policy_name": "Password Security Policy",
    "description": "All passwords must be 12+ characters"
}
```

**Response (201):**

```json
{
    "id": 1,
    "policy_name": "Password Security Policy",
    "description": "All passwords must be 12+ characters",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Update Policy (Admin)

**Endpoint:** `PUT /api/policies/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Request Body:**

```json
{
    "policy_name": "Enhanced Password Security Policy",
    "description": "All passwords must be 16+ characters with special characters"
}
```

**Response (200):**

```json
{
    "id": 1,
    "policy_name": "Enhanced Password Security Policy",
    "description": "All passwords must be 16+ characters with special characters",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T11:00:00Z"
}
```

---

#### Delete Policy (Admin)

**Endpoint:** `DELETE /api/policies/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
{
    "message": "Policy deleted successfully"
}
```

---

### 9. USERS

#### Get User by ID

**Endpoint:** `GET /api/users/{id}`
**Auth Required:** Yes
**Admin Only:** No

**Response (200):**

```json
{
    "id": 5,
    "username": "jane_smith",
    "email": "jane@example.com",
    "department_id": 1,
    "admin": false,
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
}
```

---

#### Get All Users (Admin)

**Endpoint:** `GET /api/users`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
[
    {
        "id": 1,
        "username": "admin_user",
        "email": "admin@example.com",
        "department_id": 1,
        "admin": true,
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    },
    {
        "id": 5,
        "username": "jane_smith",
        "email": "jane@example.com",
        "department_id": 1,
        "admin": false,
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    }
]
```

---

#### Search Users (Admin)

**Endpoint:** `GET /api/users/search`
**Auth Required:** Yes
**Admin Only:** Yes

**Query Parameters:**

-   `q` (required): Search term (searches username, email, department)
-   `limit` (optional): Max results (default: 10)

**Example:** `GET /api/users/search?q=jane&limit=5`

**Response (200):**

```json
[
    {
        "id": 5,
        "username": "jane_smith",
        "email": "jane@example.com",
        "department_id": 1,
        "admin": false,
        "created_at": "2025-12-23T10:30:00Z",
        "updated_at": "2025-12-23T10:30:00Z"
    }
]
```

---

#### Get User Permissions

**Endpoint:** `GET /api/users/{id}/permissions`
**Auth Required:** Yes
**Admin Only:** No

Get all permissions for a specific user.

**Response (200):**

```json
[
    {
        "id": 1,
        "admin_id": 1,
        "system_id": 1,
        "user_id": 5,
        "date_time_expiry": "2025-12-31T23:59:59Z",
        "system": {
            "id": 1,
            "system_name": "Gmail Admin"
        }
    }
]
```

---

#### Get User Audit Trails

**Endpoint:** `GET /api/users/{id}/audit-trails`
**Auth Required:** Yes
**Admin Only:** No

Get audit trail logs for user activity.

**Response (200):**

```json
[
    {
        "id": 1,
        "user_id": 5,
        "action": "password_accessed",
        "model_type": "Password",
        "model_id": 1,
        "changes": {
            "accessed_at": "2025-12-23T10:45:00Z"
        },
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2025-12-23T10:45:00Z"
    }
]
```

---

#### Update User

**Endpoint:** `PUT /api/users/{id}`
**Auth Required:** Yes
**Admin Only:** No (users can update own profile)

**Request Body:**

```json
{
    "username": "jane_smith_updated",
    "email": "jane.smith@example.com",
    "department_id": 2
}
```

**Response (200):**

```json
{
    "id": 5,
    "username": "jane_smith_updated",
    "email": "jane.smith@example.com",
    "department_id": 2,
    "admin": false,
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T11:00:00Z"
}
```

---

#### Delete User (Admin)

**Endpoint:** `DELETE /api/users/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
{
    "message": "User deleted successfully"
}
```

---

### 10. AUDIT TRAILS

#### Get All Audit Trails (Admin)

**Endpoint:** `GET /api/audit-trails`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
[
    {
        "id": 1,
        "user_id": 5,
        "action": "password_accessed",
        "model_type": "Password",
        "model_id": 1,
        "changes": {},
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2025-12-23T10:45:00Z"
    }
]
```

---

#### Get Audit Trail by ID (Admin)

**Endpoint:** `GET /api/audit-trails/{id}`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
{
    "id": 1,
    "user_id": 5,
    "action": "password_accessed",
    "model_type": "Password",
    "model_id": 1,
    "changes": {},
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "created_at": "2025-12-23T10:45:00Z"
}
```

---

#### Get Audit Trails by User (Admin)

**Endpoint:** `GET /api/audit-trails/user/{userId}`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
[
    {
        "id": 1,
        "user_id": 5,
        "action": "password_accessed",
        "model_type": "Password",
        "model_id": 1,
        "changes": {},
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2025-12-23T10:45:00Z"
    }
]
```

---

#### Get Audit Trails by Model (Admin)

**Endpoint:** `GET /api/audit-trails/model/{modelType}/{modelId}`
**Auth Required:** Yes
**Admin Only:** Yes

**Parameters:**

-   `modelType`: Type of model (e.g., "Password", "Permission", "User")
-   `modelId`: ID of the model

**Example:** `GET /api/audit-trails/model/Password/1`

**Response (200):**

```json
[
    {
        "id": 1,
        "user_id": 1,
        "action": "password_created",
        "model_type": "Password",
        "model_id": 1,
        "changes": {
            "title": ["", "Admin Account"],
            "username": ["", "admin@gmail.com"]
        },
        "ip_address": "192.168.1.50",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2025-12-23T10:30:00Z"
    },
    {
        "id": 2,
        "user_id": 5,
        "action": "password_accessed",
        "model_type": "Password",
        "model_id": 1,
        "changes": {},
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2025-12-23T10:45:00Z"
    }
]
```

---

#### Export Audit Trails (Admin)

**Endpoint:** `GET /api/audit-trails/export`
**Auth Required:** Yes
**Admin Only:** Yes

**Query Parameters:**

-   `format`: "csv" or "json" (default: "csv")
-   `start_date` (optional): Filter from date
-   `end_date` (optional): Filter to date

**Example:** `GET /api/audit-trails/export?format=csv&start_date=2025-12-01`

**Response:** CSV or JSON file download

---

#### Get Audit Trail Statistics (Admin)

**Endpoint:** `GET /api/audit-trails/statistics`
**Auth Required:** Yes
**Admin Only:** Yes

**Response (200):**

```json
{
    "total_actions": 150,
    "actions_by_type": {
        "password_accessed": 85,
        "password_created": 20,
        "password_updated": 30,
        "permission_granted": 10,
        "user_login": 5
    },
    "actions_by_user": {
        "1": 50,
        "5": 35,
        "3": 65
    },
    "top_accessed_passwords": [
        {
            "password_id": 1,
            "title": "Admin Account",
            "access_count": 45
        }
    ],
    "timestamp": "2025-12-23T11:00:00Z"
}
```

---

## Data Models

### User Model

```javascript
{
  id: number,
  username: string,
  email: string,
  password: string (hashed, never returned),
  department_id: number | null,
  admin: boolean,
  email_verified_at: datetime | null,
  created_at: datetime,
  updated_at: datetime,
  deleted_at: datetime | null (soft delete)
}
```

### Department Model

```javascript
{
  id: number,
  department_name: string,
  created_at: datetime,
  updated_at: datetime,
  deleted_at: datetime | null
}
```

### Category Model

```javascript
{
  id: number,
  category_name: string,
  created_at: datetime,
  updated_at: datetime,
  deleted_at: datetime | null
}
```

### System Model

```javascript
{
  id: number,
  system_name: string,
  category_id: number,
  created_at: datetime,
  updated_at: datetime,
  deleted_at: datetime | null,
  category: Category (nested),
  description: Description (nested),
  passwords: Password[] (nested)
}
```

### Password Model

```javascript
{
  id: number,
  system_id: number,
  title: string,
  username: string,
  password: string (encrypted),
  notes: string | null,
  is_active: boolean,
  created_at: datetime,
  updated_at: datetime,
  deleted_at: datetime | null,
  system: System (nested)
}
```

### Permission Model

```javascript
{
  id: number,
  admin_id: number,
  system_id: number,
  user_id: number,
  date_time_expiry: datetime,
  created_at: datetime,
  updated_at: datetime,
  user: User (nested),
  system: System (nested),
  admin: User (nested)
}
```

### Description Model

```javascript
{
  id: number,
  system_id: number,
  description: string,
  created_at: datetime,
  updated_at: datetime
}
```

### Policy Model

```javascript
{
  id: number,
  policy_name: string,
  description: string,
  created_at: datetime,
  updated_at: datetime
}
```

### AuditTrail Model

```javascript
{
  id: number,
  user_id: number,
  action: string,
  model_type: string,
  model_id: number,
  changes: object,
  ip_address: string,
  user_agent: string,
  created_at: datetime
}
```

---

## Error Handling

### Common HTTP Status Codes

| Status | Meaning          | Example                       |
| ------ | ---------------- | ----------------------------- |
| 200    | Success          | Data retrieved/updated        |
| 201    | Created          | Resource successfully created |
| 400    | Bad Request      | Invalid input data            |
| 401    | Unauthorized     | Missing or invalid token      |
| 403    | Forbidden        | No permission (admin-only)    |
| 404    | Not Found        | Resource doesn't exist        |
| 422    | Validation Error | Input validation failed       |
| 500    | Server Error     | Internal server error         |

### Error Response Format

**Example 401 (Unauthorized):**

```json
{
    "message": "Unauthenticated"
}
```

**Example 403 (Forbidden):**

```json
{
    "message": "User does not have admin privileges"
}
```

**Example 404 (Not Found):**

```json
{
    "message": "Resource not found"
}
```

**Example 422 (Validation Error):**

```json
{
    "message": "The given data was invalid.",
    "errors": {
        "username": ["The username has already been taken."],
        "email": ["The email must be a valid email address."]
    }
}
```

### Vue 3 Error Handling Example

```javascript
const handleApiError = (error) => {
    if (error.response?.status === 401) {
        // Handle unauthorized - redirect to login
        navigateTo("/login");
    } else if (error.response?.status === 403) {
        // Handle forbidden
        showError("You do not have permission to perform this action");
    } else if (error.response?.status === 422) {
        // Handle validation errors
        return error.response.data.errors;
    } else {
        showError(error.message || "An error occurred");
    }
};
```

---

## Usage Examples

### Example 1: User Login & Token Setup

```javascript
// store/auth.js
import { ref } from "vue";

const user = ref(null);
const token = ref(localStorage.getItem("auth_token") || null);

export const useAuth = () => {
    const login = async (username, password) => {
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            token.value = data.token;
            user.value = data.user;
            localStorage.setItem("auth_token", data.token);

            return user.value;
        } catch (error) {
            console.error("Login failed:", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await fetch("/api/logout", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token.value}`,
                    "Content-Type": "application/json",
                },
            });

            token.value = null;
            user.value = null;
            localStorage.removeItem("auth_token");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return { user, token, login, logout };
};
```

---

### Example 2: Fetch Systems with Permissions Check

```javascript
// composables/useSystems.js
import { ref } from "vue";

export const useSystems = () => {
    const systems = ref([]);
    const loading = ref(false);

    const fetchSystems = async (token) => {
        loading.value = true;
        try {
            const response = await fetch("/api/systems", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) throw new Error("Failed to fetch systems");

            systems.value = await response.json();
        } catch (error) {
            console.error("Error fetching systems:", error);
        } finally {
            loading.value = false;
        }
    };

    const checkPermission = async (systemId, token) => {
        try {
            const response = await fetch(`/api/permissions/check`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    system_id: systemId,
                    user_id: parseInt(localStorage.getItem("user_id")),
                }),
            });

            const data = await response.json();
            return data.has_permission;
        } catch (error) {
            console.error("Error checking permission:", error);
            return false;
        }
    };

    return { systems, loading, fetchSystems, checkPermission };
};
```

---

### Example 3: Accessing Protected Password

```javascript
// components/PasswordView.vue
<template>
  <div>
    <button @click="requestPassword" :disabled="loading">
      {{ showPassword ? 'Hide Password' : 'Show Password' }}
    </button>

    <div v-if="showPassword" class="password-display">
      <p>Username: {{ passwordData?.username }}</p>
      <p>Password: {{ passwordData?.password }}</p>
      <p v-if="passwordData?.notes">Notes: {{ passwordData?.notes }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  systemId: Number,
  passwordId: Number,
  token: String,
  userId: Number
})

const passwordData = ref(null)
const showPassword = ref(false)
const loading = ref(false)

const requestPassword = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/passwords/access', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${props.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        system_id: props.systemId,
        password_id: props.passwordId,
        user_id: props.userId
      })
    })

    if (!response.ok) throw new Error('Failed to access password')

    passwordData.value = await response.json()
    showPassword.value = !showPassword.value
  } catch (error) {
    console.error('Error accessing password:', error)
    alert('You do not have permission to access this password')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.password-display {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
  margin-top: 15px;
}
</style>
```

---

### Example 4: Admin - Create Permission

```javascript
// components/GrantAccess.vue
<template>
  <form @submit.prevent="grantAccess">
    <select v-model="formData.user_id" required>
      <option value="">Select User</option>
      <option v-for="user in users" :key="user.id" :value="user.id">
        {{ user.username }}
      </option>
    </select>

    <select v-model="formData.system_id" required>
      <option value="">Select System</option>
      <option v-for="system in systems" :key="system.id" :value="system.id">
        {{ system.system_name }}
      </option>
    </select>

    <input
      v-model="formData.date_time_expiry"
      type="datetime-local"
      required
    />

    <button type="submit" :disabled="loading">Grant Access</button>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const formData = ref({
  user_id: '',
  system_id: '',
  date_time_expiry: ''
})

const loading = ref(false)
const token = localStorage.getItem('auth_token')
const users = ref([])
const systems = ref([])

onMounted(async () => {
  // Fetch users
  const usersRes = await fetch('/api/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  users.value = await usersRes.json()

  // Fetch systems
  const systemsRes = await fetch('/api/systems', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  systems.value = await systemsRes.json()
})

const grantAccess = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/permissions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData.value)
    })

    if (!response.ok) throw new Error('Failed to grant access')

    alert('Access granted successfully')
    formData.value = { user_id: '', system_id: '', date_time_expiry: '' }
  } catch (error) {
    console.error('Error granting access:', error)
    alert('Failed to grant access')
  } finally {
    loading.value = false
  }
}
</script>
```

---

## Key Notes for Integration

1. **Authentication**: Always store the token from login/register in `localStorage` and include it in the `Authorization` header for all subsequent requests.

2. **Token Format**: Use `Bearer <token>` format in the Authorization header.

3. **Validation**: The API validates all input data. Check the 422 response for validation errors.

4. **Permissions**: Regular users can only access systems they have active permissions for. Admin users can access all resources.

5. **Timestamps**: All timestamps are in ISO 8601 format (UTC). Convert as needed in your Vue 3 app.

6. **Soft Deletes**: Deleted users, departments, categories, systems, and passwords may still exist in the database with a `deleted_at` timestamp.

7. **Password Encryption**: User passwords are hashed. System passwords are encrypted. Never store plaintext passwords.

8. **Expiry**: Permissions have `date_time_expiry`. Check this timestamp to verify access validity.

9. **Audit Logs**: Most actions are logged in the audit trail. Admins can view these for security purposes.

10. **CORS**: Ensure your frontend is running on `http://localhost` or configure CORS in the backend accordingly.

---

## Support & Debugging

For API issues:

1. Check the HTTP status code in the response
2. Review the error message and validation errors
3. Verify your token is valid and not expired
4. Check user permissions for the requested resource
5. Refer to the audit trail logs for debugging

For further assistance, review the model relationships in the source code or check the request/response examples above.
