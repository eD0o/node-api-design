# 3 - Creating Express Routes

## 3.1 - HTTP Verbs & RESTful Route Patterns

| Method      | Description                                                                  | Example                   |
| ----------- | ---------------------------------------------------------------------------- | ------------------------- |
| **GET**     | Retrieves data from a resource.                                              | `GET /users/123`          |
| **HEAD**    | Same as `GET`, but returns only headers, without the response body.          | `HEAD /users/123`         |
| **POST**    | Creates a new resource or submits data to the server.                        | `POST /users`             |
| **PUT**     | Replaces an existing resource entirely.                                      | `PUT /users/123`          |
| **DELETE**  | Removes a specific resource.                                                 | `DELETE /users/123`       |
| **PATCH**   | Partially updates an existing resource.                                      | `PATCH /users/123`        |
| **OPTIONS** | Returns the HTTP methods/options supported by a resource.                    | `OPTIONS /users`          |
| **CONNECT** | Creates a tunnel to the target server, commonly used with proxies and HTTPS. | `CONNECT example.com:443` |
| **TRACE**   | Performs a diagnostic loop-back test of the request path.                    | `TRACE /users`            |

The ones you'll use most in APIs

For REST APIs, the main ones to remember are:

GET → Read
POST → Create
PUT → Replace
PATCH → Update partially
DELETE → Delete

> Create, Read, Update, and Delete (CRUD) - representing the four primary actions that can be performed on an API.

## 3.2 - Requests & Responses

### Route Matching

Express matches requests using the combination of:

- HTTP method
- Path

`GET /cake` and `POST /cake` are different routes.

If no matching route exists → `404 Not Found`.

### HTTP Status Codes

| Range | Meaning          |
| ----- | ---------------- |
| 2xx   | Success          |
| 3xx   | Redirect / Cache |
| 4xx   | Client error     |
| 5xx   | Server error     |

### Always Send a Response

A route handler that doesn't send a response leaves the request hanging.

```ts
app.post("/cake", (req, res) => {
  res.send("OK"); // always set some answers
});
```

### HTTP Model

HTTP follows a client → request → server → response model.

The client initiates the request.

For real-time/bidirectional communication, alternatives such as WebSockets can be used. Polling repeatedly makes HTTP requests for updates.

### Route Order

When multiple matching routes are registered, Express processes them in registration order.

### Dynamic Route Parameters

```ts
app.get("/cake/:name/:id", (req, res) => {
  res.json(req.params);
});
```

`GET /cake/strawberry/2`

```json
{
  "name": "strawberry",
  "id": "2"
}
```

Dynamic path values are available through `req.params`.

### Query Parameters

Query parameters can be used with any HTTP method, including POST.

However, POST data is usually sent through the request body.

## 3.3 - Subrouters

Sub-routers are individual routers for specific resources that can be mounted onto a top-level router. They are typically created by importing the Router from Express and are organized by resource type (e.g., User Routes, Habit Routes).

```ts
//habitRoutes.ts

import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ message: "habits" });
});

router.get("/:id", (req, res) => {
  res.json({ message: "got one habbit" });
});

router.post("/", (req, res) => {
  res.json({ message: "created habbit" }).status(201);
});

router.delete("/:id", (req, res) => {
  res.json({ message: "deleted habbit" });
});

router.post("/:id/complete", (req, res) => {
  "";
  res.json({ message: "completed habbit" }).status;
});
```

## 3.4 - use middleware

- `app.use()` registers a **middleware** in Express.
- Middleware is a function executed **between the request and the response**.

```ts
app.use((req, res, next) => {
  console.log("Request received");
  next();
});
```

### `next()`

`next()` passes the request to the **next middleware or route handler**.

```text
Request
   ↓
Middleware
   ↓ next()
Middleware
   ↓ next()
Route Handler
   ↓
Response
```

If a middleware doesn't call `next()` or send a response (`res.send()`, `res.json()`, etc.), the request stops there.

### Path-specific Middleware

```ts
app.use("/users", middleware);
```

The middleware runs for paths starting with `/users`:

```text
/users       ✅
/users/123   ✅
/products    ❌
```

### Using with `Router`

`use()` can also delegate a group of routes to a `Router`:

```ts
app.use("/users", userRouter);
app.use("/products", productRouter);
```

```text
GET /users/123
       ↓
app.use('/users', userRouter)
                       ↓
              router.get('/:id')
```

> **Mental model:** `app.use()` = **"Add this middleware or router to the request processing flow."**

## 3.5 - Advanced Routing Strategies

Express routers can be **composed and nested**, allowing an API to be divided into smaller routing modules.

A router can be mounted inside another router:

```ts
const userRouter = Router();
const userHabitsRouter = Router();

userHabitsRouter.get("/", getUserHabits);
userHabitsRouter.post("/", createUserHabit);
userHabitsRouter.delete("/:habitId", deleteUserHabit);

userRouter.use("/:userId/habits", userHabitsRouter);

app.use("/api/users", userRouter);
```

The final path is built by combining every mounted path:

```txt
app
└── /api/users
    └── /:userId/habits
        ├── GET /
        ├── POST /
        └── DELETE /:habitId
```

Which produces:

| Method   | Final Route                 |
| -------- | --------------------------- |
| `GET`    | `/api/users/123/habits`     |
| `POST`   | `/api/users/123/habits`     |
| `DELETE` | `/api/users/123/habits/456` |

The router only knows about its **local path**. Express combines that path with every parent router where it was mounted.

### Router Parameters

Nested routers do not automatically inherit parameters from their parent router.

Use `mergeParams: true` when a child router needs access to them:

```ts
const habitRouter = Router({ mergeParams: true });

habitRouter.get("/", (req, res) => {
  console.log(req.params.userId);
});
```

For:

```txt
GET /api/users/123/habits
```

the child router can access:

```ts
req.params.userId; // "123"
```

### Why Nest Routers?

Router nesting is mainly an **organizational tool**.

It can be useful for separating:

- nested resources
- API versions
- features
- microservices
- routes owned by different teams

```txt
/api
├── /v1
│   ├── /users
│   └── /habits
└── /v2
    ├── /users
    └── /habits
```

There is technically no strict limit to how deeply routers can be nested, but deeper structures make route resolution harder to understand and increase the chance of **route collisions**. Eventually, all routes become part of the same route registry, so registration order still matters.

| Shallow Routing           | Deeply Nested Routing               |
| ------------------------- | ----------------------------------- |
| easier to understand      | more hierarchical                   |
| easier to debug           | useful for complex APIs             |
| fewer possible collisions | greater collision risk              |
| usually simpler           | can reflect domain structure better |

> **Rule of thumb:** use nesting when it improves organization, not just because Express allows it.

---

### Conditional Routes

Routes are normal JavaScript code, so they can be registered conditionally.

#### Environment-specific routes

```ts
if (process.env.NODE_ENV === "development") {
  const devRouter = Router();

  devRouter.get("/debug", debugInfo);
  devRouter.post("/seed", seedDatabase);

  app.use("/dev", devRouter);
}
```

These routes only exist in development.

#### Feature flags

```ts
if (process.env.FEATURE_ANALYTICS === "true") {
  app.use("/api/analytics", analyticsRoutes);
}
```

This allows an endpoint to exist only when a feature is enabled.

Common uses include:

| Condition    | Example                           |
| ------------ | --------------------------------- |
| Environment  | development-only debugging routes |
| Feature flag | enable a new analytics feature    |
| API version  | expose `/v1` and `/v2`            |
| Experiment   | A/B testing                       |

---

### Route Organization Strategies

There is no single correct way to organize routes. The best structure depends on the application and team.

#### Resource-Based

Routes are grouped by the resource they operate on.

```txt
src/routes/
├── authRoutes.ts
├── userRoutes.ts
├── habitRoutes.ts
└── tagRoutes.ts
```

Examples:

```txt
/api/users
/api/habits
/api/tags
/api/auth
```

This is the approach used in the course because it is **simple and flat**.

#### Feature-Based

Routes are grouped by user-facing functionality.

```txt
src/
├── onboarding/
│   ├── registration.ts
│   └── verification.ts
│
├── dashboard/
│   ├── overview.ts
│   └── analytics.ts
│
└── social/
    ├── friends.ts
    └── sharing.ts
```

This can make sense when different teams own different features.

#### Version-Based

Routes are separated by API version.

```txt
src/routes/
├── v1/
│   ├── users.ts
│   └── habits.ts
│
└── v2/
    ├── users.ts
    ├── habits.ts
    └── analytics.ts
```

Mounted as:

```ts
app.use("/api/v1", v1Routes);
app.use("/api/v2", v2Routes);
```

#### Co-location

Instead of putting every route inside `routes/`, everything related to a resource can live together:

```txt
src/
├── users/
│   ├── routes.ts
│   ├── handlers.ts
│   ├── queries.ts
│   └── tests.ts
│
└── habits/
    ├── routes.ts
    ├── handlers.ts
    ├── queries.ts
    └── tests.ts
```

| Strategy       | Organized By        | Useful When                       |
| -------------- | ------------------- | --------------------------------- |
| Resource-based | entity/resource     | REST APIs, simple projects        |
| Feature-based  | user-facing feature | teams own complete features       |
| Version-based  | API version         | maintaining multiple API versions |
| Co-location    | domain/module       | related code should stay together |

There is no inherently correct structure. For smaller applications, keeping things **simple and flat** is often easier to maintain.

---

### Common Endpoints

#### Health Checks

A health endpoint provides a simple way for external systems to check whether the service is running.

```ts
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Habit Tracker API",
  });
});
```

Monitoring services can repeatedly request:

```txt
GET /health
```

and track the result:

```txt
request
   ↓
GET /health
   ↓
200 OK ──────────────► service healthy
non-200 / timeout ──► possible problem
```

Repeated health checks can reveal both:

- **availability** → is the server responding?
- **latency** → is the server becoming slower?

Monitoring systems can then trigger alerts when failures exceed a configured threshold.

A more detailed health endpoint may also check dependencies:

```ts
app.get("/health/detailed", async (req, res) => {
  await db.raw("SELECT 1");
  const redisStatus = await redis.ping();

  res.json({
    status: "OK",
    services: {
      database: "connected",
      redis: redisStatus,
    },
  });
});
```

| Simple Health Check          | Detailed Health Check  |
| ---------------------------- | ---------------------- |
| verifies HTTP server         | verifies dependencies  |
| fast                         | more expensive         |
| usually returns basic status | checks DB, Redis, etc. |
| good for frequent monitoring | good for diagnostics   |

---

### API Versioning

Versioning allows multiple API contracts to coexist.

The simplest approach is URL-based versioning:

```ts
app.use("/api/v1", v1Routes);
app.use("/api/v2", v2Routes);
```

```txt
/api/v1/users
/api/v2/users
```

This makes it possible to introduce breaking changes without immediately removing the previous API.

```txt
Client A ──► /api/v1 ──► old behavior

Client B ──► /api/v2 ──► new behavior
```

---

### Catch-All Routes

A catch-all route handles requests that did not match any previously registered route.

Example for API requests:

```ts
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});
```

It should come **after valid API routes**:

```ts
app.use("/api/users", userRoutes);
app.use("/api/habits", habitRoutes);

// last
app.use("/api/*", apiNotFoundHandler);
```

Flow:

```txt
GET /api/users
      ↓
matches userRoutes
      ↓
response


GET /api/unknown
      ↓
no route matched
      ↓
catch-all
      ↓
404
```

The instructor notes that he does not commonly use this pattern himself, but it is useful to understand because it allows a custom API `404`.

---

### SPA Catch-All

Single Page Applications have a related catch-all pattern.

```ts
app.get("*", (req, res) => {
  res.sendFile("index.html");
});
```

Consider someone opening:

```txt
https://example.com/dashboard
```

The browser initially sends:

```txt
GET /dashboard
```

But `/dashboard` may be a **React Router route**, not a server route.

Therefore:

```txt
GET /dashboard
      ↓
Server
      ↓
index.html
      ↓
JavaScript loads
      ↓
React Router reads /dashboard
      ↓
Dashboard UI
```

The server still has to return the SPA entry point so that client-side routing can take over. Modern development servers and hosting platforms often configure this behavior automatically.

---

### Route Order Matters

Express evaluates matching routes according to their registration order.

This creates an important problem with dynamic parameters.

#### Wrong

```ts
router.get("/:id", getUser);
router.get("/profile", getProfile);
```

`/:id` means essentially:

```txt
/anything
```

Therefore:

```txt
/users/123      → id = "123"
/users/abc      → id = "abc"
/users/profile  → id = "profile"
```

A request to:

```txt
GET /profile
```

matches `/:id` first.

Therefore `/profile` may never be reached.

#### Correct

```ts
router.get("/profile", getProfile);
router.get("/:id", getUser);
```

General rule:

> **Specific routes first, dynamic/general routes later.**

| Route       | Specificity | Order |
| ----------- | ----------: | ----: |
| `/profile`  |        high | first |
| `/settings` |        high | first |
| `/:id`      |         low | later |
| `/*`        |    very low |  last |

This is one of the main routing pitfalls emphasized in the lesson.

---

### Common Routing Pitfalls

| Problem                             | Result                           | Fix                                  |
| ----------------------------------- | -------------------------------- | ------------------------------------ |
| Router is not exported              | router cannot be mounted         | `export default router`              |
| Dynamic route before specific route | wrong handler runs               | put specific routes first            |
| Missing handler                     | Express throws an error          | always provide a handler             |
| Too much router nesting             | difficult debugging / collisions | keep hierarchy as simple as possible |
| Catch-all registered too early      | valid routes become unreachable  | register it last                     |

Example:

```ts
// ❌
router.get("/:id", getUser);
router.get("/profile", getProfile);

// ✅
router.get("/profile", getProfile);
router.get("/:id", getUser);
```

---

### Mental Model

The most useful way to think about Express routing is:

```txt
HTTP Method
    +
Mounted Paths
    +
Local Route
    +
Registration Order
    =
Handler that executes
```

Example:

```ts
app.use("/api/users", userRouter);

userRouter.use("/:userId/habits", habitRouter);

habitRouter.delete("/:habitId", handler);
```

Becomes:

```txt
DELETE /api/users/:userId/habits/:habitId
```

So routers are essentially **composable pieces of a final URL**, while route order determines which matching handler Express reaches first.