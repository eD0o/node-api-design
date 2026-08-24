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
