Cypher ORM

A lightweight, TypeScript-first ORM for graph databases that speak Cypher (Neo4j, CognoDB, and other Bolt-compatible graph databases).

Why

I started this project after working directly with Cypher and a graph database for the first time during a job take-home assignment. The existing tooling in this space felt thin compared to what's available for relational databases (Prisma, Mongoose) — so I decided to build the ORM I wished existed, and use the process to genuinely learn graph data modeling from the inside out.

Status: Early / Work in Progress

This is an active learning project, not a production-ready library yet. Currently implemented:

✅ create — define a node/model and create instances
✅ find — query nodes by properties
🚧 update, delete — in progress
🚧 Relationship helpers (.connect(), .related()) — planned
🚧 TypeScript type inference from model definitions — planned
Goals
A clean, type-safe API for common graph operations without writing raw Cypher for every query
Sensible defaults, minimal configuration
Works with any Bolt-compatible graph database via the official Neo4j driver
Tech Stack

TypeScript, Neo4j JavaScript Driver

Feedback, ideas, and contributions welcome — this is very much being built in the open as I learn.