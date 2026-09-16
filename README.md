# 8 - Error Handling and Testing

## 8.0 - Express 4 vs Express 5 Error Handling

Express already has a built-in error-handling flow, but **Express 5 improved how async errors are forwarded**.

The biggest difference is that Express 5 automatically sends rejected promises and errors thrown inside `async` handlers to the error pipeline.

### **Main Differences**

| Scenario                           | Express 4                                 | Express 5                            |
| ---------------------------------- | ----------------------------------------- | ------------------------------------ |
| Synchronous `throw`                | Caught automatically                      | Caught automatically                 |
| Rejected Promise in route          | Must forward with `next(error)`           | Forwarded automatically              |
| Error inside `async/await` handler | Usually needs `try/catch` + `next(error)` | Automatically forwarded              |
| `asyncHandler()` wrapper           | Common / useful                           | Usually unnecessary                  |
| `next(error)`                      | Required for many async errors            | Still useful for callback-style APIs |
| Default error handler              | Built in                                  | Built in                             |
| Custom error middleware            | Optional, but useful                      | Optional, but useful                 |

### **Express 4**

With Express 4, an async controller normally needs to catch the error and forward it manually:

```ts
app.get("/users/:id", async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);

    res.json(user);
  } catch (error) {
    next(error);
  }
});
```

Another common solution was an async wrapper:

```ts
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
```

Usage:

```ts
router.get("/users/:id", asyncHandler(getUser));
```

The wrapper exists mainly to avoid repeating `try/catch` in every async controller.

### **Express 5**

Express 5 handles rejected promises from route handlers and middleware automatically.

```ts
app.get("/users/:id", async (req, res) => {
  const user = await getUserById(req.params.id);

  res.json(user);
});
```

If:

```ts
await getUserById(...)
```

throws or rejects, Express behaves essentially as if:

```ts
next(error);
```

had been called.

So:

```none
Express 4

async error
    ↓
try/catch
    ↓
next(error)
    ↓
Error Handler
```

becomes:

```none
Express 5

async error
    ↓
Automatic forwarding
    ↓
Error Handler
```

### **Is `asyncHandler()` Still Necessary?**

Usually, **no** when using Express 5.

This:

```ts
router.get("/users/:id", asyncHandler(getUser));
```

can normally become:

```ts
router.get("/users/:id", getUser);
```

as long as `getUser` is an `async` function or returns its Promise.

The wrapper is mainly useful for:

- Express 4 projects
- compatibility with older codebases
- custom behavior beyond simply forwarding errors

### **When is `next(error)` Still Needed?**

Express 5 does not automatically catch every asynchronous callback.

For callback-style APIs:

```ts
app.get("/file", (req, res, next) => {
  fs.readFile("file.txt", (error, data) => {
    if (error) {
      return next(error);
    }

    res.send(data);
  });
});
```

The callback is not the Promise returned by the route handler, so the error still needs to be forwarded manually.

### **Built-in vs Custom Error Handler**

Express includes a **default error handler**, so a custom one is not strictly required.

However, a custom error middleware is still useful for an API:

```ts
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(error);

  res.status(500).json({
    error: "Internal server error",
  });
});
```

The difference is:

```none
Express
   ↓
detects and forwards errors

Custom Error Middleware
   ↓
decides how your API responds
```

A custom handler can centralize:

- JSON error format
- status codes
- logging
- monitoring / error reporting
- hiding internal details in production

### **What Still Matters in Express 5?**

Even with automatic async error forwarding, centralized error handling is still valuable.

What changed is mostly **how errors reach the handler**.

```none
Express 4
Controller
   ↓
try/catch or asyncHandler
   ↓
next(error)
   ↓
Error Middleware

Express 5
Controller
   ↓
throw / rejected Promise
   ↓
Automatic forwarding
   ↓
Error Middleware
```

### **Main Idea**

```none
Express 4
→ async errors usually need manual forwarding

Express 5
→ async errors are usually forwarded automatically

Both
→ have a built-in default error handler
→ can use custom error middleware
```

So in an Express 5 project:

- keep centralized error middleware if you want consistent API responses
- avoid unnecessary `try/catch` whose only purpose is `next(error)`
- an `asyncHandler()` wrapper is usually redundant
- still use `next(error)` when working with callback-style asynchronous APIs

## 8.1 - Error Handling in Express

Express has an **error-handling pipeline** that allows errors to be handled in one centralized place.

This is useful for:

- consistent API error responses
- logging
- monitoring / third-party reporting

### **Error-Handling Middleware**

Regular middleware receives:

```ts
(req, res, next);
```

Error-handling middleware receives **4 arguments**:

```ts
(error, req, res, next);
```

```ts
const errorHandler = (error, req, res, next) => {
  // centralized error handling
};
```

Express recognizes this signature as an error handler.

### **Error Flow**

When an error reaches Express:

```none
Route / Middleware
       ↓
     Error
       ↓
Error Handling Pipeline
       ↓
Error Middleware
```

In Express 5, errors thrown or rejected inside normal `async` handlers are automatically forwarded to this pipeline.

You can still manually forward an error with:

```ts
next(error);
```

This is useful for cases such as callback-style asynchronous APIs.

Calling `next(error)` skips normal middleware and continues to the next error-handling middleware.

### **Why Centralize Errors?**

Instead of:

```none
Controller A → log + format error
Controller B → log + format error
Controller C → log + format error
```

you can use:

```none
Controllers / Middleware
          ↓
   Error Pipeline
          ↓
 Central Error Handler
```

This keeps error formatting, logging, and reporting consistent across the application.

## 8.2 - Error Handler Middleware

A custom error handler gives the API **one central place** to format errors, log them, and decide what should be returned to the client.

In Express, an error-handling middleware has **4 arguments**:

```ts
(error, req, res, next);
```

### APIError + Global Error Handler

```ts
// src/middleware/errorHandler.ts

import type { Request, Response, NextFunction } from "express";

import env from "../../../env.ts";

export class APIError extends Error {
  constructor(
    message: string,
    public status: number = 500,
  ) {
    super(message);
    this.name = "APIError";
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error(error.stack);

  const status = error instanceof APIError ? error.status : 500;

  const message =
    error instanceof APIError ? error.message : "Internal Server Error";

  res.status(status).json({
    error: message,

    ...(env.APP_STAGE === "dev" && {
      stack: error.stack,
      details: error.message,
    }),
  });
};
```

`APIError` extends the normal JavaScript `Error` and adds an HTTP status code.

Example:

```ts
throw new APIError("Habit not found", 404);
```

If a regular unknown error reaches the handler:

```ts
throw new Error("Database error");
```

it falls back to:

```http
500 Internal Server Error
```

### **Why `error: Error` instead of `error: APIError`?**

The global handler may receive errors from:

- your own application
- the database
- third-party libraries
- Express itself

So the handler should accept any normal `Error`:

```ts
error: Error;
```

Then:

```ts
error instanceof APIError;
```

checks whether it is one of your custom API errors.

```none
APIError
→ use custom status + message

Unknown Error
→ 500 Internal Server Error
```

### **`res.headersSent`**

```ts
if (res.headersSent) {
  return next(error);
}
```

If the response has already started, the custom handler should not try to send another response.

Instead, it delegates the error back to Express.

### **Register It Last**

The error handler should be registered **after routes and other middleware**:

```ts
app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandler);
```

Conceptually:

```none
Request
   ↓
Routes / Middleware
   ↓
Error
   ↓
errorHandler
```

### **Using Custom Errors**

Instead of repeating response logic:

```ts
if (!habit) {
  return res.status(404).json({
    error: "Habit not found",
  });
}
```

you can throw:

```ts
if (!habit) {
  throw new APIError("Habit not found", 404);
}
```

Then the global handler formats the response.

```none
throw new APIError(...)
        ↓
Express Error Pipeline
        ↓
errorHandler
        ↓
status + JSON response
```

### **Express 5 Note**

In Express 5, normal `async` controllers do not need a `try/catch` whose only purpose is forwarding an error.

```ts
export const getHabit = async (req, res) => {
  const habit = await findHabit(req.params.id);

  if (!habit) {
    throw new APIError("Habit not found", 404);
  }

  res.json({ habit });
};
```

If the async function throws or its Promise rejects, Express automatically forwards the error to the error-handling pipeline.

`next(error)` is still useful for callback-style APIs or async work outside the returned Promise chain.

### **Development vs Production**

In development, extra details can help debugging:

```ts
...(env.APP_STAGE === 'dev' && {
  stack: error.stack,
  details: error.message,
})
```

In production, avoid exposing stack traces or internal implementation details.

```none
Development → console / stack trace
Production  → logger / monitoring service
```

### **Why Use It?**

Without centralized handling:

```none
Controller A → status + JSON + log
Controller B → status + JSON + log
Controller C → status + JSON + log
```

With a global error handler:

```none
Controllers
    ↓
throw error
    ↓
Error Handler
    ↓
status + JSON + logging
```

This keeps error responses consistent and reduces duplicated code.