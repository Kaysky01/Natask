# NaTask — Database Design

## 1. Users

users

- id
- name
- email
- avatar
- email_verified_at
- created_at
- updated_at

---

## 2. Social Accounts

social_accounts

- id
- user_id
- provider
- provider_id
- created_at
- updated_at

Unique:

provider + provider_id

---

## 3. Projects

projects

- id
- name
- slug
- description
- owner_id
- status
- priority
- start_date
- due_date
- created_at
- updated_at
- deleted_at

---

## 4. Project Members

project_members

- id
- project_id
- user_id
- role
- created_at
- updated_at

Unique:

project_id + user_id

---

## 5. Task Statuses

task_statuses

- id
- project_id
- name
- color
- position
- is_default
- created_at
- updated_at

---

## 6. Tasks

tasks

- id
- project_id
- status_id
- creator_id
- parent_id
- title
- description
- priority
- start_date
- due_date
- position
- created_at
- updated_at
- deleted_at

parent_id allows subtasks.

---

## 7. Task Assignees

task_assignees

- task_id
- user_id

Composite unique:

task_id + user_id

---

## 8. Labels

labels

- id
- project_id
- name
- color
- created_at
- updated_at

---

## 9. Task Labels

task_labels

- task_id
- label_id

---

## 10. Checklists

checklists

- id
- task_id
- title
- position
- created_at
- updated_at

---

## 11. Checklist Items

checklist_items

- id
- checklist_id
- title
- completed
- position
- created_at
- updated_at

---

## 12. Comments

comments

- id
- task_id
- user_id
- parent_id
- body
- created_at
- updated_at
- deleted_at

parent_id allows future threaded replies.

---

## 13. Attachments

attachments

- id
- task_id
- user_id
- original_name
- storage_path
- mime_type
- size
- created_at
- updated_at

---

## 14. Activities

activities

- id
- project_id
- user_id
- action
- subject_type
- subject_id
- metadata
- created_at

Activities should be immutable.

---

## 15. Notifications

notifications

Use Laravel's notification database structure
or an equivalent normalized design.

---

## 16. Relationships

User
 ├── Projects owned
 ├── Project memberships
 ├── Tasks created
 ├── Task assignments
 ├── Comments
 ├── Attachments
 └── Activities

Project
 ├── Owner
 ├── Members
 ├── Tasks
 ├── Labels
 ├── Statuses
 └── Activities

Task
 ├── Project
 ├── Status
 ├── Creator
 ├── Assignees
 ├── Parent task
 ├── Subtasks
 ├── Labels
 ├── Checklists
 ├── Comments
 └── Attachments

---

## 17. Database Rules

Use:

- foreign keys
- indexes
- unique constraints
- timestamps
- soft deletes where appropriate

Important indexes:

projects.owner_id
project_members.project_id
project_members.user_id
tasks.project_id
tasks.status_id
tasks.assignee relationships
tasks.due_date
activities.project_id
comments.task_id

Avoid unnecessary indexes.