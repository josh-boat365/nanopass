# NanoPass - Data Relationships Flow

Complete documentation of the relationships between Policies, Categories, Systems, and Passwords in the NanoPass password management system.

---

## Table of Contents

1. [Relationship Hierarchy](#relationship-hierarchy)
2. [Entity Relationships](#entity-relationships)
3. [Data Flow](#data-flow)
4. [Examples](#examples)
5. [Database Diagram](#database-diagram)

---

## Relationship Hierarchy

```
Policy (1)
    ↓
    └─→ Category (Many) ─→ System (Many) ─→ Password (Many)
```

### Overview

The data model follows a hierarchical structure:

-   **1 Policy** can be assigned to **Multiple Categories**
-   **1 Category** can contain **Multiple Systems**
-   **1 System** can have **Multiple Passwords**

---

## Entity Relationships

### 1. Policy Model

A **Policy** defines security requirements and validation rules for passwords.

```php
// Policy Model
class Policy extends Model
{
    protected $fillable = [
        'name',          // e.g., "Strong Password"
        'description',   // e.g., "Minimum 10 characters, at least 1 uppercase..."
        'regex_text',    // Regex pattern for validation
    ];

    // Relationships
    public function categories()
    {
        return $this->hasMany(Category::class);
    }
}
```

**Policy Properties:**

-   `id` - Unique identifier
-   `name` - Name of the policy
-   `description` - Detailed description of the policy requirements
-   `regex_text` - Regular expression pattern for password validation
-   `created_at` - Creation timestamp
-   `updated_at` - Last update timestamp

**Example Policy:**

```json
{
    "id": 1,
    "name": "Strong Password",
    "description": "Minimum 10 characters, at least 1 uppercase, 1 lowercase, 1 number, 1 special character",
    "regex_text": "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{10,}$",
    "created_at": "2025-12-24T10:00:00Z",
    "updated_at": "2025-12-24T10:00:00Z"
}
```

---

### 2. Category Model

A **Category** is a grouping of Systems that share a common Policy. It organizes systems by type or purpose.

```php
// Category Model
class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',          // e.g., "Email Systems"
        'description',   // e.g., "All email management systems"
        'policy_id',     // Foreign key to Policy
    ];

    // Relationships
    public function policy()
    {
        return $this->belongsTo(Policy::class);
    }

    public function systems()
    {
        return $this->hasMany(System::class);
    }
}
```

**Category Properties:**

-   `id` - Unique identifier
-   `name` - Name of the category (e.g., "Email Systems")
-   `description` - Description of the category
-   `policy_id` - Foreign key pointing to Policy
-   `created_at` - Creation timestamp
-   `updated_at` - Last update timestamp
-   `deleted_at` - Soft delete timestamp

**Category Relationships:**

-   **Belongs to Policy** (Many-to-One)
-   **Has Many Systems** (One-to-Many)

**Example Category:**

```json
{
    "id": 1,
    "name": "Email Systems",
    "description": "All email management systems",
    "policy_id": 1,
    "policy": {
        "id": 1,
        "name": "Strong Password",
        "description": "Minimum 10 characters..."
    },
    "systems": [
        { "id": 1, "system_name": "Gmail Admin" },
        { "id": 2, "system_name": "Outlook Exchange" }
    ],
    "created_at": "2025-12-24T10:00:00Z",
    "updated_at": "2025-12-24T10:00:00Z"
}
```

---

### 3. System Model

A **System** is a specific application or service that requires password management (e.g., Gmail, Database, VPN).

```php
// System Model
class System extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'system_name',    // e.g., "Gmail Admin"
        'category_id',    // Foreign key to Category
    ];

    // Relationships
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function passwords()
    {
        return $this->hasMany(Password::class);
    }

    public function description()
    {
        return $this->hasOne(Description::class);
    }

    public function permissions()
    {
        return $this->hasMany(Permission::class);
    }

    // Helper Methods
    public function activePasswords()
    {
        return $this->passwords()->active();
    }

    public function primaryPassword()
    {
        return $this->passwords()->active()->first();
    }
}
```

**System Properties:**

-   `id` - Unique identifier
-   `system_name` - Name of the system
-   `category_id` - Foreign key pointing to Category
-   `created_at` - Creation timestamp
-   `updated_at` - Last update timestamp
-   `deleted_at` - Soft delete timestamp

**System Relationships:**

-   **Belongs to Category** (Many-to-One)
-   **Has Many Passwords** (One-to-Many)
-   **Has One Description** (One-to-One)
-   **Has Many Permissions** (One-to-Many)

**Example System:**

```json
{
    "id": 1,
    "system_name": "Gmail Admin",
    "category_id": 1,
    "category": {
        "id": 1,
        "name": "Email Systems",
        "policy_id": 1
    },
    "passwords": [
        { "id": 1, "title": "Admin Account", "is_active": true },
        { "id": 2, "title": "Support Account", "is_active": false }
    ],
    "description": {
        "id": 1,
        "location": "Cloud",
        "serial": "GMAIL-001",
        "notes": "Main email administration account"
    },
    "permissions": [
        { "id": 1, "user_id": 5, "date_time_expiry": "2025-12-31T23:59:59Z" }
    ],
    "created_at": "2025-12-24T10:00:00Z",
    "updated_at": "2025-12-24T10:00:00Z"
}
```

---

### 4. Password Model

A **Password** is the actual credential (username/password) for accessing a System.

```php
// Password Model
class Password extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'system_id',    // Foreign key to System
        'title',        // e.g., "Admin Account"
        'username',     // Username/email for login
        'password',     // Encrypted password
        'notes',        // Additional notes
        'is_active',    // Whether this password is currently active
    ];

    protected $casts = [
        'password' => 'encrypted',  // Automatically encrypted/decrypted
        'is_active' => 'boolean',
    ];

    // Relationships
    public function system()
    {
        return $this->belongsTo(System::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }
}
```

**Password Properties:**

-   `id` - Unique identifier
-   `system_id` - Foreign key pointing to System
-   `title` - Name/title of this password (e.g., "Admin Account")
-   `username` - Username or email for login
-   `password` - Encrypted password value
-   `notes` - Additional notes or metadata
-   `is_active` - Boolean flag (active passwords are used, inactive are archived)
-   `created_at` - Creation timestamp
-   `updated_at` - Last update timestamp
-   `deleted_at` - Soft delete timestamp

**Password Relationships:**

-   **Belongs to System** (Many-to-One)

**Example Password:**

```json
{
    "id": 1,
    "system_id": 1,
    "title": "Admin Account",
    "username": "admin@gmail.com",
    "password": "encrypted_password_string",
    "notes": "Primary admin account for Gmail",
    "is_active": true,
    "system": {
        "id": 1,
        "system_name": "Gmail Admin",
        "category_id": 1
    },
    "created_at": "2025-12-24T10:00:00Z",
    "updated_at": "2025-12-24T10:00:00Z"
}
```

---

## Data Flow

### Creating a Complete Hierarchy

Here's how data flows when creating a complete system with policy:

```
1. CREATE POLICY
   └─→ Policy (Security requirements)
       Example: "Strong Password" with regex validation

2. CREATE CATEGORY
   └─→ Category (Group of systems)
       └─→ Links to Policy (Inherits security requirements)

3. CREATE SYSTEM
   └─→ System (Specific application)
       └─→ Links to Category
           └─→ Inherits from Policy via Category

4. CREATE PASSWORD(S)
   └─→ Password (Actual credentials)
       └─→ Links to System
           └─→ Password must follow Policy requirements
           └─→ Can be active or inactive
           └─→ Multiple passwords per system allowed
```

### Access Flow

```
User Permission Request
    ↓
Get Active Permissions
    ↓
Check System Access
    ↓
Retrieve System
    ↓
Get System's Category
    ↓
Get System's Passwords
    ↓
Check Password Active Status
    ↓
Return Password (if authorized)
```

---

## Examples

### Example 1: Complete Hierarchy Setup

**Scenario:** Setting up Gmail administration passwords with strict security policy

```javascript
// Step 1: Create Policy
{
    "name": "Strong Password",
    "description": "Minimum 10 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character",
    "regex_text": "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{10,}$"
}
// Response: Policy ID = 1

// Step 2: Create Category linked to Policy
{
    "name": "Email Systems",
    "description": "All email management systems",
    "policy_id": 1
}
// Response: Category ID = 1

// Step 3: Create System linked to Category
{
    "system_name": "Gmail Admin",
    "category_id": 1
}
// Response: System ID = 1

// Step 4: Create Passwords linked to System
{
    "system_id": 1,
    "title": "Admin Account",
    "username": "admin@gmail.com",
    "password": "Secure@Pass123",
    "notes": "Primary admin account",
    "is_active": true
}
// Response: Password ID = 1

{
    "system_id": 1,
    "title": "Support Account",
    "username": "support@gmail.com",
    "password": "Secure@Pass456",
    "notes": "Support team account",
    "is_active": false  // Archived password
}
// Response: Password ID = 2
```

### Example 2: Querying the Hierarchy

```javascript
// Get a System with all relationships
GET /api/systems/1

Response:
{
    "id": 1,
    "system_name": "Gmail Admin",
    "category_id": 1,
    "category": {
        "id": 1,
        "name": "Email Systems",
        "description": "All email management systems",
        "policy_id": 1,
        "policy": {
            "id": 1,
            "name": "Strong Password",
            "description": "Minimum 10 characters...",
            "regex_text": "^(?=.*[A-Z])..."
        }
    },
    "passwords": [
        {
            "id": 1,
            "title": "Admin Account",
            "username": "admin@gmail.com",
            "is_active": true,
            "notes": "Primary admin account"
        },
        {
            "id": 2,
            "title": "Support Account",
            "username": "support@gmail.com",
            "is_active": false,
            "notes": "Support team account"
        }
    ],
    "permissions": [
        {
            "id": 1,
            "user_id": 5,
            "admin_id": 1,
            "date_time_expiry": "2025-12-31T23:59:59Z"
        }
    ]
}
```

### Example 3: Policy Enforcement

When creating a password, the system should validate it against the Policy:

```javascript
// Getting System with Policy
const system = await getSystem(1);
const policy = system.category.policy;

// Validate password against regex
const passwordRegex = new RegExp(policy.regex_text);

const userPassword = "MySecure@Pass123";
if (passwordRegex.test(userPassword)) {
    // Password is valid - create it
    createPassword({
        system_id: 1,
        title: "New Admin",
        username: "newadmin@gmail.com",
        password: userPassword,
        is_active: true,
    });
} else {
    // Password doesn't meet policy requirements
    showError(`Password must meet requirements: ${policy.description}`);
}
```

---

## Database Diagram

```
┌─────────────┐
│   Policies  │
├─────────────┤
│ id (PK)     │
│ name        │
│ description │
│ regex_text  │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐
│ Categories  │
├─────────────┤
│ id (PK)     │
│ name        │
│ description │
│ policy_id ──┼──→ Policies.id
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐
│   Systems   │
├─────────────┤
│ id (PK)     │
│ system_name │
│ category_id─┼──→ Categories.id
└──────┬──────┘
       │
       │ 1:N
       ▼
┌──────────────┐
│  Passwords   │
├──────────────┤
│ id (PK)      │
│ title        │
│ username     │
│ password     │
│ notes        │
│ is_active    │
│ system_id ───┼──→ Systems.id
└──────────────┘
```

---

## Relationship Summary Table

| Relationship         | Type        | From     | To          | Cardinality | Foreign Key              |
| -------------------- | ----------- | -------- | ----------- | ----------- | ------------------------ |
| Policy → Category    | One-to-Many | Policy   | Category    | 1:N         | `categories.policy_id`   |
| Category → System    | One-to-Many | Category | System      | 1:N         | `systems.category_id`    |
| System → Password    | One-to-Many | System   | Password    | 1:N         | `passwords.system_id`    |
| System → Description | One-to-One  | System   | Description | 1:1         | `descriptions.system_id` |
| System → Permission  | One-to-Many | System   | Permission  | 1:N         | `permissions.system_id`  |

---

## Key Concepts

### 1. Policy Inheritance

Categories inherit security policies from their assigned Policy. All passwords in systems under that category must follow the policy's requirements.

### 2. Active vs Inactive Passwords

-   **Active Passwords** (`is_active = true`): Currently used credentials
-   **Inactive Passwords** (`is_active = false`): Archived or deprecated credentials kept for historical purposes

### 3. Soft Deletes

All models except Policy support soft deletes:

-   Deleted records are not permanently removed from the database
-   They retain a `deleted_at` timestamp
-   Use `.with('trashed')` or `.withTrashed()` to query deleted records

### 4. Multiple Passwords per System

A single System can have multiple passwords:

-   Different credentials for different purposes (admin, support, user)
-   Different credentials for password rotation/rotation cycles
-   Backup credentials for failover scenarios

### 5. Permission Control

Access to passwords is controlled through:

-   User Permissions linked to Systems
-   Permission expiry dates (`date_time_expiry`)
-   Only users with active permissions can access the system's passwords

---

## Common Queries

### Get All Systems in a Category

```php
$category = Category::find(1);
$systems = $category->systems; // All systems in this category
```

### Get All Active Passwords for a System

```php
$system = System::find(1);
$activePasswords = $system->activePasswords(); // Only is_active = true
```

### Get a System with Its Policy (through Category)

```php
$system = System::with(['category.policy'])->find(1);
echo $system->category->policy->name;
```

### Get Systems by Policy

```php
$policy = Policy::find(1);
$systems = System::whereHas('category', function($query) use ($policy) {
    $query->where('policy_id', $policy->id);
})->get();
```

### Get All Passwords Needing Policy Validation

```php
$policy = Policy::find(1);
$regex = $policy->regex_text;

// Get all passwords in systems under this policy
$passwords = Password::whereHas('system.category', function($query) use ($policy) {
    $query->where('policy_id', $policy->id);
})->get();
```

---

## Notes

-   All timestamps are in ISO 8601 format (UTC timezone)
-   Passwords are automatically encrypted when stored, decrypted when retrieved
-   The `is_active` flag allows for password rotation without data loss
-   Categories can be organized by type (email, database, VPN, etc.) or by business unit
-   Policies ensure consistent security standards across categories
