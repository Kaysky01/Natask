# NaTask — UI Design System

## 1. Design Direction

NaTask must feel:

> Bright + Modern + Playful + Editorial + Productive

The interface must feel like a real SaaS product designed
by a professional product designer.

It must NOT look like an AI-generated dashboard.

---

## 2. Anti AI-Slop Rules

DO NOT use:

- excessive gradients
- purple/blue gradient backgrounds
- glassmorphism everywhere
- excessive rounded cards
- giant shadows
- neon glow
- excessive blur
- decorative icons everywhere
- six identical metric cards
- every section inside a card
- overly centered layouts
- random charts
- unnecessary illustrations
- excessive animations
- generic SaaS dashboard templates

Avoid this pattern:

Card + Card + Card
Card + Card + Card

Do not make the entire application look like a collection
of floating rounded rectangles.

---

## 3. Design Principles

Prefer:

- strong typography
- whitespace
- editorial composition
- subtle borders
- hierarchy
- restrained color
- asymmetric layouts
- contextual actions
- purposeful animation
- visual rhythm

Color must communicate information.

Do not use color purely for decoration.

---

## 4. Theme

Support:

- Light
- Dark
- System

Light mode is the primary visual identity.

Light mode should feel:

- bright
- clean
- warm
- premium

It should not look like a sterile white admin panel.

---

## 5. Base Colors

Starting tokens:

Background:
#F8F9FB

Surface:
#FFFFFF

Text:
#17181A

Muted:
#70747C

Border:
#E8E9EC

Dark background:
#101113

Dark surface:
#181A1D

Dark text:
#F5F5F5

These are starting tokens, not immutable values.

---

## 6. Accent Colors

Use a controlled accent palette.

Possible accents:

- Coral
- Blue
- Lime
- Purple
- Yellow

Do not use all accents at the same time.

Use them for:

- project identity
- task category
- status
- priority
- labels

---

## 7. Typography

Preferred fonts:

1. Geist
2. Inter
3. Manrope
4. Plus Jakarta Sans

Prefer Geist or Inter.

Hierarchy:

Display:
48px

H1:
32–40px

H2:
24px

H3:
18–20px

Body:
14–16px

Metadata:
12–13px

Do not make all text tiny.

---

## 8. Spacing

Use a consistent spacing scale:

4
8
12
16
24
32
48
64

Avoid random spacing.

---

## 9. Radius

Use moderate corner radius.

Not every element needs rounded corners.

Avoid excessive pill-shaped UI.

---

## 10. Shadows

Prefer:

- borders
- contrast
- background layers

over heavy shadows.

Shadows should be subtle.

---

## 11. Navigation

Desktop:

Sidebar + content.

Tablet:

Collapsible sidebar.

Mobile:

Top navigation + drawer/bottom navigation.

Example:

NaTask

Dashboard

Projects
  All Projects
  My Projects

My Tasks

Calendar

Notifications

Settings

Profile

---

## 12. Dashboard

Do not create a dashboard made entirely from cards.

Use a combination of:

- typography
- lists
- progress
- activity
- compact surfaces
- project rows

Example:

Good morning, Andika

Here's what's happening across your workspace.

MY TASKS
12 remaining

PROJECTS
5 active

TODAY

○ Fix authentication
○ Review dashboard
● Deploy API

PROJECTS

SmartTrip
████████████░ 78%

NaTask
████████░░░░ 62%

RECENT ACTIVITY

Andika moved Authentication → Review
Budi completed API documentation
Sinta uploaded dashboard.fig

---

## 13. Project Header

Example:

← Projects

SMARTTRIP

Travel platform for Lampung

78% complete

14 tasks left

Overview
Board
List
Calendar
Files
Activity

The project can have its own accent color.

---

## 14. Kanban

Columns:

Todo
In Progress
Review
Done

Each column should show task count.

Task cards should prioritize:

1. task title
2. relevant metadata
3. assignee
4. deadline
5. priority/labels

Do not overload cards.

Kanban should feel modern and editorial,
not like a direct Trello clone.

---

## 15. Task Detail

Desktop:

Open task detail in a side panel when possible. Keep the discussion feed tied to
the task detail request so comments appear immediately after they are created.

Mobile:

Use full-screen task detail.

Include:

- title
- status
- priority
- description
- assignee
- dates
- checklist
- subtasks
- comments
- attachments
- activity

---

## 16. Empty States

Never use only:

"No data found."

Instead:

Nothing here yet.

Start your first project
and turn ideas into action.

[ New Project ]

Keep empty states minimal.

---

## 17. Loading

Use meaningful skeleton/loading states.

Do not freeze the entire page.

---

## 18. Error

Errors should explain:

- what happened
- what the user can do

Example:

Could not load your projects.

[ Try again ]

---

## 19. Micro-interactions

Use subtle animations:

- 150–300ms transitions
- drag/drop feedback
- checkbox completion
- progress changes
- hover states
- menu transitions

Do not animate everything.

Respect prefers-reduced-motion.

---

## 20. Responsive Requirements

The application must work on:

- mobile
- tablet
- laptop
- desktop
- large desktop

Mobile must NOT simply be a scaled desktop.

Kanban may use horizontal scrolling.

Task details should become full-screen.

Tables should transform into mobile-friendly structures.

---

## 21. Accessibility

Support:

- keyboard navigation
- focus states
- semantic HTML
- accessible labels
- readable contrast
- reduced motion
- screen reader compatibility

Never communicate information only through color.

---

## 22. Component Philosophy

Build reusable components.

Examples:

Button
Input
Dialog
Dropdown
Tooltip
Avatar
Badge
Tabs
Popover
Command Menu
Task Card
Project Row
Activity Item
Comment
Checklist
Progress Indicator

But do not create abstractions before they are needed.

---

## 23. Visual Rule

Every page should have a clear visual hierarchy.

Ask:

What should the user notice first?

What should the user do next?

What information is secondary?

If every element looks equally important,
the design is wrong.