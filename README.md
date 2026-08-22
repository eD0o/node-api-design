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

const router = Router()

router.get('/', (req, res) => {
  res.json({ message: 'habits' })
})

router.get('/:id', (req, res) => {
  res.json({ message: 'got one habbit' })
})

router.post('/', (req, res) => {
  res.json({ message: 'created habbit' }).status(201)
})

router.delete('/:id', (req, res) => {
  res.json({ message: 'deleted habbit' })
})

router.post('/:id/complete', (req, res) => {''
  res.json({ message: 'completed habbit' }).status
})
```

## 3.4 - use middleware