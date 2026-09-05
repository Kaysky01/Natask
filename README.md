# NaTask - Project Management Platform

## Prerequisites

Before setting up the project, ensure you have the following installed:

### 1. Node.js (Required for Frontend)
- Download and install Node.js from: https://nodejs.org/
- Recommended version: 18.x or higher
- This will also install npm (Node Package Manager)

### 2. PHP & Composer (Required for Backend)
- PHP 8.1 or higher
- Composer for PHP dependency management
- MySQL database

### 3. Laravel Requirements
- PHP extensions: OpenSSL, PDO, Mbstring, Tokenizer, XML, Ctype, JSON, BCMath

## Quick Setup Guide

### Frontend Setup
1. Install Node.js from the official website
2. Navigate to the project directory
3. Run: `npm create vite@latest frontend -- --template react-ts`
4. Follow the setup instructions that will be provided

### Backend Setup
1. Install PHP and Composer
2. Run Laravel installation commands
3. Configure database connection

## Project Structure

```
Natask/
├── frontend/          # React + TypeScript + Vite
├── backend/           # Laravel API
├── docs/              # Project documentation
└── README.md
```

## Development Workflow

This project follows a phased implementation approach:
- Phase 0: Project setup
- Phase 1: Authentication
- Phase 2-16: Feature implementation

Refer to IMPLEMENTATION_PLAN.md for detailed phases.

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zustand (minimal usage)
- dnd-kit (drag & drop)
- Lucide icons

**Backend:**
- Laravel
- MySQL
- Laravel Sanctum (API authentication)
- Laravel Socialite (Google OAuth)

## Next Steps

1. Install Node.js and npm
2. Run the frontend setup commands
3. Install PHP/Composer for Laravel backend
4. Follow the phase-by-phase implementation plan"# Natask" 
