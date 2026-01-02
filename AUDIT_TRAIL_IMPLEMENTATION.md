# Audit Trail Implementation Guide

## Overview

A comprehensive audit trail system has been implemented for the NanoPass Backend to track all critical operations including:

-   User password verification and password access
-   Personal keys management (CREATE, UPDATE, DELETE, VERIFY)
-   Permission assignment, updates, and revocation
-   System CRUD operations
-   User management (CREATE, UPDATE, DELETE)

## Components

### 1. AuditService (`app/Services/AuditService.php`)

A utility service class providing static methods for logging various types of audit events.

**Key Methods:**

-   `log()` - Generic audit logging method
-   `logFromRequest()` - Log with request context (IP, user-agent)
-   `logPasswordAccess()` - Log password access events
-   `logPersonalKeyAccess()` - Log personal key access events
-   `logPermission()` - Log permission operations
-   `logSystem()` - Log system operations
-   `logUser()` - Log user operations
-   `getModelHistory()` - Retrieve audit history for a specific model
-   `getUserHistory()` - Retrieve audit history for a specific user
-   `getRecentActivity()` - Retrieve recent activity across all users

### 2. Enhanced Models

All core models now have audit trail relationships:

**User.php**

```php
public function auditTrails()
{
    return $this->hasMany(AuditTrail::class);
}
```

**PersonalKey.php**

```php
public function auditTrails()
{
    return $this->morphMany(AuditTrail::class, 'model');
}
```

**Password.php** (Already has morphMany relationship)

```php
public function auditTrails()
{
    return $this->morphMany(AuditTrail::class, 'model');
}
```

**Permission.php**

```php
public function auditTrails()
{
    return $this->morphMany(AuditTrail::class, 'model');
}
```

**System.php** (Already has morphMany relationship)

```php
public function auditTrails()
{
    return $this->morphMany(AuditTrail::class, 'model');
}
```

### 3. Enhanced Controllers

All controllers now use AuditService for logging operations:

#### PersonalKeyController

-   **store()** - Logs personal key creation
-   **update()** - Logs personal key updates
-   **destroy()** - Logs personal key deletion
-   **verify()** - Logs personal key verification/access

Events logged:

-   `CREATE` - When a personal key is created
-   `UPDATE` - When a personal key is updated
-   `DELETE` - When a personal key is deleted
-   `PERSONAL_KEY_VERIFY` - When user verifies password to access a personal key

#### PasswordController

-   **store()** - Logs password creation (admin only)
-   **update()** - Logs password updates (admin only)
-   **destroy()** - Logs password deletion (admin only)
-   **getPassword()** - Logs password access events

Events logged:

-   `CREATE` - When a password is created
-   `UPDATE` - When a password is updated
-   `DELETE` - When a password is deleted
-   `ACCESS_PASSWORD` - When a user views a password

#### PermissionController

-   **store()** - Logs permission assignment
-   **update()** - Logs permission updates
-   **destroy()** - Logs permission revocation

Events logged:

-   `PERMISSION_ASSIGN` - When admin assigns a permission to a user
-   `PERMISSION_UPDATE` - When admin updates a permission
-   `PERMISSION_REVOKE` - When admin revokes a permission

#### SystemController

-   **store()** - Logs system creation (admin only)
-   **update()** - Logs system updates (admin only)
-   **destroy()** - Logs system deletion (admin only)

Events logged:

-   `CREATE` - When a system is created
-   `UPDATE` - When a system is updated
-   `DELETE` - When a system is deleted

#### UserController

-   **update()** - Logs user profile updates
-   **destroy()** - Logs user deletion (admin only)

Events logged:

-   `UPDATE` - When a user is updated
-   `DELETE` - When a user is deleted

### 4. AuditTrailController

Enhanced controller for querying audit trails with multiple endpoints:

**Public Methods:**

-   `index()` - Get audit trails (admin sees all, users see their own)
-   `show($id)` - Get a specific audit trail
-   `getByUser($userId)` - Get audit trails for a specific user
-   `getByModel($modelType, $modelId)` - Get audit trails for a specific model (admin only)
-   `getRecentActivity()` - Get recent activity across the system (admin only)
-   `getPasswordAccessLogs()` - Get password access logs with filtering (admin only)
-   `getPermissionLogs()` - Get permission-related logs with filtering (admin only)
-   `getPersonalKeyAccessLogs()` - Get personal key access logs
-   `getAdminActivityLogs()` - Get all admin activity logs (admin only)
-   `export()` - Export audit trails as CSV (admin only)
-   `statistics()` - Get audit trail statistics (admin only)

## Audit Trail Data Structure

Each audit trail record contains:

```json
{
  "id": 1,
  "user_id": 1,
  "action": "CREATE|UPDATE|DELETE|ACCESS_PASSWORD|PERMISSION_ASSIGN|etc",
  "model_type": "App\\Models\\ClassName",
  "model_id": 123,
  "old_values": {...},      // For UPDATE and DELETE operations
  "new_values": {...},      // For CREATE and UPDATE operations
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-01-02T10:30:00Z",
  "updated_at": "2025-01-02T10:30:00Z"
}
```

## Action Types

### Personal Keys

-   `CREATE` - Personal key creation
-   `UPDATE` - Personal key modification
-   `DELETE` - Personal key deletion
-   `PERSONAL_KEY_VERIFY` - Password verification to access key
-   `PERSONAL_KEY_VIEW` - Viewing personal key

### Passwords

-   `CREATE` - Password creation (admin)
-   `UPDATE` - Password update (admin)
-   `DELETE` - Password deletion (admin)
-   `ACCESS_PASSWORD` - User accessing password

### Permissions

-   `PERMISSION_ASSIGN` - Admin assigning permission to user
-   `PERMISSION_UPDATE` - Admin updating permission expiry
-   `PERMISSION_REVOKE` - Admin revoking permission

### Systems

-   `CREATE` - System creation (admin)
-   `UPDATE` - System update (admin)
-   `DELETE` - System deletion (admin)

### Users

-   `CREATE` - User registration (would be in AuthController)
-   `UPDATE` - User profile update
-   `DELETE` - User deletion (admin)

## Usage Examples

### Using AuditService

```php
// Log a simple action
AuditService::log(
    userId: auth()->id(),
    action: 'CREATE',
    modelType: PersonalKey::class,
    modelId: $personalKey->id,
    newValues: $personalKey->toArray(),
    ipAddress: request()->ip(),
    userAgent: request()->userAgent()
);

// Log from request context
AuditService::logFromRequest(
    request: $request,
    userId: auth()->id(),
    action: 'UPDATE',
    modelType: System::class,
    modelId: $system->id,
    newValues: $system->toArray(),
    oldValues: $oldValues
);

// Log password access
AuditService::logPasswordAccess(
    request: $request,
    userId: auth()->id(),
    passwordId: $password->id,
    systemId: $system->id,
    reason: 'User viewed password'
);

// Log personal key access
AuditService::logPersonalKeyAccess(
    request: $request,
    userId: auth()->id(),
    personalKeyId: $key->id,
    action: 'VERIFY',
    reason: 'User verified password to access key'
);
```

### Querying Audit Trails

**Get all audit trails for current user:**

```
GET /api/audit-trails
```

**Get audit trails for a specific user (admin only):**

```
GET /api/audit-trails/user/{userId}
```

**Get password access logs (admin only):**

```
GET /api/audit-trails/password-access-logs?system_id=1&from_date=2025-01-01
```

**Get permission logs (admin only):**

```
GET /api/audit-trails/permission-logs?user_id=2&permission_action=assign
```

**Get personal key access logs:**

```
GET /api/audit-trails/personal-key-access-logs?action=verify
```

**Get recent activity (admin only):**

```
GET /api/audit-trails/recent-activity?limit=50&action=CREATE
```

**Export audit trails as CSV (admin only):**

```
GET /api/audit-trails/export?from_date=2025-01-01&to_date=2025-01-31
```

**Get statistics (admin only):**

```
GET /api/audit-trails/statistics?days=30
```

## Security Considerations

1. **Access Control:** Regular users can only view their own audit trails
2. **Admin Only Features:** Password access logs, permission logs, and system operations are admin-only
3. **IP & User-Agent Tracking:** All logs include client IP and user agent for forensic analysis
4. **Encrypted Data:** Password values are never stored in audit logs, only access records
5. **Immutable Logs:** Audit trails should never be deleted (consider soft deletes or archival)

## Database Migrations

The `audit_trails` table has the following structure:

```
- id (PRIMARY)
- user_id (FOREIGN KEY to users)
- action (string)
- model_type (string)
- model_id (unsigned big integer)
- old_values (JSON, nullable)
- new_values (JSON, nullable)
- ip_address (text, nullable)
- user_agent (text, nullable)
- created_at, updated_at (timestamps)
```

## Route Setup

Add these routes to your `routes/api.php`:

```php
// Audit Trail Routes (all require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Get user's own audit trails
    Route::get('/audit-trails', [AuditTrailController::class, 'index']);
    Route::get('/audit-trails/{id}', [AuditTrailController::class, 'show']);

    // Get personal key access logs
    Route::get('/audit-trails/personal-key-access-logs', [AuditTrailController::class, 'getPersonalKeyAccessLogs']);

    // Admin-only routes
    Route::middleware('can:viewAny,App\Models\AuditTrail')->group(function () {
        Route::get('/audit-trails/user/{userId}', [AuditTrailController::class, 'getByUser']);
        Route::get('/audit-trails/model/{modelType}/{modelId}', [AuditTrailController::class, 'getByModel']);
        Route::get('/audit-trails/recent-activity', [AuditTrailController::class, 'getRecentActivity']);
        Route::get('/audit-trails/password-access-logs', [AuditTrailController::class, 'getPasswordAccessLogs']);
        Route::get('/audit-trails/permission-logs', [AuditTrailController::class, 'getPermissionLogs']);
        Route::get('/audit-trails/admin-activity', [AuditTrailController::class, 'getAdminActivityLogs']);
        Route::get('/audit-trails/export', [AuditTrailController::class, 'export']);
        Route::get('/audit-trails/statistics', [AuditTrailController::class, 'statistics']);
    });
});
```

## Future Enhancements

1. **Event-Driven Logging:** Use Laravel Events/Listeners for automatic logging
2. **Real-time Alerts:** Notify admins of suspicious activities
3. **Audit Trail Retention Policies:** Auto-archive old records
4. **Advanced Analytics:** Dashboard showing trends and patterns
5. **Integration with Security Tools:** SIEM integration for enterprise deployments
6. **Compliance Reports:** Generate GDPR, HIPAA compliance reports
