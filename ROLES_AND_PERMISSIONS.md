# ResideEase - Role-Based Access Control (4 Roles)

## Overview
The system implements 4 distinct roles with specific responsibilities and permissions.

---

## Role Definitions

### 1. **ADMIN** - System Administrator
**Responsibility**: Hostel Setup & System Configuration

**Permissions**:
- Create and configure hostel settings (name, address, contact, etc.)
- Manage system configuration and settings
- View system audit logs and records
- Oversee all operations

**Features Access**:
- ✅ Settings Management (Hostel, System Configuration)
- ✅ Audit Log Publishing
- ✅ Room Type Configuration
- ✅ System Settings

---

### 2. **OFFICE** - Office Staff
**Responsibility**: Room Management & Details

**Permissions**:
- Create, update, and delete room records
- Manage room details, capacity, pricing, amenities
- Update room settings and configurations
- View all room information

**Features Access**:
- ✅ Rooms (Create, Read, Update, Delete)
- ✅ Room Settings Management
- ✅ View notices and information

---

### 3. **MANAGER** - Mess Manager/Warden
**Responsibility**: Daily Operations & Management

**Permissions**:
- Manage guests and guest registrations
- Handle mess management and meal planning
- Publish and manage notices
- Process rebate requests
- Update maintenance request status
- Create mess notifications
- Manage meal settings and options
- All day-to-day operational tasks

**Features Access**:
- ✅ Guest Management (Register, View, Update)
- ✅ Mess Management (Enrollments, Notifications)
- ✅ Notices (Create, Edit, Delete, Pin)
- ✅ Rebate Requests (Approve, Reject, Review)
- ✅ Maintenance (Update Status, Resolve)
- ✅ Supplier Bills (View, Register)
- ✅ Meal Settings Management
- ✅ Student Notifications

---

### 4. **STUDENT** - Student User
**Responsibility**: Personal Account Management

**Permissions**:
- View personal information and room assignment
- Check payment status and dues
- Submit maintenance requests
- Submit rebate requests
- View notices and announcements
- Check notifications

**Features Access**:
- ✅ View Personal Details
- ✅ Payment Status
- ✅ Room Assignment
- ✅ Submit Maintenance Requests
- ✅ Submit Rebate Requests
- ✅ View Notices
- ✅ View Notifications
- ✅ View Mess Plan

---

## Route Permissions Summary

| Feature | Admin | Office | Manager | Student |
|---------|-------|--------|---------|---------|
| Settings (Hostel) | ✅ Create/Update | ❌ | ❌ | ❌ |
| Settings (System) | ✅ Update | ❌ | ❌ | ❌ |
| Rooms (CRUD) | ✅ | ✅ | ❌ | ❌ |
| Settings (Rooms) | ✅ | ✅ | ❌ | ❌ |
| Guests | ✅ View | ❌ | ✅ Manage | ❌ |
| Mess | ✅ View | ❌ | ✅ Manage | ✅ View |
| Notices | ✅ View | ✅ View | ✅ Create/Manage | ✅ View |
| Rebates | ✅ View | ❌ | ✅ Approve/Reject | ✅ Submit |
| Maintenance | ✅ View | ❌ | ✅ Update Status | ✅ Submit |
| Supplier Bills | ✅ View | ❌ | ✅ View | ❌ |
| Audit | ✅ View | ❌ | ❌ | ❌ |
| Meals (Settings) | ✅ | ❌ | ✅ Update | ❌ |

---

## Login Endpoints

```
POST /auth/login          → Admin, Office, Manager only
POST /auth/student-login  → Students only
GET  /auth/me             → All authenticated users
```

---

## Implementation Notes

- All protected routes require authentication (`authenticate` middleware)
- Role-based access is enforced using `requireRole()` middleware
- Students use a separate login endpoint (`studentLogin`)
- Admin users have the highest system privileges
- Office staff are specifically responsible for room management
- Manager handles all day-to-day operations
- Students have read-only access to most features, except for submissions

---

## User Creation

Users should be created in the database with one of these roles:
- `admin`
- `office`
- `manager`
- `student` (though students typically use roll number + phone login)

Example:
```json
{
  "username": "john_office",
  "email": "john@hostel.com",
  "password": "hashed_password",
  "role": "office",
  "name": "John Smith"
}
```

