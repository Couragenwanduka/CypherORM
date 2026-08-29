# Cypher ORM

A lightweight, TypeScript-first ORM for graph databases that speak Cypher — Neo4j, CognoDB, and other Bolt-compatible graph databases.

```typescript
const User = model('User', {
  name: String,
  email: String,
});

const user = await User.create({ name: 'Ada', email: 'ada@example.com' });
const found = await User.find({ name: 'Ada' });
```

No raw Cypher strings. No manual driver boilerplate. Just define a model and go.

## Why I'm building this

I hit Cypher for the first time during a job take-home assignment, and honestly, I wasn't fluent with it in the moment. Instead of letting that be the end of it, I decided to sit with it properly — and the way I learn best is by building.

The tooling gap is real: relational databases have Prisma and Mongoose. Graph databases don't really have an equivalent that feels this clean. So I'm building the one I wished existed, and using the process to learn graph data modeling from the inside out, not just from documentation.

## Status

🚧 **Early / actively in development** — not production-ready yet.

| Feature | Status |
|---|---|
| `create` | ✅ Done |
| `find` | ✅ Done |
| `update` | 🚧 In progress |
| `delete` | 🚧 In progress |
| Relationship helpers (`.connect()`, `.related()`) | 📋 Planned |
| Type inference from model definitions | 📋 Planned |

## Installation

```bash
npm install cypher-orm
```

*(not yet published — coming soon)*

## Quick Start

```typescript
import { connect, model } from 'cypher-orm';

connect({
  uri: process.env.DB_URI,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const Product = model('Product', {
  name: String,
  price: Number,
});

const product = await Product.create({ name: 'Smart Hub X', price: 29.99 });
```

## Goals

- A clean, type-safe API for common graph operations — no raw Cypher for everyday queries
- Sensible defaults, minimal configuration
- Works with any Bolt-compatible graph database via the official Neo4j driver

## Tech Stack

TypeScript · Neo4j JavaScript Driver

## Contributing

This is being built in the open as I learn. Issues, ideas, and PRs are genuinely welcome — even if it's just pointing out something I got wrong.