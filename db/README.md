### Database migrations (Neon Postgres)

Tooling: node-pg-migrate

Prereqs:
- Node.js 18+

Install deps:
```
cd db
npm install
```

Set DATABASE_URL to your Neon connection string and run migrations:
```
$env:DATABASE_URL = "postgres://user:pass@host/db"  # PowerShell
npm run migrate:up
```

Other commands:
```
npm run migrate:status
npm run migrate:down
```

Initial schema:
- events(id PK, event_name, event_time, event_description, route, event_start, created_at, updated_at)
- participants(id PK, name, country, club, starting_number, email, phone, event_id FK -> events, created_at, updated_at)
- Constraints: unique(event_id, starting_number), unique(event_id, email)
- Indexes: participants(event_id), events(event_time)

Notes:
- Required fields: events.event_name, events.event_time; participants.name, participants.starting_number, participants.email
- Starting numbers are unique per event. Allocation policy is up to the app logic.

