# SalesPilot - AI-Powered Sales Automation Platform

## Overview

SalesPilot is a comprehensive B2B sales automation platform that helps businesses streamline their sales pipeline through AI-powered lead management, intelligent inbox processing, and workflow automation. The platform integrates with Gmail and LinkedIn to automatically classify and manage sales communications, track leads through various pipeline stages, and provide actionable insights for sales teams.

The application serves as a centralized hub for managing companies, contacts, leads, activities, and communications with AI-assisted features for email summarization, lead classification, and next-action recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: 
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Design inspiration from Linear, Notion, and HubSpot for professional B2B aesthetics
- Custom theme system supporting light/dark modes
- Typography hierarchy using Inter (primary) and JetBrains Mono (monospace) fonts

**State Management**:
- TanStack Query (React Query) for server state management
- Custom query client with credential-based authentication
- Local React state for UI interactions

**Routing**: Wouter for client-side routing

**Key Design Principles**:
- Information density without clutter
- Hierarchy through typography and spacing rather than decoration
- Functional minimalism with purpose-driven elements
- Consistent spacing system (2, 4, 6, 8, 12, 16 Tailwind units)

### Backend Architecture

**Framework**: Express.js with TypeScript

**API Pattern**: RESTful API with session-based authentication

**Authentication System**:
- Passport.js with local strategy
- Session management using connect-pg-simple
- Bcrypt for password hashing
- Session storage in PostgreSQL

**Data Access Layer**:
- Storage interface pattern for database operations
- Centralized database logic in storage module
- Type-safe operations with TypeScript interfaces

**Database ORM**: Drizzle ORM with Neon serverless driver

**Module Structure**:
- Separation of concerns: routing, authentication, storage, and database connection
- Middleware-based request/response logging
- Environment-based configuration

### Data Storage

**Database**: PostgreSQL (via Neon serverless)

**Schema Design**:
- Users: Authentication and profile information
- Companies: Business entities with industry, size, location metadata
- Contacts: Individual contacts linked to companies
- Leads: Sales opportunities with status tracking (prospect → contacted → in_discussion → negotiation → closed_won/closed_lost)
- Activities: Timeline of interactions (emails, calls, messages, meetings, notes)
- Email Threads: AI-processed email communications with summaries and classifications
- Sessions: Server-side session storage

**Relationships**:
- Contacts belong to Companies
- Leads reference Contacts and Companies
- Activities link to Contacts and/or Leads
- All entities are user-scoped for multi-tenancy

**Migration Strategy**: Drizzle Kit for schema migrations

### External Dependencies

**AI Services** (Planned Integration):
- Mistral/OpenRouter API for:
  - Email classification (Lead Inquiry, Follow-up, Negotiation, etc.)
  - Email thread summarization
  - Confidence scoring for AI predictions
  - Next action recommendations
  - Auto-response generation

**Email Integration** (Planned):
- Gmail API via OAuth 2.0
- Bi-directional sync for reading/sending emails
- Automatic lead creation from incoming emails

**Social Integration** (Planned):
- LinkedIn API via OAuth 2.0
- Message synchronization
- Contact enrichment

**Workflow Automation** (Planned):
- N8N integration for workflow orchestration
- Custom AI nodes for classification, summarization, and response generation
- Template library for common sales workflows

**Third-Party UI Libraries**:
- Radix UI: Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- Lucide React: Icon system
- date-fns: Date manipulation
- React Hook Form with Zod resolvers: Form validation
- class-variance-authority: Component variant management

**Development Tools**:
- Vite: Development server and build tool
- ESBuild: Production server bundling
- TypeScript: Type safety across frontend and backend
- Replit-specific plugins for development environment integration

**Deployment Stack** (Planned):
- Docker containerization
- Nginx reverse proxy
- Railway or Render for hosting