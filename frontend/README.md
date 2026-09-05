# NaTask Frontend

React + TypeScript frontend for NaTask project management platform.

## Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **DND Kit** - Drag and drop functionality
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on http://localhost:8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Start development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linter
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/
│   ├── ui/           # Base UI components
│   ├── layout/       # Layout components
│   ├── project/      # Project-specific components
│   ├── task/         # Task-specific components
│   ├── board/        # Kanban board components
│   └── shared/       # Shared components
├── pages/            # Page components
├── api/              # API layer
├── hooks/            # Custom hooks
├── stores/           # Zustand stores
├── types/            # TypeScript types
├── utils/            # Utility functions
└── routes/           # Route definitions
```

## Design System

The app uses a custom design system built with Tailwind CSS:

- **Colors**: Light/dark theme support with semantic color tokens
- **Typography**: Geist font with defined text scales
- **Spacing**: Consistent spacing scale (4, 8, 12, 16, 24, 32, 48, 64)
- **Components**: Reusable UI components following modern design principles

## Features

### Phase 0 ✅
- [x] React setup with TypeScript
- [x] Tailwind CSS configuration
- [x] Base UI components
- [x] Theme system (light/dark)
- [x] API client setup
- [x] State management setup

### Upcoming Phases
- [ ] Authentication (Google OAuth)
- [ ] Project management
- [ ] Task management
- [ ] Kanban boards
- [ ] Collaboration features

## Development Guidelines

1. **Components**: Use TypeScript and follow the established patterns
2. **Styling**: Use Tailwind CSS utilities and the design system tokens
3. **State**: Use TanStack Query for server state, Zustand sparingly for client state
4. **API**: Use the centralized API client with proper error handling
5. **Accessibility**: Ensure components are accessible with proper ARIA attributes