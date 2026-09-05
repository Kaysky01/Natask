# NaTask — AI Development Rules

## RULE 1

Read all documentation in /docs before implementing a feature.

---

## RULE 2

PRD.md defines product requirements.

UI_DESIGN.md defines visual and UX requirements.

ARCHITECTURE.md defines technical architecture.

DATABASE.md defines data structure.

API.md defines API contracts.

IMPLEMENTATION_PLAN.md defines implementation order.

---

## RULE 3

Do not invent features that are not required.

If a feature is not documented, keep the implementation minimal.

---

## RULE 4

Do not redesign the product architecture without a strong reason.

---

## RULE 5

Never sacrifice usability for visual effects.

---

## RULE 6

Never create generic AI dashboard patterns.

Avoid:

- excessive cards
- gradients
- glassmorphism
- excessive shadows
- neon
- unnecessary charts
- decorative UI

---

## RULE 7

Frontend is not the authority for security.

All authorization must be enforced by Laravel.

---

## RULE 8

Never expose secrets to React.

---

## RULE 9

Do not duplicate server state between TanStack Query and Zustand.

---

## RULE 10

Do not create giant components.

Break complex interfaces into focused components.

---

## RULE 11

Every async interaction needs appropriate:

- loading
- success
- error
- empty state

---

## RULE 12

Mobile is a first-class experience.

Do not simply shrink desktop layouts.

---

## RULE 13

Before changing existing code:

Understand it first.

Do not blindly overwrite working functionality.

---

## RULE 14

After implementing a feature:

- run tests
- check console
- check API errors
- check responsive behavior
- check authorization
- check light mode
- check dark mode

---

## RULE 15

Prefer simple solutions.

Do not over-engineer.

---

# FINAL PRINCIPLE

Build NaTask like a real product,
not like a generated demo.

Every feature should be:

Useful.
Simple.
Fast.
Accessible.
Responsive.
Maintainable.

Every visual decision should have a purpose.
