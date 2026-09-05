# NaTask — API Specification

Base:

/api

All protected routes require authentication.

---

# Authentication

## Google Login

GET /auth/google

Redirect user to Google OAuth.

---

## Google Callback

GET /auth/google/callback

Laravel handles:

- OAuth callback
- identity verification
- user lookup
- user creation
- authentication

---

## Logout

POST /auth/logout

---

# User

GET /user

Returns authenticated user.

---

# Projects

GET /projects

POST /projects

GET /projects/{project}

PUT /projects/{project}

DELETE /projects/{project}

Only the project owner can delete a project. Deleting a project also deletes its
tasks, task statuses, comments, checklists, attachments, labels, and members.

---

# Project Members

GET /projects/{project}/members

POST /projects/{project}/members

PUT /projects/{project}/members/{user}

DELETE /projects/{project}/members/{user}

POST /projects/{project}/invitations

Creates a shareable invitation link. The request accepts `role` with one of
`admin`, `member`, or `viewer`. Links expire after 7 days and can be accepted once.

POST /invitations/{token}/accept

Accepts an invitation for the authenticated user and adds them to the project.

Project roles:

- `owner`: full project access and role management
- `admin`: manage members and project settings
- `member`: work with project tasks
- `viewer`: read-only access

---

# Project Tasks

GET /projects/{project}/tasks

POST /projects/{project}/tasks

---

# Tasks

GET /tasks/{task}

The task detail response includes `comments` with each comment's `user` data.
Use this response to refresh the discussion feed after creating a comment.

PUT /tasks/{task}

DELETE /tasks/{task}

---

# Task Status

PUT /tasks/{task}/status

PUT /tasks/{task}/position

---

# Task Assignees

POST /tasks/{task}/assignees

DELETE /tasks/{task}/assignees/{user}

---

# Comments

GET /tasks/{task}/comments

POST /tasks/{task}/comments

PUT /comments/{comment}

DELETE /comments/{comment}

---

# Checklists

GET /tasks/{task}/checklists

POST /tasks/{task}/checklists

PUT /checklists/{checklist}

DELETE /checklists/{checklist}

---

# Checklist Items

POST /checklists/{checklist}/items

PUT /checklist-items/{item}

DELETE /checklist-items/{item}

---

# Attachments

GET /tasks/{task}/attachments

POST /tasks/{task}/attachments

DELETE /attachments/{attachment}

---

# Activity

GET /projects/{project}/activities

---

# Notifications

GET /notifications

POST /notifications/{notification}/read

POST /notifications/read-all

---

# Search

GET /search?q={query}

Search:

- projects
- tasks
- members
- other supported resources

---

# API Rules

Use:

- validation
- authorization
- pagination
- consistent JSON
- correct HTTP status codes

Never return unnecessary fields.
MAKE THIS SISTEM SECURE FROM 10 WOASP
Never expose private/internal information.

---

# Example Task Response

{
  "data": {
    "id": 1,
    "title": "Implement Authentication",
    "status": {
      "id": 2,
      "name": "In Progress"
    },
    "priority": "high",
    "due_date": "2026-09-10",
    "assignees": [],
    "labels": []
  }
}
