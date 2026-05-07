# Campus AI Copilot — Frontend

A full-stack student platform for **IIT Hyderabad** that combines an Instagram-style social feed with a RAG-grounded AI assistant. Students can connect with peers, share posts, RSVP to events, message in real-time, and ask an LLM questions grounded in their college's official documents.

> **Backend repository:** [`cherryhere/campus-ai-backend`](https://github.com/cherryhere/campus-ai-backend)

---

## Why this project

Most college portals are static, ugly, and read-only. Campus AI Copilot is a single platform where a student can:

- **Get instant answers** to questions about syllabus, placements, hostels, and notices — grounded in real college PDFs
- **Connect** with classmates by branch, year, or interest
- **Share** posts, photos, and updates with the campus
- **Chat** in real-time with friends
- **RSVP** to fests and events
- **Upload and analyse** any document via the AI Copilot

It's a real product surface area, not a tutorial app: authentication, role-based access, real-time messaging, file uploads, content moderation, an LLM pipeline, and a multi-page React Router app.

## Features

### Authentication & Profile
- Email + password signup and login (bcrypt + JWT, 30-day sessions)
- Forgot-password flow with one-time reset token (1-hour expiry)
- Change password while logged in
- Editable profile: name, branch, year, interests, bio
- Profile picture upload (5 MB image limit, served as static files)
- Public profile pages with follower / following modals and post history
- First user to sign up is auto-promoted to **Administrator**

### Social
- Campus feed with post composer (text + photo + auto-detected `#hashtags`)
- Like / Comment / Share-to-DM on every post
- Follow and unfollow other students
- Notifications for new followers, likes, comments, system warnings, and DMs
- **Real-time direct messages** via Socket.IO with unread badges
- Conversations list with last-message preview and time
- "Share to follower" modal (only sends to people you follow)

### Trending
- Backend aggregates hashtags across every post and returns the live top 12
- Click a tag in the feed or sidebar to instantly filter the feed
- Counts are computed from the database, not hardcoded

### AI Copilot
- Chat grounded in IIT Hyderabad context (departments, hostel system, fests, fractal academic curriculum)
- File attachment: drop a **PDF or text file** into the chat → the backend extracts text via `pdf-parse` and the LLM analyses it
- Powered by **Groq + Llama 3.3 70B** (free, fast); falls back to **Google Gemini 2.0 Flash** if Groq isn't configured; falls back to a category-aware stub if no key is set
- **Persistent chat history** — every conversation is saved to MySQL; left sidebar shows past chats with previews; click to reopen, hover to delete
- Category-coloured suggested prompt chips, dynamically generated from the documents the admin has uploaded
- "Related Documents" panel surfaces the top 3 PDFs that match each question, with one-click authenticated download

### Events
- Create events with title, date, time, location, category, description
- RSVP toggle with live count
- Category-coloured event cards

### Documents (RAG knowledge base)
- Admin-only PDF upload via the Admin Upload page (multer, 25 MB limit)
- Documents are listed publicly to all students
- Authenticated download — clicking "Download PDF" fetches the file with the user's JWT in the `Authorization` header and triggers a client-side blob download

### Moderation & Safety
- Profanity filter on posts, comments, and direct messages
- First offense: in-app warning notification + warning counter increment
- Second offense: account suspended; suspended users see a red banner and cannot post, comment, or message
- Admin role gates the Admin Upload page (sidebar hidden + route guarded + backend rejects)

### Settings
- Notification preferences (messages, likes, comments, follows)
- Privacy toggles (online status, DMs from followers only)
- Quick links to Edit Profile, Change Password, Terms, Sign out
- Preferences persist in `localStorage`

### Terms & Conditions
- A real, multi-section T&C document specific to Campus AI Copilot at IIT Hyderabad
- Reachable from the profile panel and from Settings → About

### Routing
Every screen has its own URL, deep-linkable and back-button-friendly:

```
/login                /signup                /forgot-password
/dashboard            /feed                  /chat
/messages             /messages/:userId      /connect
/events               /documents             /notifications
/admin                /profile/:id           /settings
/terms                /change-password
```

## Tech Stack

| Layer | Tech | Why |
| --- | --- | --- |
| Framework | **React 19** + **Vite 8** | Modern, fast dev server, instant HMR |
| Routing | **React Router 7** | URL-driven multi-page UX |
| Styling | **Tailwind CSS 3** | Utility-first, rapid design iteration, zero runtime cost |
| Animation | **Framer Motion** | Smooth page transitions and micro-interactions |
| Icons | **Lucide React** | Clean, consistent line icon set |
| Real-time | **socket.io-client** | DM live updates without polling |
| State | Local `useState` / `useEffect` + `localStorage` for session token | Project doesn't need Redux; React's primitives are sufficient |

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx          All page components + Router config
│   ├── api.js           Fetch wrapper with token storage; resource-grouped
│   │                    methods (api.posts.list, api.users.follow, etc.)
│   ├── socket.js        Socket.IO client wrapper, JWT-authenticated
│   ├── main.jsx         BrowserRouter mount
│   └── index.css        Tailwind directives
├── public/              Static assets, screenshots
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## Setup

### Prerequisites
- Node.js 20+
- The [backend](https://github.com/cherryhere/campus-ai-backend) running locally on port 4000

### Run

```bash
git clone https://github.com/cherryhere/campus-ai-frontend.git
cd campus-ai-frontend
npm install
npm run dev
```

Open http://localhost:5173.

### Environment (optional)

Defaults to `http://localhost:4000` for the backend. Override by creating `.env`:

```
VITE_API_URL=https://your-backend-url.example.com
```

## Architecture

```
                        ┌────────────────────────────┐
                        │  React + Vite + R Router    │
                        │  (Tailwind + Framer Motion) │
                        └────────────┬───────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
        REST (fetch)             WebSocket           Static uploads
              │                      │                      │
              ▼                      ▼                      ▼
       ┌──────────────────────────────────────────────────┐
       │            Express + MySQL Backend                │
       │  ─── JWT auth ── multer uploads ── moderation ────│
       │  ─── pdf-parse ── Groq / Gemini ── Socket.IO ─────│
       └────────────┬─────────────────────────────────────┘
                    │
              ┌─────┴──────┐
              │   MySQL 8   │
              └─────────────┘
```

## Roadmap

- Real RAG pipeline: chunk + embed every uploaded PDF, store vectors in **FAISS / ChromaDB**, retrieve top-k chunks per query
- Voice input/output (Web Speech API)
- Push notifications
- Dark mode
- Mobile app (React Native sharing the `api.js` client)

## License

For educational and personal use.

---

**Built by [@cherryhere](https://github.com/cherryhere)** as a demonstration of full-stack engineering: authentication, role-based access, real-time systems, file pipelines, LLM integration, and content moderation in a single coherent product.
