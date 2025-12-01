# LinkedIn Posting Assistant

## Overview

LinkedIn Posting Assistant is an AI-powered content creation tool that helps users maintain consistent LinkedIn presence. The application scrapes content from configured sources (research papers, tech news, marketing publications), analyzes articles for relevance, and generates LinkedIn posts in the user's writing style. It provides a complete workflow from content discovery through post refinement to publishing.

**Core Features:**
- Content scouting from multiple configurable sources
- AI-powered article relevance scoring
- Writing style analysis based on user's existing LinkedIn posts
- Automated LinkedIn post generation
- Post refinement and editing interface
- Publishing workflow with draft management

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: 
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- Design philosophy inspired by Linear and Notion (content-first, clean productivity focus)
- Custom theming system supporting light/dark modes

**State Management**:
- TanStack Query (React Query) for server state management and caching
- Local React state for UI interactions
- Query client configured with custom fetch utilities and error handling

**Routing**: Wouter for client-side routing (lightweight alternative to React Router)

**Key Pages**:
- Dashboard - Overview of sources, drafts, and published posts
- Content Scout - Browse and select articles from scraped sources
- Drafts - Edit and refine AI-generated posts
- Published - History of published posts with engagement metrics
- Settings - Configure API keys, LinkedIn profile, and content sources

### Backend Architecture

**Runtime**: Node.js with Express server

**Language**: TypeScript with ES modules

**API Design**:
- RESTful endpoints organized under `/api` prefix
- Structured route registration pattern
- Request/response logging middleware
- JSON body parsing with raw body preservation for webhooks

**Key Routes**:
- `/api/sources` - Content source management (CRUD)
- `/api/articles` - Scraped article storage and retrieval
- `/api/posts` - Generated post management and refinement
- `/api/profile` - LinkedIn profile data and writing style analysis
- `/api/settings` - Application configuration

**Web Scraping**:
- Axios for HTTP requests with custom headers to mimic browser behavior
- Cheerio for HTML parsing and content extraction
- Source-specific scrapers for different publication formats (arXiv, VentureBeat, etc.)
- Configurable scraping intervals per source

**Build System**:
- Custom build script using esbuild for server bundling
- Vite for client build
- Dependency bundling strategy with allowlist for common libraries
- Production builds output to `dist/` directory

### External Dependencies

**AI Services**:
- OpenAI API (GPT-5 model) for:
  - Writing style analysis from existing LinkedIn posts
  - Article relevance scoring
  - LinkedIn post generation in user's voice
  - Post refinement (regenerate, shorten, expand, tone adjustment)
- API key configured via environment variable `OPENAI_API_KEY`

**Database**:
- PostgreSQL via Neon serverless driver (`@neondatabase/serverless`)
- Drizzle ORM for type-safe database queries
- Connection pooling with WebSocket support
- Database URL configured via `DATABASE_URL` environment variable
- Schema defined in `shared/schema.ts` with Drizzle Zod integration

**Database Schema**:
- `content_sources` - Website sources to scrape
- `scraped_articles` - Extracted content from sources
- `generated_posts` - AI-generated LinkedIn posts with status tracking
- `profile_data` - User's LinkedIn profile and writing style analysis
- `settings` - Application configuration
- `users` - User authentication data

**Third-party Libraries**:
- `cheerio` - Server-side HTML parsing for web scraping
- `axios` - HTTP client for external API calls and scraping
- `date-fns` - Date manipulation and formatting
- `ws` - WebSocket support for Neon database
- `zod` - Runtime type validation and schema generation
- `@radix-ui/*` - Accessible UI component primitives
- `class-variance-authority` - Type-safe component variant management
- `tailwindcss` - Utility-first CSS framework

**Development Tools**:
- TypeScript for type safety across frontend and backend
- Path aliases configured for clean imports (`@/`, `@shared/`)
- Shared types between client and server via `shared/` directory
- Hot module replacement in development via Vite
- Environment variable validation on startup

**Design System**:
- Custom color system with HSL values for theming
- Neutral base color scheme (configurable via `tailwind.config.ts`)
- Inter font for UI, Source Sans Pro for content
- Consistent spacing system based on Tailwind's scale
- Elevation system using subtle shadows and backgrounds

**Key Architectural Decisions**:
1. **Monorepo Structure**: Client and server code in single repository with shared types
2. **Type Safety**: End-to-end TypeScript with Zod validation at runtime
3. **Modern React**: Using latest React patterns with hooks and function components
4. **AI-First**: Core functionality built around OpenAI integration for content generation
5. **Scraping Strategy**: Source-agnostic scraper with configurable parsers per publication
6. **Database Design**: Normalized schema with clear separation between sources, articles, and posts
7. **Progressive Enhancement**: Works without JavaScript for core content viewing
8. **Accessibility**: Radix UI primitives ensure ARIA compliance and keyboard navigation