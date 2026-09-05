# Frontend Setup Guide - React TypeScript

## Prerequisites
✅ Node.js v24.13.1 (Already installed)
✅ npm (comes with Node.js)

## Quick Setup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Configuration
The `.env` file is already created. Update if needed:
```env
VITE_API_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 3. Start Development Server
```bash
npm run dev
```

The frontend will be available at: http://localhost:3000

## What's Already Configured ✅

### Core Setup
- React 19 with TypeScript
- Vite build tool and dev server
- Tailwind CSS with custom design system
- Hot Module Replacement (HMR)

### Dependencies Installed
- **React Router DOM** - Client-side routing
- **TanStack Query** - Server state management
- **Zustand** - Client state management (for theme, etc.)
- **Axios** - HTTP client for API calls
- **DND Kit** - Drag and drop for Kanban boards
- **Lucide React** - Icon library
- **clsx & tailwind-merge** - Utility class management

### UI Components Ready
- Button (primary, secondary, ghost, danger variants)
- Input (with label, error states, icons)
- Card (default and compact variants)
- Avatar (with initials fallback)
- Badge (status indicators)
- Theme switcher (light/dark/system)

### Project Structure
```
frontend/src/
├── components/
│   ├── ui/           # Base UI components ✅
│   ├── layout/       # Layout components (AppShell) ✅
│   └── [others]/     # Feature components (pending)
├── pages/            # Route pages (pending)
├── api/              # API client setup ✅
├── hooks/            # Custom React hooks (pending)
├── stores/           # Zustand stores (theme store ✅)
├── types/            # TypeScript definitions ✅
├── utils/            # Utility functions ✅
└── main.tsx          # App entry point ✅
```

### Design System Features
- Light/Dark theme support with system detection
- Consistent color palette (coral accent, semantic colors)
- Typography scale with Geist/Inter fonts
- Spacing system (4, 8, 12, 16, 24, 32, 48, 64)
- Component utilities and focus states

## Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run linter (oxlint)
npm run preview  # Preview production build
```

## Development Workflow

### 1. Component Development
- Use TypeScript for all components
- Follow the established component patterns in `/components/ui/`
- Use Tailwind CSS with the design system tokens
- Ensure accessibility with proper ARIA attributes

### 2. State Management
- **Server State**: Use TanStack Query for API data
- **Client State**: Use Zustand sparingly for global UI state
- **Local State**: Use React useState for component state

### 3. API Integration
- Use the configured Axios client from `/api/client.ts`
- APIs will connect to Laravel backend at `http://localhost:8000/api`
- Error handling is configured globally

## Next Development Phases

### Phase 1: Authentication (Next)
- Google OAuth integration
- Login/logout flows
- Protected routes
- User session management

### Phase 2: Navigation & Layout
- Main navigation sidebar
- Dashboard layout
- Project workspace shell

### Phase 3: Project Management
- Projects CRUD operations
- Project member management
- Project settings

### Phase 4: Task Management
- Tasks CRUD operations
- Kanban board interface
- Task assignments and status

### Phase 5: Collaboration
- Task comments
- File attachments
- Activity tracking
- Real-time updates (future)

## Tips for Development

1. **Theme Testing**: Use the theme switcher on the main page to test both light and dark modes
2. **API Integration**: The API client is configured with interceptors for auth and error handling
3. **TypeScript**: All types are defined in `/types/index.ts`
4. **Utilities**: Common utilities are in `/utils/index.ts` for date formatting, color helpers, etc.
5. **Icons**: Use Lucide React for consistent iconography

## Testing the Setup

Once dependencies are installed:
1. Run `npm run dev`
2. Visit http://localhost:3000
3. Test theme switching (light/dark/system)
4. Check browser console for any errors
5. Verify hot reload by editing any component

The frontend is ready for the next development phase! 🚀