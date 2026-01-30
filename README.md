# Ares-Kanban

AI Agent-Powered Kanban Board - A collaborative kanban board where AI agents and humans work together in harmony.

## 🚀 Features

- **AI Agent Integration**: Native support for Claude Code, OpenCode, and custom AI agents via MCP protocol
- **Real-Time Collaboration**: Multi-user support with presence tracking, conflict detection, and instant sync
- **Project Manager Agent**: Intelligent agent orchestration that delegates tasks and manages workflows
- **Modern UI**: Built with Next.js 14+, shadcn/ui, and Tailwind CSS
- **Docker Support**: Easy deployment with Docker Compose

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (React Server Components, App Router)
- **UI Library**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit
- **Backend**: Supabase (PostgreSQL, Real-time, Auth, Edge Functions)
- **Type Safety**: TypeScript
- **Testing**: Playwright (E2E), Jest (Unit)
- **Containerization**: Docker, Docker Compose

## 📋 Prerequisites

- Node.js 18+ (we use Node.js 20)
- Docker & Docker Compose (optional, for containerized deployment)
- npm, yarn, or pnpm (we use npm)
- Git

## 🚀 Quick Start

### Option 1: Local Development (Recommended)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ares-kanban
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Option 2: Docker Development

1. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

2. **Start Docker Compose**
   ```bash
   npm run docker:dev
   # Or
   docker compose -f docker-compose.dev.yml up
   ```

3. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Option 3: Docker Production

1. **Build Docker image**
   ```bash
   npm run docker:build
   # Or
   docker build -t ares-kanban .
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with production Supabase credentials
   ```

3. **Run Docker container**
   ```bash
   npm run docker:run
   # Or
   docker compose -f docker-compose.yml up
   ```

## 🗄️ Database Setup

### Option 1: Use Supabase Cloud (Recommended)

1. **Create Supabase project**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "New Project"
   - Project name: `ares-kanban-dev`
   - Wait 1-2 minutes for project creation

2. **Get credentials**
   - Go to Project Settings → API
   - Copy `Project URL` and `Anon Key`
   - Add to `.env.local`

3. **Create database schema**
   - Go to SQL Editor in Supabase Dashboard
   - Run the schema migration from `supabase/migrations/001_initial_schema.sql`

### Option 2: Local Supabase with Docker (Advanced)

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Initialize Supabase**
   ```bash
   supabase init
   ```

3. **Start local Supabase**
   ```bash
   supabase start
   ```

4. **Link to cloud project (optional)**
   ```bash
   supabase link --project-ref your-cloud-project-id
   ```

## 📁 Project Structure

```
ares-kanban/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/          # React components
│   │   ├── kanban/         # Kanban board components
│   │   ├── agents/         # Agent components
│   │   └── ui/            # shadcn/ui components
│   ├── lib/                # Utility libraries
│   │   ├── supabase.ts     # Supabase client
│   │   └── utils.ts        # Helper functions
│   └── types/             # TypeScript types
│       └── index.ts
├── public/                 # Static assets
├── docker-compose.yml       # Production Docker config
├── docker-compose.dev.yml   # Development Docker config
├── Dockerfile              # Docker image definition
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Watch Mode
```bash
npm run test:watch
```

## 📝 Development Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type check |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests with Playwright |
| `npm run docker:dev` | Start development Docker Compose |
| `npm run docker:build` | Build Docker image |
| `npm run docker:run` | Run production Docker container |

## 🎯 MVP Features (Phase 1)

### ✅ Sprint 1: Foundation Setup
- [x] Project initialization (Next.js, shadcn/ui, TypeScript)
- [x] Docker setup for deployment
- [ ] Database setup (Supabase, PostgreSQL schema)
- [ ] Authentication system (JWT, user registration, login)
- [ ] Basic kanban board UI (columns, cards, layout)

### 🔄 Sprint 2: Core Kanban Features
- [ ] Column management (add, remove, reorder columns)
- [ ] Card management (rich content, attachments, tags)
- [ ] Drag and drop implementation
- [ ] Task filtering (by assignee, priority, tags)
- [ ] Board views (board, list, calendar)

### 📋 Sprint 3: AI Agent Integration
- [ ] Agent registration system
- [ ] Agent capabilities discovery
- [ ] Task assignment to agents
- [ ] Agent dashboard view
- [ ] MCP protocol implementation

## 🚧 Roadmap

See [`memory/development-log/DEVELOPMENT-ROADMAP.md`](memory/development-log/DEVELOPMENT-ROADMAP.md) for detailed roadmap.

## 📚 Documentation

- [Architecture](memory/architecture/SYSTEM-ARCHITECTURE.md) - System architecture overview
- [Feature Specification](memory/design/FEATURE-SPECIFICATION.md) - Comprehensive feature list
- [Environment Analysis](memory/technical/ENVIRONMENT-ANALYSIS.md) - Environment setup recommendations
- [ADR-001](memory/decisions/ADR-001-PLATFORM-ARCHITECTURE-DECISION.md) - Architecture decision record

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **Project**: Ares-Kanban
- **Vision**: AI Agent-Powered Kanban Board
- **Status**: MVP Development (Phase 1)

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ using Next.js, shadcn/ui, and Supabase**
