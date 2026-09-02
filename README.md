# 5 - PostgreSQL Database Setup

PostgreSQL is a relational database that stores structured data in tables and connects that data through relationships.

In this chapter, we'll model the data for our habit tracking API.

## 5.1 - Database Schemas

A **database schema** defines how application data is structured and how different pieces of data relate to each other.

### Relational Database Basics

Relational databases organize data into **tables**, made of rows and columns.

| Database    | Meaning                    | JavaScript Mental Model |
| ----------- | -------------------------- | ----------------------- |
| Table       | Collection of entities     | Array                   |
| Row         | Individual record          | Object                  |
| Column      | Attribute of a record      | Object field            |
| Primary Key | Unique identifier          | Object ID               |
| Foreign Key | Reference to another table | Another object's ID     |

### Designing the Schema

A useful way to design a schema is to start from the application's **features or user journeys**.

For the habit tracking API:

```text
User logs in
    ↓
User sees their habits
```

This tells us that one user can own multiple habits:

```text
User 1 ──────── * Habits
```

This is a **one-to-many relationship**.

### Primary Keys

A **primary key** uniquely identifies a row in a table.

```text
users

id | name
---|------
1  | John
2  | Jane
```

Here, `id` is the primary key.

```text
Primary Key → this record's ID
```

### Foreign Keys

A **foreign key** references the primary key of another table.

```text
users

id | name
---|------
1  | John


habits

id | user_id | name
---|---------|------
1  | 1       | Run
2  | 1       | Read
```

`habits.user_id` references `users.id`, connecting each habit to its owner.

```text
Primary Key → my ID
Foreign Key → another table's ID
```

### Common Relationships

```text
One-to-One
User ───── Profile

One-to-Many
User ─────< Habits

Many-to-Many
Users >────< Groups
```

For this API, the main relationship is:

```text
User 1 ──────── * Habits
```

One user can have many habits, while each habit belongs to one user.

## 5.2 - PostgreSQL & ORMs

PostgreSQL works very well with Node.js and has a strong ecosystem of database tools and ORMs.

Some useful PostgreSQL features include:

- JSON and array types
- Custom data types
- Full-text search
- Geospatial data support
- Complex queries
- Open-source licensing

### What is an ORM?

**ORM** stands for **Object-Relational Mapping**.

An ORM provides an API for interacting with a relational database from application code.

Without an ORM, you might write SQL directly:

```ts
const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
```

With an ORM, the same operation can be expressed through a typed API:

```ts
const user = await db.select().from(users).where(eq(users.id, userId));
```

> ORMs reduce SQL injection risk by encouraging parameterized queries, but they do not eliminate the risk if you use raw or dynamically constructed SQL unsafely.

### Why use an ORM?

ORMs can provide:

- Type-safe database queries
- Better TypeScript integration
- Easier schema management
- Less repetitive SQL
- Safer parameterized queries
- Better developer experience

An ORM does not replace SQL knowledge, but it makes common database operations easier to write and maintain.

## 5.3 - Migrations

Migrations are a way to **version changes in a database**.

They move a database from an old state to a new one while keeping its schema and existing data consistent.

```text
Schema v1
   ↓ migration
Schema v2
   ↓ migration
Schema v3
```

A database schema acts like a **contract**: the application expects tables, columns, and data types to have a specific structure.

### Schema Migrations

Schema migrations change the **structure** of the database.

Common examples:

```sql
-- Create a table
CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

-- Add a column
ALTER TABLE habits
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Add an index
CREATE INDEX idx_habits_user_id
ON habits(user_id);
```

Typical schema changes include:

- Creating or removing tables
- Adding or removing columns
- Renaming columns
- Changing column types
- Adding indexes or constraints

### Data Migrations

Data migrations **transform existing data** so it works with the new schema.

For example, if a new column becomes required:

```sql
-- Add the column
ALTER TABLE users
ADD COLUMN username VARCHAR(50);

-- Populate existing rows
UPDATE users
SET username = 'user_' || id
WHERE username IS NULL;

-- Make it required
ALTER TABLE users
ALTER COLUMN username SET NOT NULL;
```

The schema changed, but the existing data also had to be updated.

### Schema + Data Migrations

Real migrations often combine both.

For example, replacing `target_days_per_week` with `frequency`:

```sql
-- 1. Add the new column
ALTER TABLE habits
ADD COLUMN frequency VARCHAR(20);

-- 2. Migrate existing data
UPDATE habits
SET frequency =
  CASE
    WHEN target_days_per_week = 7 THEN 'daily'
    WHEN target_days_per_week BETWEEN 3 AND 6 THEN 'weekly'
    ELSE 'monthly'
  END;

-- 3. Make the new column required
ALTER TABLE habits
ALTER COLUMN frequency SET NOT NULL;

-- 4. Remove the old column
ALTER TABLE habits
DROP COLUMN target_days_per_week;
```

```text
Old schema
    ↓
Add new structure
    ↓
Move existing data
    ↓
Enforce new structure
    ↓
Remove old structure
```

### Destructive vs Non-Destructive Changes

**Non-destructive changes** preserve existing data and are usually easier to migrate.

```sql
ALTER TABLE users
ADD COLUMN nickname TEXT;
```

Adding an optional column does not require existing records to change.

**Destructive changes** can break existing code or data.

Examples:

- Removing a column
- Renaming a column
- Changing an incompatible data type

A safer strategy is to migrate gradually:

```text
1. Add the new optional field
2. Update the application to use it
3. Migrate existing data
4. Remove the old field later
```

This reduces the risk of downtime and data loss.

### Migration Workflow

```text
Change schema in code
        ↓
Generate migration
        ↓
Review migration
        ↓
Test it
        ↓
Apply it to the database
        ↓
Deploy
```

Migration files can be written manually or generated by tools such as an ORM, but they should still be reviewed before being applied to production.

### Habit Tracker Schema

The habit tracker API uses five tables:

```text
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Users    │    │   Habits    │    │   Entries   │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ id (PK)     │◄───┤ userId (FK) │◄───┤ habitId(FK) │
│ email       │    │ name        │    │ completion  │
│ username    │    │ description │    │ note        │
│ password    │    │ frequency   │    │ createdAt   │
│ firstName   │    │ targetCount │    └─────────────┘
│ lastName    │    │ isActive    │
│ createdAt   │    │ createdAt   │
│ updatedAt   │    │ updatedAt   │
└─────────────┘    └─────────────┘
                           │
                           │ Many-to-Many
                           │
                   ┌─────────────┐    ┌─────────────┐
                   │ HabitTags   │    │    Tags     │
                   ├─────────────┤    ├─────────────┤
                   │ id (PK)     │    │ id (PK)     │
                   │ habitId(FK) ├────┤ name        │
                   │ tagId (FK)  │    │ color       │
                   │ createdAt   │    │ createdAt   │
                   └─────────────┘    │ updatedAt   │
                                      └─────────────┘
```

Relationships:

- One **User** can have many **Habits**
- One **Habit** can have many **Entries**
- **Habits** and **Tags** have a many-to-many relationship
- `HabitTags` is the join table connecting them

> **Migration = a versioned change that moves a database and its existing data from one valid state to another.**

## 5.4 - Creating Tables with Drizzle

Drizzle lets us define PostgreSQL tables directly in TypeScript. Each `pgTable()` describes a real database table, including its columns, types, constraints, and foreign keys.

```ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),

  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const habits = pgTable("habits", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  frequency: varchar("frequency", { length: 20 }).notNull(),
  targetCount: integer("target_count").default(1),
  isActive: boolean("is_active").default(true).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("updated_at").defaultNow().notNull(),
});

export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().defaultRandom(),

  habitId: uuid("habit_id")
    .references(() => habits.id, {
      onDelete: "cascade",
    })
    .notNull(),

  completionDate: timestamp("completion_date").defaultNow().notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),

  name: varchar("name", { length: 50 }).notNull().unique(),
  color: varchar("color", { length: 7 }).default("#6b7280"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updateAt: timestamp("updated_at").defaultNow().notNull(),
});

export const habitTags = pgTable("habitTags", {
  id: uuid("id").primaryKey().defaultRandom(),

  habitId: uuid("habit_id")
    .references(() => habits.id, {
      onDelete: "cascade",
    })
    .notNull(),

  tagID: uuid("tag_id")
    .references(() => tags.id, {
      onDelete: "cascade",
    })
    .notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Table and Column Definitions

`pgTable()` creates a PostgreSQL table definition.

```ts
export const users = pgTable("users", {
  // columns
});
```

The object keys are the names used by Drizzle in TypeScript, while the strings passed to each column function are the actual PostgreSQL column names.

```ts
firstName: varchar("first_name", { length: 50 });
```

```text
TypeScript: users.firstName
Database:   first_name
```

Common column helpers include:

```ts
uuid("id");
varchar("name", { length: 100 });
text("description");
integer("target_count");
boolean("is_active");
timestamp("created_at");
```

Common constraints and defaults:

```ts
.primaryKey()    // Primary Key
.defaultRandom() // Generate a random UUID
.notNull()       // Value is required
.default(...)    // Default value
.defaultNow()    // Current timestamp by default
.unique()        // Value must be unique
```

### Indexes

An **index** is a separate database structure that helps the database locate rows faster.

Without an index, finding a value may require scanning many rows in the table:

```sql
SELECT *
FROM users
WHERE email = 'john@example.com';
```

Conceptually:

```text
Without index:

users
  ↓
check row
  ↓
check row
  ↓
check row
  ↓
find email
```

With an index, the database has a faster way to locate where a value is stored:

```text
Index

john@example.com → location of the user row
```

A useful mental model is:

```text
Table = where the data lives
Index = shortcut for finding the data
```

This is especially useful for columns that are searched frequently, such as IDs, emails, or usernames.

#### Unique Indexes

In this schema:

```ts
email: varchar("email", { length: 255 }).notNull().unique();
```

`.unique()` ensures that the value cannot appear more than once.

```text
john@example.com ✅
mary@example.com ✅
john@example.com ❌
```

This is useful for fields such as:

- email
- username
- globally unique tag names

It also makes checking whether a value already exists much more efficient than repeatedly scanning the full table.

> **Important:** uniqueness applies to the scope of the column. For example, `tags.name.unique()` makes tag names unique globally. If every user should be allowed to create their own `"fitness"` tag, a compound unique index such as `(userId, name)` would be more appropriate.

### Foreign Keys

Foreign keys connect records between tables.

For example:

```ts
userId: uuid("user_id")
  .references(() => users.id)
  .notNull();
```

means:

```text
habits.user_id
      │
      └──── references ────> users.id
```

A habit must reference an existing user because `userId` is both a Foreign Key and `NOT NULL`.

The same idea is used between `entries` and `habits`:

```ts
habitId: uuid("habit_id")
  .references(() => habits.id)
  .notNull();
```

So the relationship is:

```text
User
 └── Habit
      └── Entry
```

### Cascading Deletes

Foreign keys can also define what happens when the referenced record is deleted.

```ts
.references(() => users.id, {
  onDelete: 'cascade',
})
```

`onDelete: 'cascade'` means:

> If the parent record is deleted, automatically delete the records that depend on it.

For example:

```text
User
 ├── Habit A
 ├── Habit B
 └── Habit C
```

Deleting the user also deletes their habits:

```text
DELETE User
   ↓
DELETE Habit A
DELETE Habit B
DELETE Habit C
```

Because `entries.habitId` also uses a cascade:

```text
DELETE User
   ↓
DELETE Habits
   ↓
DELETE Entries
```

This prevents records from being left behind without the parent they belong to.

The same logic is used in `habitTags`:

```text
Habit ── habitTags ── Tag
```

If either the habit or tag is deleted, the related join-table records are automatically removed.

### Many-to-Many with `habitTags`

A habit can have many tags, and a tag can belong to many habits.

That requires a join table:

```ts
export const habitTags = pgTable("habitTags", {
  id: uuid("id").primaryKey().defaultRandom(),

  habitId: uuid("habit_id")
    .references(() => habits.id, { onDelete: "cascade" })
    .notNull(),

  tagID: uuid("tag_id")
    .references(() => tags.id, { onDelete: "cascade" })
    .notNull(),
});
```

Example:

```text
habitTags

habit_id   tag_id
------------------
habit-1    tag-A
habit-1    tag-B
habit-1    tag-C
habit-2    tag-A
```

This lets us query:

```text
Habit → all of its tags
Tag   → all habits using that tag
```

Each row represents one relationship between one habit and one tag.

### Mental Model

```text
users
  │
  │ 1:N
  ▼
habits
  │
  │ 1:N
  ▼
entries

habits
  │
  │ N:N
  ▼
habitTags
  ▲
  │
tags
```

The key ideas are:

```text
pgTable()        → defines a database table
primaryKey()     → uniquely identifies a row
unique()         → prevents duplicate values and creates a fast lookup path
references()     → creates a Foreign Key
notNull()        → requires a value
onDelete:cascade → deletes dependent records with their parent
habitTags        → represents the many-to-many Habit ↔ Tag relationship
```
