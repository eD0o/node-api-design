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
