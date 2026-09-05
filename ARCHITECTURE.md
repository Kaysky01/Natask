# NaTask — System Architecture

## 1. Architecture

NaTask uses:

Frontend:
React + TypeScript

Backend:
Laravel REST API

Database:
MySQL

Authentication:
Google OAuth + Laravel Socialite + Sanctum

Optional infrastructure:
Redis

Storage:
Laravel Filesystem

---

## 2. High Level

React
 ↓
HTTP API
 ↓
Laravel
 ↓
Application Logic
 ↓
MySQL

Laravel
 ↓
Storage

Laravel
 ↓
Redis / Queue

---

## 3. Frontend

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zustand only when necessary
- Axios or equivalent
- dnd-kit
- Lucide icons

---

## 4. Backend

Use:

- Laravel
- Sanctum
- Socialite
- Form Requests
- API Resources
- Policies
- Events
- Jobs
- Notifications
- Services/Actions where appropriate

---

## 5. Frontend Structure

src/

app/

components/
  ui/
  layout/
  project/
  task/
  board/
  comments/
  notifications/
  shared/

pages/
  auth/
  dashboard/
  projects/
  tasks/
  calendar/
  settings/

api/
services/
hooks/
stores/
types/
utils/
routes/

---

## 6. Backend Structure

app/

Http/
  Controllers/
  Requests/
  Resources/

Models/

Policies/

Services/

Actions/

Events/

Listeners/

Jobs/

Notifications/

---

## 7. Authentication

Google OAuth is handled by Laravel.

React should never contain:

- Google client secret
- application secret
- database credentials

Laravel is responsible for authentication.

---

## 8. Authorization

Laravel is the source of truth.

Every protected resource must verify:

Authenticated User
 ↓
Project membership
 ↓
Role
 ↓
Permission
 ↓
Resource

Do not rely on frontend authorization.

---

## 9. API

RESTful API.

Use JSON responses.

Use consistent error responses.

Use HTTP status codes correctly.

---

## 10. Data Fetching

TanStack Query should manage server state.

Use:

- query caching
- invalidation
- optimistic updates where safe

Do not duplicate server state inside Zustand.

---

## 11. Performance

Avoid:

- N+1 queries
- fetching unnecessary data
- giant API payloads
- unnecessary rerenders

Use:

- eager loading
- pagination
- indexes
- caching
- queue jobs
- lazy loading where appropriate