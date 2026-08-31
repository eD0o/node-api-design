# 4 - Middleware

## 4.1 - Express Middleware

Middleware is code that runs **between a request and the final handler**.

```txt
Request
   ↓
Middleware
   ↓
Handler
   ↓
Response
```

A middleware can:

- inspect a request
- modify request or response data
- continue the flow
- stop the flow and send a response early

### Basic Structure

```ts
const middleware = (req, res, next) => {
  // middleware logic
};
```

| Parameter | Purpose                     |
| --------- | --------------------------- |
| `req`     | incoming request            |
| `res`     | outgoing response           |
| `next`    | allows the flow to continue |

> A middleware can either **continue** or **respond early**.

### Inspecting and Modifying Requests

Middleware can read request information:

```ts
console.log(req.method);
console.log(req.url);
console.log(req.headers);
```

It can also attach new data:

```ts
req.receivedAt = Date.now();
```

That data can then be used later by the application.

### Short-Circuiting

Middleware can respond before the handler runs.

```ts
const checkAuth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  // continue request
};
```

```txt
Request
   ↓
Middleware
   ├── Unauthorized → 401 Response
   └── Allowed      → Handler
```

This is called **short-circuiting**.

### One Request, One Response

A request should only receive one response.

```ts
res.json({ message: "Hello" });

res.json({ message: "Again" }); // ❌
```

Once a response is sent, the request is already handled.

### `return` vs Response

These are different:

```ts
return;
```

stops the JavaScript function, but does **not** send a response.

```ts
res.json({ message: "Hello" });
```

sends a response.

| Operation           | Stops function? | Sends response? |
| ------------------- | --------------: | --------------: |
| `return`            |              ✅ |              ❌ |
| `res.send()`        |   not by itself |              ✅ |
| `res.json()`        |   not by itself |              ✅ |
| `return res.json()` |              ✅ |              ✅ |

A common pattern is:

```ts
return res.status(401).json({
  error: "Unauthorized",
});
```

## 4.2 - Network, Frontend, & Backend Middleware

Middleware is not specific to Express.

The same pattern can exist in different parts of a web application:

```txt
Input
  ↓
Middleware
  ↓
Next Stage
```

| Layer    | Example              | Common Use                       |
| -------- | -------------------- | -------------------------------- |
| Network  | Edge Function        | redirect or rewrite requests     |
| Network  | Reverse Proxy        | add headers and forward requests |
| Frontend | Request Interceptor  | add auth tokens                  |
| Frontend | Response Interceptor | handle errors                    |
| Frontend | Protected Route      | control navigation               |
| Backend  | Express Middleware   | logging, auth, parsing           |

> Network middleware can run **before the request reaches the application server**.

#### Edge Function

```txt
Client
   ↓
CDN / Edge
   ↓
Middleware
   ↓
Origin Server
```

Example:

```txt
GET /about/team
       ↓
Edge Middleware
       ↓
Redirect to /
```

The origin server may never receive the request.

#### Reverse Proxy

A reverse proxy can modify and forward requests:

```txt
Client
   ↓
Reverse Proxy
   ↓
Add Headers
   ↓
Backend
```

Example:

```nginx
location / {
  proxy_set_header X-Real-IP $remote_addr;
  proxy_pass http://backend;
}
```

### Frontend Middleware

Frontend middleware often appears as **interceptors**.

#### Request Interceptor

A request interceptor can add authentication automatically:

```ts
axios.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${getToken()}`;

  return config;
});
```

```txt
App
 ↓
Interceptor
 ↓
Add Token
 ↓
API
```

#### Response Interceptor

A response interceptor can handle shared errors:

```ts
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);
```

```txt
Server Response
      ↓
Interceptor
      ↓
Application
```

### Protected Routes

Frontend routing can use the same pattern:

```tsx
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};
```

```txt
/dashboard
    ↓
ProtectedRoute
   /      \
 no       yes
 ↓         ↓
/login   Dashboard
```

### Backend Middleware

Express middleware runs on the server before route handlers.

```ts
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(logger);

app.use("/api/users", userRoutes);
```

| Middleware       | Purpose            |
| ---------------- | ------------------ |
| `helmet()`       | security headers   |
| `cors()`         | CORS configuration |
| `express.json()` | parse JSON bodies  |
| logger           | request logging    |
| auth middleware  | authentication     |

### Global Middleware

Using `app.use()` without a path lets middleware apply across many routes.

```ts
app.use(logger);

app.use("/api/users", userRoutes);
app.use("/api/habits", habitRoutes);
```

Useful global middleware includes:

- logging
- analytics
- authentication
- security
- request parsing

## 4.3 - `next()`

In Express, `next()` tells Express to **continue processing the current request**.

```text
Request
  ↓
Middleware
  ↓ next()
Next middleware / route handler
```

If a middleware does not send a response, throw an error, or call `next()`, the request can stay **hanging**.

```ts
const logger = (req, res, next) => {
  console.log(req.method);

  next();
};
```

This middleware only observes the request, so it always continues.

### Go / No-Go Middleware

A common pattern is checking whether the request is allowed to continue.

```ts
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  next();
};
```

Flow:

```text
        authenticate
             ↓
        token exists?
         /        \
       yes         no
        ↓           ↓
     next()     401 response
        ↓
    continue
```

This pattern is common for:

- authentication
- authorization
- validation
- permissions
- account checks

### `next()` vs Response

| Action                      | Meaning                         |
| --------------------------- | ------------------------------- |
| `next()`                    | Continue to the next middleware |
| `res.json()` / `res.send()` | Send a response                 |
| `next(error)`               | Go to error handling            |
| Nothing                     | Request may hang                |

### Always `return` After an Early Response

`res.json()` sends the HTTP response, but it does **not stop JavaScript execution**.

Bad:

```ts
if (!req.user) {
  res.status(401).json({ error: "Unauthorized" });
}

next();
```

The code can still reach `next()` after the response was already sent.

Better:

```ts
if (!req.user) {
  return res.status(401).json({
    error: "Unauthorized",
  });
}

next();
```

Think of it as:

```text
res.json() → finishes the HTTP response
return     → finishes the function
```

### Passing Data Forward

Do not pass normal data through `next()`.

Instead, add it to `req`:

```ts
const authenticate = (req, res, next) => {
  req.user = {
    id: 1,
    name: "Scott",
  };

  next();
};
```

Then another handler can use it:

```ts
app.get("/profile", authenticate, (req, res) => {
  res.json(req.user);
});
```

### `next(error)`

Anything passed to `next(...)` is treated as an error.

```ts
next(error);
```

Flow:

```text
Middleware
   ↓
next(error)
   ↓
skip normal middleware
   ↓
Error Handler
```

So:

```text
next()       → continue normally
next(error)  → error handling
```

> **If the middleware does not finish the request, it must pass control forward.**

## 4.4 - Global Middleware in Express

A **global middleware** is registered directly on the Express `app` and can run for requests across the whole application.

```ts
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  morgan("dev", {
    skip: () => isTest(),
  }),
);
```

These are global because they are not limited to a specific route.

A middleware can also be limited to a path:

```ts
app.use("/api/auth", authMiddleware);
```

In this case, it only runs for requests starting with `/api/auth`.

## 4.5 - Validation Middleware

Validation middleware checks incoming data before the request reaches the route handler.

In this example, Zod is used to validate req.body.

```ts
// middleware/validation.ts
import type { Request, Response, NextFunction } from "express";
import { type ZodType, ZodError } from "zod";

export const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validateData = schema.parse(req.body);
      req.body = validateData;
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: e.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(e);
    }
  };
};
```

The important part is that validateBody() is a function that receives a schema and returns a middleware.

```ts
// routes/habitRoutes.ts

import { Router } from "express";
import { validateBody } from "../middleware/validation.ts";
import { z } from "zod";

const createHabitSchema = z.object({
  name: z.string(),
});

const router = Router();

router.post("/", validateBody(createHabitSchema), (req, res) => {
  res.json({ message: "created habbit" }).status(201);
});
```

Zod does more than just check the body. It returns the validated version of the data.

This is useful because the route can now work with data that has already been checked.

## 4.6 - Parameter & Query Validators

URL parameters and query parameters also need validation.

```ts
export const validateParams = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({
          error: "Invalid params",
          details: e.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(e);
    }
  };
};
```

> Parameters in a URL are always strings, regardless of what data type they represent

```ts
export const validateQuery = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({
          error: "Invalid query params",
          details: e.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }
      next(e);
    }
  };
};
```

Query parameters come after ? in the URL.

`GET /api/habits?completed=true&page=2`

Then validateQuery() does the same thing as validateParams(), but validates schema.parse(req.query).

```ts
const completeParamsSchema = z.object({
  id: z.string().max(3),
});

router.post(
  "/:id/complete",
  validateParams(completeParamsSchema),
  validateBody(createHabitSchema),
  (req, res) => {
    res.json({ message: "completed habbit" }).status;
  },
);
```
