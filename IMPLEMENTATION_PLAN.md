# NaTask — Implementation Plan

## RULE

Do not implement the entire application in one step.

Work incrementally.

After each phase:

1. Verify existing functionality.
2. Run tests.
3. Check responsive UI.
4. Check API behavior.
5. Fix regressions.
6. Only then continue.

---

# PHASE 0 — Project Setup

## Frontend

Initialize:

- React
- TypeScript
- Vite
- Tailwind
- routing
- TanStack Query

Create:

- app shell
- theme system
- typography
- design tokens
- base UI components

---

## Backend

Initialize:

- Laravel
- MySQL
- Sanctum
- Socialite

Configure:

- environment
- CORS
- API structure
- database

---

# PHASE 1 — Authentication

Implement:

- Google OAuth
- callback
- user creation
- social account
- authentication session
- logout
- authenticated user endpoint

Frontend:

- login page
- Google login button
- loading state
- OAuth error state

---

# PHASE 2 — Workspace

Implement:

- default workspace/project handling
- dashboard shell
- navigation
- profile menu

---

# PHASE 3 — Projects

Backend:

- migration
- model
- relationships
- policies
- requests
- resources
- controllers

Frontend:

- project list
- create project
- edit project
- project detail

---

# PHASE 4 — Members

Implement:

- invite/add member
- remove member
- roles
- permissions

Roles:

Owner
Admin
Member
Viewer

Test authorization thoroughly.

---

# PHASE 5 — Tasks

Implement:

- task CRUD
- status
- priority
- assignee
- dates
- task detail

---

# PHASE 6 — Kanban

Implement:

- columns
- task cards
- drag/drop
- status persistence
- position persistence
- optimistic UI where safe

---

# PHASE 7 — Task Collaboration

Implement:

- checklist
- subtasks
- comments
- mentions
- attachments

---

# PHASE 8 — Dashboard

Implement:

- active projects
- my tasks
- upcoming deadlines
- progress
- activity

Do not turn the dashboard into a grid of identical cards.

---

# PHASE 9 — Views

Implement:

- List
- Calendar
- filtering
- sorting
- search

---

# PHASE 10 — Activity & Notifications

Implement:

- activity events
- activity feed
- notification records
- read/unread state

---

# PHASE 11 — Responsive

Test:

- 320px
- 375px
- 390px
- 430px
- tablet
- laptop
- 1440px+
 
Pay special attention to:

- Kanban
- task detail
- tables
- dialogs
- navigation

---

# PHASE 12 — Accessibility

Verify:

- keyboard navigation
- focus states
- semantic HTML
- contrast
- screen readers
- reduced motion

---

# PHASE 13 — Security

Verify:

- authentication
- authorization
- OAuth
- validation
- rate limiting
- file security
- CORS
- CSRF where applicable
- mass assignment
- SQL safety

---

# PHASE 14 — Performance

Check:

- N+1
- database indexes
- API payloads
- frontend rerenders
- caching
- pagination
- queue jobs

---

# PHASE 15 — Testing

Backend tests:

- authentication
- project permissions
- task permissions
- CRUD
- comments
- checklist
- attachments

Frontend tests where appropriate.

---

# PHASE 16 — Production

Prepare:

- production environment
- Nginx
- PHP-FPM
- MySQL
- Redis if used
- queue worker
- storage
- HTTPS
- logging
- backups
- monitoring

---

# FINAL QUALITY CHECK

Before considering NaTask complete:

UI:
- modern
- bright
- responsive
- consistent
- not monotonous
- not AI-slop

Backend:
- secure
- validated
- authorized
- tested

Database:
- indexed
- relational
- consistent

UX:
- loading states
- error states
- empty states
- mobile experience
- keyboard accessibility

Performance:
- no obvious N+1
- reasonable API payloads
- smooth interactions
