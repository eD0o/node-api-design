# 7 - CRUD Routes

## 7.1 - RESTful Route Design Review

Before implementing CRUD controllers, it helps to review how **REST routes, HTTP methods, middleware, and controllers** work together.

A request usually follows this flow:

```none
Request
   ↓
Router
   ↓
Middleware
   ├─ Authentication
   └─ Validation
   ↓
Controller
   ↓
Database / Business Logic
   ↓
Response
```

The router decides **which controller should run**, while middleware performs checks before the request reaches the controller.

### CRUD Operations

Most APIs are built around four basic operations:

| Operation | HTTP Method     | Example Route     | Typical Status              |
| --------- | --------------- | ----------------- | --------------------------- |
| Create    | `POST`          | `/api/habits`     | `201 Created`               |
| Read      | `GET`           | `/api/habits`     | `200 OK`                    |
| Read One  | `GET`           | `/api/habits/:id` | `200 OK`                    |
| Update    | `PUT` / `PATCH` | `/api/habits/:id` | `200 OK`                    |
| Delete    | `DELETE`        | `/api/habits/:id` | `200 OK` / `204 No Content` |

CRUD stands for:

```none
Create
Read
Update
Delete
```

### RESTful Route Design

REST uses predictable URL and HTTP method conventions.

The **URL represents the resource**:

```http
/api/habits
```

The **HTTP method represents the action**:

```none
GET     → Read
POST    → Create
PUT     → Update
DELETE  → Delete
```

This means:

```none
Route + HTTP Method = Controller
```

Example:

```ts
router.get("/habits", getUserHabits);
router.get("/habits/:id", getHabitById);
router.post("/habits", createHabit);
router.put("/habits/:id", updateHabit);
router.delete("/habits/:id", deleteHabit);
```

Even when the route is similar, changing the HTTP method changes the operation.

### REST Principles

Some useful REST conventions are:

- **Resources as URLs** → `/api/habits`
- **HTTP methods as actions** → `GET`, `POST`, `PUT`, `DELETE`
- **Stateless requests** → every request should contain the information needed to process it
- **Consistent routes** → similar resources should follow similar patterns

The goal is to make an API predictable.

### HTTP Status Codes

Status codes tell the client what happened.

#### 2xx — Success

- `200 OK` → standard successful response
- `201 Created` → a new resource was created
- `204 No Content` → success without a response body

#### 4xx — Client Errors

- `400 Bad Request` → invalid input
- `401 Unauthorized` → authentication credentials were not provided
- `403 Forbidden` → credentials were provided, but access is not allowed
- `404 Not Found` → the requested resource does not exist
- `409 Conflict` → the request conflicts with existing data

Example:

```none
Missing Bearer Token → 401
Invalid / forbidden access → 403
Missing resource → 404
Duplicate resource → 409
```

#### 5xx — Server Errors

- `500 Internal Server Error` → something failed inside the server
- `502 Bad Gateway` → an upstream service failed
- `503 Service Unavailable` → the server is temporarily unavailable

### Controllers

Controllers contain the code that performs the actual operation requested by the client.

For example:

```ts
router.post("/habits", createHabit);
```

means:

```none
POST /api/habits
      ↓
createHabit()
```

The controller can then:

```none
Read request data
      ↓
Use authenticated user
      ↓
Query / modify database
      ↓
Return response
```

Because authentication and validation can happen in middleware first, controllers can stay focused on the actual CRUD operation.

## 7.2 - Create Habit Controller

The `createHabit` controller handles the **Create** part of CRUD:

```http
POST /api/habits
```

Because this route is protected, the controller receives an `AuthenticatedRequest`, so it can safely access:

```ts
req.user!.id;
```

This lets the API associate the new habit with the authenticated user.

### Create Habit Flow

```none
Authenticated Request
        ↓
Read req.body
        ↓
Get req.user.id
        ↓
Start Database Transaction
        ↓
Create Habit
        ↓
Create Habit ↔ Tag Associations
        ↓
Commit Transaction
        ↓
201 Created
```

Example controller:

```ts
import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { habits, habitTags } from "../db/schema.ts";

export const createHabit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, frequency, targetCount, tagIds } = req.body;

    const userId = req.user!.id;

    const result = await db.transaction(async (tx) => {
      const [newHabit] = await tx
        .insert(habits)
        .values({
          userId,
          name,
          description,
          frequency,
          targetCount,
        })
        .returning();

      if (tagIds && tagIds.length > 0) {
        const habitTagValues = tagIds.map((tagId: string) => ({
          habitId: newHabit.id,
          tagId,
        }));

        await tx.insert(habitTags).values(habitTagValues);
      }

      return newHabit;
    });

    return res.status(201).json({
      message: "Habit created successfully",
      habit: result,
    });
  } catch (error) {
    console.error("Create habit error:", error);

    return res.status(500).json({
      error: "Failed to create habit",
    });
  }
};
```

### Why use a Database Transaction?

This controller may perform **more than one database write**:

```none
1. Insert the habit
2. Insert the habit-tag relationships
```

These operations belong to the same logical action:

> "Create this habit with these tags."

The problem is that database operations can fail independently.

Without a transaction:

```none
Create Habit ✅
      ↓
Create Tag Relationships ❌
```

The habit would remain in the database even though the complete operation failed.

This creates a **partial update** and can leave the database in an inconsistent state.

### Transaction = All or Nothing

A transaction groups multiple database operations into one unit of work.

```ts
await db.transaction(async (tx) => {
  // operation 1
  // operation 2
  // operation 3
});
```

The rule is:

```none
Everything succeeds
        ↓
COMMIT ✅
```

or:

```none
Something fails
        ↓
ROLLBACK ↩
        ↓
Nothing is saved
```

So the transaction guarantees:

```none
ALL operations succeed
        OR
NO operations are applied
```

### Habit Example

Imagine the user sends:

```json
{
  "name": "Workout",
  "frequency": "daily",
  "tagIds": ["tag-1", "tag-2"]
}
```

The API needs to create the habit and then its tag relationships.

If one relationship fails after the habit was created:

```none
INSERT habit ✅
INSERT habitTags ✅
INSERT habitTags ❌
```

the transaction rolls everything back:

```none
ROLLBACK

Habit ❌
Tag relationship ❌
Tag relationship ❌
```

The database returns to the state it had **before the transaction started**.

### Real-World Example: Bank Transfer

A common example is transferring money between accounts.

Without a transaction:

```none
Remove $100 from Account A ✅
            ↓
Add $100 to Account B ❌
```

Now the money disappeared.

With a transaction:

```none
BEGIN TRANSACTION

Remove $100 from A ✅
Add $100 to B ❌

ROLLBACK
```

Final result:

```none
Account A → unchanged
Account B → unchanged
```

The transfer either happens completely or does not happen at all.

### `tx` vs `db`

Inside the transaction, use:

```ts
tx.insert(...)
tx.update(...)
tx.delete(...)
```

instead of:

```ts
db.insert(...)
```

Example:

```ts
await db.transaction(async (tx) => {
  await tx.insert(habits);
  await tx.insert(habitTags);
});
```

Only operations executed through `tx` belong to that transaction.

If you use `db` inside it:

```ts
await db.transaction(async (tx) => {
  await tx.insert(habits);

  await db.insert(habitTags); // outside the transaction
});
```

the second operation is not guaranteed to roll back with the first one.

### Returning from a Transaction

The value returned inside the callback becomes the result of the transaction:

```ts
const result = await db.transaction(async (tx) => {
  const [newHabit] = await tx
    .insert(habits)
    .values(...)
    .returning()

  return newHabit
})
```

So:

```ts
result;
```

contains the newly created habit.

### Many-to-Many Relationship

Habits and tags have a **many-to-many** relationship.

The junction table:

```none
habitTags
```

connects them using:

```none
habitId
tagId
```

For multiple tags:

```ts
const habitTagValues = tagIds.map((tagId: string) => ({
  habitId: newHabit.id,
  tagId,
}));
```

Then all associations can be inserted together:

```ts
await tx.insert(habitTags).values(habitTagValues);
```

### Why `userId` comes from `req.user`

The client should not decide who owns the habit.

Instead of trusting something like:

```json
{
  "userId": "123"
}
```

the server gets the authenticated user's ID from:

```ts
req.user!.id;
```

This came from the verified JWT.

```none
JWT
 ↓
Authentication Middleware
 ↓
req.user.id
 ↓
New Habit.userId
```

### Status Codes

Successful creation:

```http
201 Created
```

Unexpected database or server failure:

```http
500 Internal Server Error
```

At this point, input validation and authentication should already have happened before the controller runs.

### Key Patterns

- Uses `AuthenticatedRequest`
- Gets the owner from `req.user.id`
- Uses a database transaction for multiple related writes
- Uses `tx` for every operation inside the transaction
- Rolls back all changes if one write fails
- Handles the `habits ↔ tags` many-to-many relationship
- Returns `201 Created` after successful creation

### Main Idea

```none
Multiple writes that represent ONE action
                 ↓
          Use a transaction
                 ↓
        All succeed or none do
```

A transaction protects the database from being left in a **partially updated state**.

## 7.3 - Get All Habits Controller

Gets all habits that belong to the authenticated user.

```ts
export const getUserHabits = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user!.id;

    const userHabitsWithTags = await db.query.habits.findMany({
      where: eq(habits.userId, userId),
      with: {
        habitTags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: [desc(habits.createdAt)],
    });

    const habitsWithTags = userHabitsWithTags.map((habit) => ({
      ...habit,
      tags: habit.habitTags.map((ht) => ht.tag),
      habitTags: undefined,
    }));

    res.json({
      habits: habitsWithTags,
    });
  } catch (error) {
    console.error("Get habits error:", error);
    res.status(500).json({ error: "Failed to fetch habits" });
  }
};
```

### `where`

```ts
where: eq(habits.userId, userId);
```

Returns only habits owned by the authenticated user.

### `with`

```ts
with: {
  habitTags: {
    with: {
      tag: true,
    },
  },
}
```

`with` loads related data using the relations defined in Drizzle:

```none
Habit → habitTags → Tag
```

`tag: true` means: **include the related tag object**.

### `orderBy`

```ts
orderBy: [desc(habits.createdAt)];
```

Returns the newest habits first.

### Flattening the Result

Drizzle initially returns:

```none
Habit
 └─ habitTags[]
      └─ tag
```

The `map()` transforms it into:

```none
Habit
 └─ tags[]
```

```ts
tags: habit.habitTags.map((ht) => ht.tag);
```

`habitTags: undefined` removes the intermediate relation from the JSON response.

### Route

```ts
router.get("/", getUserHabits);
```

There is no body validation because this request sends no body, params, or query values.

A GET route could still use `validateQuery()` or `validateParams()` if those inputs existed.

## 7.4 - Update Habit Controller

