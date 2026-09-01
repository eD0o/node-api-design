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