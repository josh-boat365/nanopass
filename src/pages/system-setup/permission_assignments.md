# Permissions CRUD Documentation

Complete reference for all Permission management operations in the Nanopass Backend API.

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Create Operations](#create-operations)
4. [Read Operations](#read-operations)
5. [Update Operations](#update-operations)
6. [Delete Operations](#delete-operations)
7. [Error Codes](#error-codes)
8. [Request/Response Examples](#requestresponse-examples)
9. [Validation Rules](#validation-rules)
10. [Best Practices](#best-practices)

---

## Overview

The Permission system controls which users have access to which systems. Each permission:

-   Grants a user access to a specific system
-   Has an expiry date (user loses access after this date)
-   Is created and managed by admin users only
-   Is logged in the audit trail for compliance

### Permission Model Structure

```json
{
    "id": 1,
    "user_id": 5,
    "system_id": 3,
    "admin_id": 1,
    "date_time_expiry": "2025-12-31T23:59:59Z",
    "created_at": "2025-01-03T14:00:00Z",
    "updated_at": "2025-01-03T14:00:00Z"
}
```

### Base URL

```
http://your-domain/api/permissions
```

---

## Authentication & Authorization

### Required Headers

All requests must include:

```bash
Authorization: Bearer {token}
Content-Type: application/json
```

### Admin-Only Access

**All permission operations require admin role.** Non-admin users will receive:

```json
{
    "success": false,
    "message": "Admin access required to perform this action"
}
```

**Status Code**: `403 Forbidden`

### How to Authenticate

```javascript
// Get token from Sanctum authentication
const token = localStorage.getItem("auth_token");

// Include in all requests
const config = {
    headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    },
};
```

---

## Create Operations

### Single Permission Creation

Create a single permission for one user on one system.

#### Endpoint

```http
POST /api/permissions
```

#### Request

```json
{
    "user_id": 5,
    "system_id": 3,
    "date_time_expiry": "2025-03-31 23:59:59"
}
```

#### Parameters

| Field              | Type   | Required | Description                           |
| ------------------ | ------ | -------- | ------------------------------------- |
| `user_id`          | int    | Yes      | ID of user to grant access            |
| `system_id`        | int    | Yes      | ID of system to grant access to       |
| `date_time_expiry` | string | Yes      | Expiry datetime (YYYY-MM-DD HH:MM:SS) |

#### Success Response

**Status**: `201 Created`

```json
{
    "success": true,
    "message": "Permission created successfully",
    "data": {
        "id": 42,
        "user_id": 5,
        "system_id": 3,
        "admin_id": 1,
        "date_time_expiry": "2025-03-31T23:59:59Z",
        "created_at": "2025-01-03T14:05:22Z"
    }
}
```

#### cURL Example

```bash
curl -X POST http://localhost/api/permissions \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 5,
    "system_id": 3,
    "date_time_expiry": "2025-03-31 23:59:59"
  }'
```

#### JavaScript/Axios Example

```javascript
import axios from "axios";

const createPermission = async (userId, systemId, expiryDate) => {
    try {
        const response = await axios.post(
            "/api/permissions",
            {
                user_id: userId,
                system_id: systemId,
                date_time_expiry: expiryDate,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data.data;
    } catch (error) {
        console.error("Error creating permission:", error.response.data);
        throw error;
    }
};
```

---

### Bulk Permission Creation

Create multiple permissions for a user at once.

#### Endpoint

```http
POST /api/permissions
```

#### Request

```json
{
    "user_id": 5,
    "permissions": [
        {
            "system_id": 1,
            "date_time_expiry": "2025-03-31 23:59:59"
        },
        {
            "system_id": 3,
            "date_time_expiry": "2025-04-30 23:59:59"
        },
        {
            "system_id": 5,
            "date_time_expiry": "2025-12-31 23:59:59"
        }
    ]
}
```

#### Parameters

| Field                            | Type   | Required | Description                           |
| -------------------------------- | ------ | -------- | ------------------------------------- |
| `user_id`                        | int    | Yes      | ID of user to grant access            |
| `permissions`                    | array  | Yes      | Array of permissions to create        |
| `permissions[].system_id`        | int    | Yes      | System ID for this permission         |
| `permissions[].date_time_expiry` | string | Yes      | Expiry datetime (YYYY-MM-DD HH:MM:SS) |

#### Success Response

**Status**: `201 Created`

```json
{
    "success": true,
    "message": "Permissions created successfully",
    "data": [
        {
            "id": 42,
            "user_id": 5,
            "system_id": 1,
            "admin_id": 1,
            "date_time_expiry": "2025-03-31T23:59:59Z",
            "created_at": "2025-01-03T14:05:22Z"
        },
        {
            "id": 43,
            "user_id": 5,
            "system_id": 3,
            "admin_id": 1,
            "date_time_expiry": "2025-04-30T23:59:59Z",
            "created_at": "2025-01-03T14:05:22Z"
        },
        {
            "id": 44,
            "user_id": 5,
            "system_id": 5,
            "admin_id": 1,
            "date_time_expiry": "2025-12-31T23:59:59Z",
            "created_at": "2025-01-03T14:05:22Z"
        }
    ],
    "meta": {
        "count": 3,
        "user_id": 5
    }
}
```

#### cURL Example

```bash
curl -X POST http://localhost/api/permissions \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 5,
    "permissions": [
      {"system_id": 1, "date_time_expiry": "2025-03-31 23:59:59"},
      {"system_id": 3, "date_time_expiry": "2025-04-30 23:59:59"},
      {"system_id": 5, "date_time_expiry": "2025-12-31 23:59:59"}
    ]
  }'
```

#### JavaScript/Axios Example

```javascript
const createBulkPermissions = async (userId, permissionsList) => {
    try {
        const response = await axios.post(
            "/api/permissions",
            {
                user_id: userId,
                permissions: permissionsList,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data.data;
    } catch (error) {
        console.error(
            "Error creating permissions:",
            error.response.data.errors
        );
        throw error;
    }
};

// Usage
const permissions = [
    { system_id: 1, date_time_expiry: "2025-03-31 23:59:59" },
    { system_id: 3, date_time_expiry: "2025-04-30 23:59:59" },
];

const created = await createBulkPermissions(5, permissions);
```

---

## Read Operations

### List All Permissions

Retrieve all permissions (paginated).

#### Endpoint

```http
GET /api/permissions
```

#### Query Parameters

| Parameter  | Type | Default | Description                |
| ---------- | ---- | ------- | -------------------------- |
| `page`     | int  | 1       | Page number for pagination |
| `per_page` | int  | 15      | Items per page             |

#### Success Response

**Status**: `200 OK`

```json
{
    "success": true,
    "message": "Permissions retrieved successfully",
    "data": [
        {
            "id": 1,
            "user_id": 2,
            "system_id": 1,
            "admin_id": 1,
            "date_time_expiry": "2025-12-31T23:59:59Z",
            "created_at": "2025-01-02T10:30:00Z"
        },
        {
            "id": 2,
            "user_id": 3,
            "system_id": 2,
            "admin_id": 1,
            "date_time_expiry": "2025-06-30T23:59:59Z",
            "created_at": "2025-01-02T11:00:00Z"
        }
    ],
    "meta": {
        "current_page": 1,
        "per_page": 15,
        "total": 42,
        "last_page": 3
    }
}
```

#### cURL Example

```bash
curl -X GET 'http://localhost/api/permissions?page=1&per_page=20' \
  -H "Authorization: Bearer your_token"
```

#### JavaScript/Axios Example

```javascript
const listPermissions = async (page = 1, perPage = 15) => {
    try {
        const response = await axios.get("/api/permissions", {
            params: {
                page,
                per_page: perPage,
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return {
            permissions: response.data.data,
            pagination: response.data.meta,
        };
    } catch (error) {
        console.error("Error fetching permissions:", error.response.data);
        throw error;
    }
};
```

---

### Get Specific Permission

Retrieve details of a single permission.

#### Endpoint

```http
GET /api/permissions/{id}
```

#### URL Parameters

| Parameter | Type | Description   |
| --------- | ---- | ------------- |
| `id`      | int  | Permission ID |

#### Success Response

**Status**: `200 OK`

```json
{
    "success": true,
    "message": "Permission retrieved successfully",
    "data": {
        "id": 42,
        "user_id": 5,
        "system_id": 3,
        "admin_id": 1,
        "date_time_expiry": "2025-03-31T23:59:59Z",
        "created_at": "2025-01-03T14:05:22Z",
        "updated_at": "2025-01-03T14:05:22Z",
        "user": {
            "id": 5,
            "name": "John Doe",
            "email": "john@example.com"
        },
        "system": {
            "id": 3,
            "name": "Database Admin",
            "description": "Database administration system"
        }
    }
}
```

#### cURL Example

```bash
curl -X GET http://localhost/api/permissions/42 \
  -H "Authorization: Bearer your_token"
```

#### JavaScript/Axios Example

```javascript
const getPermission = async (permissionId) => {
    try {
        const response = await axios.get(`/api/permissions/${permissionId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data.data;
    } catch (error) {
        if (error.response?.status === 404) {
            console.error("Permission not found");
        }
        throw error;
    }
};
```

---

### Get Permissions for a User

List all permissions for a specific user.

#### Endpoint

```http
GET /api/permissions?user_id={userId}
```

#### Query Parameters

| Parameter | Type | Required | Description    |
| --------- | ---- | -------- | -------------- |
| `user_id` | int  | Yes      | Filter by user |

#### Success Response

**Status**: `200 OK`

```json
{
    "success": true,
    "message": "Permissions retrieved successfully",
    "data": [
        {
            "id": 42,
            "user_id": 5,
            "system_id": 1,
            "date_time_expiry": "2025-03-31T23:59:59Z"
        },
        {
            "id": 43,
            "user_id": 5,
            "system_id": 3,
            "date_time_expiry": "2025-04-30T23:59:59Z"
        }
    ],
    "meta": {
        "count": 2,
        "user_id": 5,
        "active_count": 2,
        "expired_count": 0
    }
}
```

#### JavaScript/Axios Example

```javascript
const getUserPermissions = async (userId) => {
    try {
        const response = await axios.get("/api/permissions", {
            params: { user_id: userId },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data.data;
    } catch (error) {
        console.error("Error fetching user permissions:", error);
        throw error;
    }
};
```

---

## Update Operations

### Single Permission Update

Update a single permission by ID.

#### Endpoint

```http
PUT /api/permissions/{id}
```

#### URL Parameters

| Parameter | Type | Description   |
| --------- | ---- | ------------- |
| `id`      | int  | Permission ID |

#### Request

```json
{
    "date_time_expiry": "2025-06-30 23:59:59"
}
```

#### Parameters

| Field              | Type   | Required | Description                               |
| ------------------ | ------ | -------- | ----------------------------------------- |
| `date_time_expiry` | string | Yes      | New expiry datetime (YYYY-MM-DD HH:MM:SS) |

#### Success Response

**Status**: `200 OK`

```json
{
    "success": true,
    "message": "Permission updated successfully",
    "data": {
        "id": 42,
        "user_id": 5,
        "system_id": 3,
        "admin_id": 1,
        "date_time_expiry": "2025-06-30T23:59:59Z",
        "updated_at": "2025-01-03T14:10:00Z"
    }
}
```

#### cURL Example

```bash
curl -X PUT http://localhost/api/permissions/42 \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "date_time_expiry": "2025-06-30 23:59:59"
  }'
```

#### JavaScript/Axios Example

```javascript
const updatePermission = async (permissionId, newExpiryDate) => {
    try {
        const response = await axios.put(
            `/api/permissions/${permissionId}`,
            {
                date_time_expiry: newExpiryDate,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data.data;
    } catch (error) {
        console.error("Error updating permission:", error.response.data);
        throw error;
    }
};
```

---

### Bulk Permission Update

Update multiple permissions at once (by IDs).

#### Endpoint

```http
PUT /api/permissions
```

#### Request

```json
{
    "ids": [42, 43, 44],
    "date_time_expiry": "2025-12-31 23:59:59"
}
```

#### Parameters

| Field              | Type   | Required | Description                               |
| ------------------ | ------ | -------- | ----------------------------------------- |
| `ids`              | array  | Yes      | Array of permission IDs                   |
| `date_time_expiry` | string | Yes      | New expiry datetime (YYYY-MM-DD HH:MM:SS) |

#### Success Response

**Status**: `200 OK`

```json
{
    "success": true,
    "message": "Permissions updated successfully",
    "data": [
        {
            "id": 42,
            "user_id": 5,
            "system_id": 1,
            "date_time_expiry": "2025-12-31T23:59:59Z",
            "updated_at": "2025-01-03T14:10:00Z"
        },
        {
            "id": 43,
            "user_id": 5,
            "system_id": 3,
            "date_time_expiry": "2025-12-31T23:59:59Z",
            "updated_at": "2025-01-03T14:10:00Z"
        },
        {
            "id": 44,
            "user_id": 5,
            "system_id": 5,
            "date_time_expiry": "2025-12-31T23:59:59Z",
            "updated_at": "2025-01-03T14:10:00Z"
        }
    ],
    "meta": {
        "count": 3,
        "updated_count": 3
    }
}
```

#### cURL Example

```bash
curl -X PUT http://localhost/api/permissions \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [42, 43, 44],
    "date_time_expiry": "2025-12-31 23:59:59"
  }'
```

#### JavaScript/Axios Example

```javascript
const bulkUpdatePermissions = async (permissionIds, newExpiryDate) => {
    try {
        const response = await axios.put(
            "/api/permissions",
            {
                ids: permissionIds,
                date_time_expiry: newExpiryDate,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data.data;
    } catch (error) {
        console.error("Error updating permissions:", error.response.data);
        throw error;
    }
};

// Usage
const updated = await bulkUpdatePermissions(
    [42, 43, 44],
    "2025-12-31 23:59:59"
);
```

---

## Delete Operations

### Single Permission Delete

Delete a single permission by ID.

#### Endpoint

```http
DELETE /api/permissions/{id}
```

#### URL Parameters

| Parameter | Type | Description   |
| --------- | ---- | ------------- |
| `id`      | int  | Permission ID |

#### Success Response

**Status**: `200 OK`

```json
{
    "success": true,
    "message": "Permission deleted successfully",
    "data": {
        "id": 42,
        "user_id": 5,
        "system_id": 3,
        "deleted_at": "2025-01-03T14:15:00Z"
    }
}
```

#### cURL Example

```bash
curl -X DELETE http://localhost/api/permissions/42 \
  -H "Authorization: Bearer your_token"
```

#### JavaScript/Axios Example

```javascript
const deletePermission = async (permissionId) => {
    try {
        const response = await axios.delete(
            `/api/permissions/${permissionId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data.data;
    } catch (error) {
        if (error.response?.status === 404) {
            console.error("Permission not found");
        }
        throw error;
    }
};
```

---

### Bulk Permission Delete

Delete multiple permissions at once.

#### Endpoint

```http
DELETE /api/permissions
```

#### Request

```json
{
    "ids": [42, 43, 44]
}
```

#### Parameters

| Field | Type  | Required | Description             |
| ----- | ----- | -------- | ----------------------- |
| `ids` | array | Yes      | Array of permission IDs |

#### Success Response

**Status**: `200 OK`

```json
{
    "success": true,
    "message": "Permissions deleted successfully",
    "data": [
        {
            "id": 42,
            "user_id": 5,
            "system_id": 1,
            "deleted_at": "2025-01-03T14:15:00Z"
        },
        {
            "id": 43,
            "user_id": 5,
            "system_id": 3,
            "deleted_at": "2025-01-03T14:15:00Z"
        },
        {
            "id": 44,
            "user_id": 5,
            "system_id": 5,
            "deleted_at": "2025-01-03T14:15:00Z"
        }
    ],
    "meta": {
        "count": 3,
        "deleted_count": 3
    }
}
```

#### cURL Example

```bash
curl -X DELETE http://localhost/api/permissions \
  -H "Authorization: Bearer your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [42, 43, 44]
  }'
```

#### JavaScript/Axios Example

```javascript
const bulkDeletePermissions = async (permissionIds) => {
    try {
        const response = await axios.delete("/api/permissions", {
            data: {
                ids: permissionIds,
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data.data;
    } catch (error) {
        console.error("Error deleting permissions:", error.response.data);
        throw error;
    }
};

// Usage
const deleted = await bulkDeletePermissions([42, 43, 44]);
```

---

## Error Codes

### 400 Bad Request

Invalid request format or missing required fields.

```json
{
    "success": false,
    "message": "The given data was invalid.",
    "errors": {
        "user_id": ["The user id field is required"]
    }
}
```

---

### 401 Unauthorized

Missing or invalid authentication token.

```json
{
    "success": false,
    "message": "Unauthorized - Missing or invalid token"
}
```

---

### 403 Forbidden

User lacks admin permissions.

```json
{
    "success": false,
    "message": "Admin access required to perform this action"
}
```

---

### 404 Not Found

Permission or resource does not exist.

```json
{
    "success": false,
    "message": "Permission not found"
}
```

---

### 422 Unprocessable Entity

Validation failed (invalid data).

```json
{
    "success": false,
    "message": "The given data was invalid.",
    "errors": {
        "date_time_expiry": ["The date must be a valid date after now"],
        "system_id": ["The selected system id is invalid"]
    }
}
```

---

### 500 Internal Server Error

Server-side error. Check server logs.

```json
{
    "success": false,
    "message": "Internal server error"
}
```

---

## Request/Response Examples

### Example 1: Create Single Permission

#### Request

```bash
POST /api/permissions HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "user_id": 5,
    "system_id": 3,
    "date_time_expiry": "2025-03-31 23:59:59"
}
```

#### Response

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
    "success": true,
    "message": "Permission created successfully",
    "data": {
        "id": 42,
        "user_id": 5,
        "system_id": 3,
        "admin_id": 1,
        "date_time_expiry": "2025-03-31T23:59:59Z",
        "created_at": "2025-01-03T14:05:22Z"
    }
}
```

---

### Example 2: Create Multiple Permissions

#### Request

```bash
POST /api/permissions HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "user_id": 5,
    "permissions": [
        { "system_id": 1, "date_time_expiry": "2025-03-31 23:59:59" },
        { "system_id": 3, "date_time_expiry": "2025-04-30 23:59:59" },
        { "system_id": 5, "date_time_expiry": "2025-12-31 23:59:59" }
    ]
}
```

#### Response

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
    "success": true,
    "message": "Permissions created successfully",
    "data": [
        { "id": 42, "user_id": 5, "system_id": 1, "date_time_expiry": "2025-03-31T23:59:59Z" },
        { "id": 43, "user_id": 5, "system_id": 3, "date_time_expiry": "2025-04-30T23:59:59Z" },
        { "id": 44, "user_id": 5, "system_id": 5, "date_time_expiry": "2025-12-31T23:59:59Z" }
    ],
    "meta": { "count": 3, "user_id": 5 }
}
```

---

### Example 3: Update Permission Expiry

#### Request

```bash
PUT /api/permissions/42 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "date_time_expiry": "2025-06-30 23:59:59"
}
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
    "success": true,
    "message": "Permission updated successfully",
    "data": {
        "id": 42,
        "user_id": 5,
        "system_id": 3,
        "date_time_expiry": "2025-06-30T23:59:59Z",
        "updated_at": "2025-01-03T14:10:00Z"
    }
}
```

---

### Example 4: Delete Permission

#### Request

```bash
DELETE /api/permissions/42 HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

{
    "success": true,
    "message": "Permission deleted successfully",
    "data": {
        "id": 42,
        "deleted_at": "2025-01-03T14:15:00Z"
    }
}
```

---

### Example 5: Validation Error

#### Request (Invalid Expiry Date)

```bash
POST /api/permissions HTTP/1.1
Host: api.example.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
    "user_id": 5,
    "system_id": 3,
    "date_time_expiry": "2020-01-01 23:59:59"
}
```

#### Response

```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
    "success": false,
    "message": "The given data was invalid.",
    "errors": {
        "date_time_expiry": [
            "The date must be a valid date after now"
        ]
    }
}
```

---

## Validation Rules

### CREATE - Single Permission

| Field              | Rule                                           |
| ------------------ | ---------------------------------------------- |
| `user_id`          | Required, integer, must exist in users table   |
| `system_id`        | Required, integer, must exist in systems table |
| `date_time_expiry` | Required, datetime, must be future date        |

### CREATE - Bulk Permissions

| Field                            | Rule                                         |
| -------------------------------- | -------------------------------------------- |
| `user_id`                        | Required, integer, must exist in users table |
| `permissions`                    | Required, array, minimum 1 item              |
| `permissions[].system_id`        | Required, integer, must exist                |
| `permissions[].date_time_expiry` | Required, datetime, must be future           |

### UPDATE - Single Permission

| Field              | Rule                               |
| ------------------ | ---------------------------------- |
| `date_time_expiry` | Required, datetime, must be future |

### UPDATE - Bulk Permissions

| Field              | Rule                                 |
| ------------------ | ------------------------------------ |
| `ids`              | Required, array, minimum 1 item      |
| `ids[]`            | Integer, must be valid permission ID |
| `date_time_expiry` | Required, datetime, must be future   |

### DELETE - Bulk Permissions

| Field   | Rule                                 |
| ------- | ------------------------------------ |
| `ids`   | Required, array, minimum 1 item      |
| `ids[]` | Integer, must be valid permission ID |

---

## Best Practices

### 1. Always Use Admin Token

```javascript
// ✅ Correct
const token = localStorage.getItem("admin_token");

// ❌ Wrong - Regular user token won't work
const token = localStorage.getItem("user_token");
```

### 2. Validate Date Format

```javascript
// ✅ Correct format
const expiryDate = "2025-12-31 23:59:59";

// ❌ Wrong formats
("12/31/2025"); // American format
("31-12-2025 23:59:59"); // DD-MM-YYYY
("2025-12-31T23:59:59Z"); // ISO format (backend converts)
```

### 3. Check Expiry Dates

```javascript
// ✅ Always verify dates are in the future
const expiryDate = new Date("2025-12-31");
if (expiryDate <= new Date()) {
    console.error("Expiry date must be in the future");
    return;
}
```

### 4. Use Bulk Operations for Multiple Records

```javascript
// ✅ Efficient - 1 API call
const response = await axios.post('/api/permissions', {
    user_id: 5,
    permissions: [
        { system_id: 1, date_time_expiry: '2025-03-31 23:59:59' },
        { system_id: 3, date_time_expiry: '2025-04-30 23:59:59' }
    ]
});

// ❌ Inefficient - 2 API calls
await axios.post('/api/permissions', { user_id: 5, system_id: 1, ... });
await axios.post('/api/permissions', { user_id: 5, system_id: 3, ... });
```

### 5. Handle Errors Properly

```javascript
try {
    const response = await axios.post("/api/permissions", data);
    // Success handling
} catch (error) {
    if (error.response?.status === 422) {
        // Validation errors
        const errors = error.response.data.errors;
        console.log("Validation failed:", errors);
    } else if (error.response?.status === 403) {
        // Permission denied
        console.log("Admin access required");
    } else if (error.response?.status === 404) {
        // Not found
        console.log("User or system not found");
    } else {
        // Other errors
        console.log("Server error:", error.message);
    }
}
```

### 6. Cache Permissions Locally

```javascript
// ✅ Good - Cache to reduce API calls
const permissionsCache = {};

const getUserPermissions = async (userId) => {
    if (permissionsCache[userId]) {
        return permissionsCache[userId];
    }

    const response = await axios.get("/api/permissions", {
        params: { user_id: userId },
    });

    permissionsCache[userId] = response.data.data;
    return response.data.data;
};
```

### 7. Batch Updates Instead of Individual Updates

```javascript
// ✅ Efficient - Single API call for all updates
const permissionIds = [1, 5, 8, 12];
const newExpiry = "2025-12-31 23:59:59";

const response = await axios.put("/api/permissions", {
    ids: permissionIds,
    date_time_expiry: newExpiry,
});

// ❌ Inefficient - Multiple API calls
for (const id of permissionIds) {
    await axios.put(`/api/permissions/${id}`, {
        date_time_expiry: newExpiry,
    });
}
```

### 8. Implement Audit Logging

All permission changes are automatically logged. To retrieve audit logs:

```javascript
// Get audit trail for permission changes
const auditLogs = await axios.get("/api/audit-trail", {
    params: {
        resource_type: "Permission",
        resource_id: 42,
    },
});

console.log("Who changed this permission:", auditLogs.data.data);
```

### 9. Set Reasonable Expiry Dates

```javascript
// ✅ Good expiry dates
"2025-06-30 23:59:59"; // 6 months from now
"2025-12-31 23:59:59"; // End of year
"2026-01-31 23:59:59"; // 1 year from now

// ❌ Bad expiry dates
"2025-01-04 00:00:00"; // Too soon (tomorrow)
"2100-12-31 23:59:59"; // Too far (75 years)
```

### 10. Use Role-Based Access Control

```javascript
// Only admin users can manage permissions
if (!isUserAdmin()) {
    console.error("Only admins can manage permissions");
    return;
}

// Always include auth header
const config = {
    headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
    },
};
```

---

## Complete Working Example

```javascript
class PermissionManager {
    constructor(apiClient, adminToken) {
        this.api = apiClient;
        this.token = adminToken;
        this.baseURL = "/api/permissions";
    }

    // Helper to get config with auth header
    getConfig() {
        return {
            headers: {
                Authorization: `Bearer ${this.token}`,
                "Content-Type": "application/json",
            },
        };
    }

    // CREATE operations
    async createSingle(userId, systemId, expiryDate) {
        const response = await this.api.post(
            this.baseURL,
            {
                user_id: userId,
                system_id: systemId,
                date_time_expiry: expiryDate,
            },
            this.getConfig()
        );
        return response.data.data;
    }

    async createBulk(userId, permissions) {
        const response = await this.api.post(
            this.baseURL,
            {
                user_id: userId,
                permissions,
            },
            this.getConfig()
        );
        return response.data.data;
    }

    // READ operations
    async getAll(page = 1, perPage = 15) {
        const response = await this.api.get(this.baseURL, {
            params: { page, per_page: perPage },
            ...this.getConfig(),
        });
        return response.data.data;
    }

    async getById(permissionId) {
        const response = await this.api.get(
            `${this.baseURL}/${permissionId}`,
            this.getConfig()
        );
        return response.data.data;
    }

    async getByUserId(userId) {
        const response = await this.api.get(this.baseURL, {
            params: { user_id: userId },
            ...this.getConfig(),
        });
        return response.data.data;
    }

    // UPDATE operations
    async updateSingle(permissionId, expiryDate) {
        const response = await this.api.put(
            `${this.baseURL}/${permissionId}`,
            { date_time_expiry: expiryDate },
            this.getConfig()
        );
        return response.data.data;
    }

    async updateBulk(permissionIds, expiryDate) {
        const response = await this.api.put(
            this.baseURL,
            {
                ids: permissionIds,
                date_time_expiry: expiryDate,
            },
            this.getConfig()
        );
        return response.data.data;
    }

    // DELETE operations
    async deleteSingle(permissionId) {
        const response = await this.api.delete(
            `${this.baseURL}/${permissionId}`,
            this.getConfig()
        );
        return response.data.data;
    }

    async deleteBulk(permissionIds) {
        const response = await this.api.delete(this.baseURL, {
            data: { ids: permissionIds },
            ...this.getConfig(),
        });
        return response.data.data;
    }
}

// Usage
const permManager = new PermissionManager(axios, adminToken);

// Create permissions
const created = await permManager.createBulk(5, [
    { system_id: 1, date_time_expiry: "2025-03-31 23:59:59" },
    { system_id: 3, date_time_expiry: "2025-04-30 23:59:59" },
]);

// Get user permissions
const userPerms = await permManager.getByUserId(5);

// Update expiry
const updated = await permManager.updateBulk([42, 43], "2025-12-31 23:59:59");

// Delete
await permManager.deleteSingle(42);
```

---

## Summary

| Operation     | Endpoint                | Method | Notes                     |
| ------------- | ----------------------- | ------ | ------------------------- |
| Create Single | `/api/permissions`      | POST   | Single user/system        |
| Create Bulk   | `/api/permissions`      | POST   | Multiple systems for user |
| Read All      | `/api/permissions`      | GET    | Paginated                 |
| Read One      | `/api/permissions/{id}` | GET    | Single permission         |
| Update Single | `/api/permissions/{id}` | PUT    | Update expiry             |
| Update Bulk   | `/api/permissions`      | PUT    | Update multiple           |
| Delete Single | `/api/permissions/{id}` | DELETE | Single delete             |
| Delete Bulk   | `/api/permissions`      | DELETE | Multiple delete           |

**All operations require admin authentication.**
