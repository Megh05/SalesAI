# SalesPilot - AI-Powered Sales Automation Platform

## Overview

SalesPilot is a comprehensive B2B sales automation platform that helps businesses streamline their sales pipeline through AI-powered lead management, intelligent inbox processing, and workflow automation. The platform integrates with Gmail and LinkedIn to automatically classify and manage sales communications, track leads through various pipeline stages, and provide actionable insights for sales teams.

The application serves as a centralized hub for managing companies, contacts, leads, activities, and communications with AI-assisted features for email summarization, lead classification, and next-action recommendations.

## Recent Changes

**November 5, 2025** - Completed Phase 3: Custom Workflow Automation System
- Built custom workflow automation engine integrated into SalesPilot (custom solution instead of N8N)
- Database schema: Added `workflows` and `workflowExecutions` tables to track automation workflows
- Workflow engine with node-based execution system supporting:
  - Trigger nodes (email_received, lead_created, scheduled, manual)
  - AI nodes (classify, summarize, generate_reply) using OpenRouter/Mistral
  - Action nodes (create_lead, create_activity, send_notification)
  - Control nodes (condition, delay)
- REST API endpoints: POST/GET/PATCH/DELETE for workflow CRUD + POST /execute for running workflows
- Workflow Builder UI: Drag-and-drop visual workflow editor using React Flow with:
  - Node palette for adding workflow steps
  - Visual canvas for connecting nodes
  - Properties panel for configuring node settings
  - Save/test/execute workflow functionality
- 5 prebuilt workflow templates covering common sales automation scenarios:
  1. Lead Qualification Pipeline - Automatically classify and route incoming leads
  2. Email Response Automation - Generate AI-powered responses to common inquiries
  3. Follow-up Reminder System - Track and remind about pending follow-ups
  4. Lead Scoring Automation - Score leads based on email engagement
  5. Contact Enrichment Flow - Enhance contact records with additional data
- Navigation: Added Workflows link to main sidebar navigation
- Fixed critical bug where newly created nodes had incorrect type serialization

**November 4, 2025** - Added AI-Powered Lead Auto-Creation Feature
- New AI analysis feature in Smart Inbox that detects potential leads from emails
- One-click lead creation that automatically extracts and creates:
  - Contact information (name, email, phone, role)
  - Company information (name, industry, size, location)
  - Lead record with proper status and source tracking
- AI provides confidence scores and reasoning for lead suggestions
- Intelligent duplicate detection prevents creating duplicate contacts/companies
- Uses existing OpenRouter/Mistral integration for cost-effective AI processing

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

**AI Services** (Active Integration):
- Mistral/OpenRouter API for:
  - Email classification (Lead Inquiry, Follow-up, Negotiation, etc.)
  - Email thread summarization
  - Lead detection and extraction from emails
  - Contact and company information extraction
  - Confidence scoring for AI predictions
  - Next action recommendations
  - Auto-response generation

**Email Integration** (Pending Setup):
- Gmail API via OAuth 2.0
- NOTE: Replit Gmail connector was dismissed - requires manual OAuth setup
- User needs to provide: Google Cloud Console OAuth 2.0 Client ID and Client Secret
- Features: Bi-directional sync for reading/sending emails, automatic lead creation from incoming emails

**Social Integration** (Pending Setup):
- LinkedIn API via OAuth 2.0
- NOTE: No Replit LinkedIn connector available - requires manual OAuth setup
- User needs to provide: LinkedIn Developer OAuth Client ID and Client Secret
- Features: Message synchronization, contact enrichment

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