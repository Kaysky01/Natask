# NaTask — Product Requirements Document

## 1. Product

NaTask is a modern project and task management platform designed
for individuals, students, developers, freelancers, startups,
and small teams.

Core principle:

> Simple enough for individuals, powerful enough for teams.

---

## 2. Problem

Users often manage projects across multiple tools:

- WhatsApp
- Discord
- Notion
- Google Drive
- spreadsheets
- task management tools

This creates fragmented information and makes it difficult to know:

- what needs to be done
- who is responsible
- when it is due
- what has changed
- what the current project progress is

NaTask combines project management and collaboration into one
focused workspace.

---

## 3. Product Goals

NaTask must allow users to:

1. Create projects.
2. Invite team members.
3. Create and manage tasks.
4. Assign tasks.
5. Track task status.
6. Set priorities.
7. Set deadlines.
8. Collaborate through comments.
9. Attach files.
10. Track project progress.
11. View work through multiple views.

---

## 4. Target Users

### Students

Need simple project and group-work management.

### Developers

Need task tracking, Kanban, assignments, comments,
checklists, and project progress.

### Freelancers

Need to manage multiple projects and deadlines.

### Small Teams

Need lightweight collaboration without enterprise complexity.

---

## 5. Authentication

NaTask uses Google-first authentication.

Primary authentication action:

> Continue with Google

MVP does not require traditional username/password authentication.

Authentication flow:

User
→ Google OAuth
→ Laravel
→ Google identity verification
→ user lookup/creation
→ authenticated session
→ dashboard

Use Laravel Socialite.

---

## 6. Core Features

### Authentication

- Google OAuth
- Login
- Logout
- OAuth callback
- New-user onboarding
- Existing-user authentication

### Projects

- Create project
- Edit project
- Delete/archive project
- Project status
- Project priority
- Members
- Project progress

### Tasks

- Create
- Edit
- Delete
- Assign
- Status
- Priority
- Start date
- Due date
- Labels
- Subtasks
- Checklist
- Comments
- Attachments

### Views

- Board
- List
- Calendar
- Overview

### Collaboration

- Comments
- Mentions
- Activity
- Notifications
- Attachments

---

## 7. Project Status

Default:

- Planning
- Active
- On Hold
- Completed
- Archived

---

## 8. Task Status

Default:

- Todo
- In Progress
- Review
- Done

The architecture should support custom statuses later.

---

## 9. Task Priority

- Low
- Medium
- High
- Urgent

---

## 10. Roles

- Owner
- Admin
- Member
- Viewer

Authorization must always be enforced by Laravel.

Frontend visibility is not authorization.

---

## 11. Dashboard

Dashboard should show useful information:

- active projects
- my tasks
- due soon
- project progress
- upcoming deadlines
- recent activity

Avoid six identical statistic cards.

---

## 12. Project Workspace

Each project has:

- Overview
- Board
- List
- Calendar
- Files
- Activity
- Members

---

## 13. MVP

### P0

- Google authentication
- Dashboard
- Project CRUD
- Members
- Roles
- Task CRUD
- Task assignment
- Status
- Priority
- Kanban
- Task detail
- Checklist
- Comments
- Activity
- Responsive design
- Light/dark mode

### P1

- Calendar
- List view
- Labels
- Attachments
- Notifications
- Search
- Filtering

### P2

- Gantt
- Custom workflows
- Recurring tasks
- Time tracking
- Automations

### P3

- AI assistant
- External integrations
- Enterprise features

---

## 14. Non-Goals

Do not implement in MVP:

- accounting
- payroll
- CRM
- HR management
- invoicing
- video conferencing
- enterprise resource planning
- complex Scrum management

---

## 15. Product Principles

NaTask should be:

- Simple
- Fast
- Focused
- Collaborative
- Responsive
- Human