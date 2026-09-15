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
