# AI Notes App

A full-stack AI-powered note-taking application built with Next.js 14, Hono.js, PostgreSQL, and OpenAI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript |
| UI | shadcn/ui, Tailwind CSS |
| Backend API | Hono.js (as Next.js route handler) |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Authentication | NextAuth.js v4 (credentials) |
| AI | OpenAI GPT-3.5-turbo |
| Validation | Zod + React Hook Form |
| Theme | next-themes (dark/light mode) |

## Features

- **Authentication** — Register, login, protected routes via JWT sessions
- **Notes CRUD** — Create, read, update, delete notes
- **Search** — Search notes by title or content (debounced)
- **AI Summary** — Generate a 2-3 sentence summary of your note
- **AI Improve** — Improve grammar, clarity, and structure
- **AI Tags** — Auto-generate 3-5 relevant tags
- **Dark/Light Theme** — System-aware theme with toggle
- **Responsive** — Works on mobile, tablet, and desktop

## Architecture

```
app/
├── api/
│   ├── auth/[...nextauth]/     # NextAuth.js handler
│   └── [[...route]]/           # Hono.js catch-all API
├── (auth)/
│   ├── login/                  # Login page
│   └── register/               # Register page
└── (dashboard)/
    ├── layout.tsx              # Layout with Navbar
    ├── page.tsx                # Redirects to /notes
    └── notes/
        ├── page.tsx            # Notes list (dashboard)
        ├── new/                # Create new note
        └── [id]/               # View/edit a note

lib/
├── auth.ts                     # NextAuth config
├── openai.ts                   # OpenAI client
├── prisma.ts                   # Prisma singleton
├── utils.ts                    # Helpers (cn, formatDate)
└── validations.ts              # Zod schemas

components/
├── Navbar.tsx                  # Top nav with user menu
├── NoteCard.tsx                # Note preview card
├── NoteEditor.tsx              # Note create/edit form
├── AIButton.tsx                # Reusable AI action button
├── SearchBar.tsx               # Debounced search input
└── ThemeToggle.tsx             # Dark/light toggle
```

## API Routes (Hono.js)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register new user |
| GET | `/api/notes` | Get all notes (supports `?q=search`) |
| POST | `/api/notes` | Create a note |
| GET | `/api/notes/:id` | Get a note |
| PUT | `/api/notes/:id` | Update a note |
| DELETE | `/api/notes/:id` | Delete a note |
| POST | `/api/notes/:id/ai/summary` | Generate AI summary |
| POST | `/api/notes/:id/ai/improve` | Improve note content |
| POST | `/api/notes/:id/ai/tags` | Generate tags |

## Local Setup

### Prerequisites
- Node.js 18+
- A free [Neon](https://neon.tech) PostgreSQL database
- OpenAI API key

### Steps

```bash
# 1. Clone the repo
git clone <repo-url>
cd ai-notes-app

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, OPENAI_API_KEY

# 4. Push the database schema
npx prisma db push

# 5. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables from `.env.example`
4. Deploy

## Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String   (bcrypt hashed)
  notes     Note[]
}

model Note {
  id        String   @id @default(cuid())
  title     String
  content   String   @db.Text
  summary   String?  @db.Text  (AI generated)
  tags      String[]           (AI generated)
  userId    String
}
```

## AI Integration

All AI features use **OpenAI GPT-3.5-turbo** via the official SDK:

- **Summary**: Condenses note content into 2-3 sentences
- **Improve**: Rewrites for better grammar and clarity (preserves meaning)
- **Tags**: Generates 3-5 lowercase tags as a JSON array

Error handling includes rate limit (429) detection with user-friendly messages.
