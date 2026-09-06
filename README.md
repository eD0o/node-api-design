# 6 - Authentication & Authorization

## 6.1 - Authentication Strategies

Authentication and authorization are related, but they solve different problems.

Scott's main goal in this lesson was to clarify the concepts first, before implementing authentication in code.

### Identification vs Authentication vs Authorization

Think of them as three separate questions:

| Concept            | Question                    | Example                                |
| ------------------ | --------------------------- | -------------------------------------- |
| **Identification** | Who are you?                | Email, username, user ID               |
| **Authentication** | Can you prove it?           | Password, JWT, session, MFA            |
| **Authorization**  | What are you allowed to do? | Admin actions, accessing your own data |

Identification alone is **not secure**. Knowing a user's ID or email does not prove that the request actually came from that user.

A typical flow is:

```text
Identification → Authentication → Authorization
```

For example:

```text
"I am user@example.com"
        ↓
"Here is proof that I am that user"
        ↓
"Am I allowed to delete this resource?"
```

> In this part of the course, the main focus is **identification and authentication**. Authorization is introduced conceptually, but it is not the main implementation focus yet.

### Authorization and RBAC

Once a user is authenticated, the API still needs to decide what that user can do.

Being logged in does **not** automatically mean you can:

- access another user's data
- modify protected resources
- perform admin actions

A common authorization strategy is **RBAC (Role-Based Access Control)**.

```text
user
admin
owner
member
```

Each role receives specific permissions.

```ts
if (req.user.role !== "admin") {
  return res.status(403).json({ error: "Forbidden" });
}
```

Authentication proves that you belong in the system.  
Authorization determines what you are allowed to do inside it.

### Common Authentication Strategies

Scott focused mainly on three approaches:

1. Sessions
2. JWTs
3. API Keys

The important part is not choosing one universally, but choosing the strategy that fits the product.

### 1. Session-Based Authentication

Sessions are the traditional approach for web applications.

The server stores authentication state for each login, commonly in something like **Redis** or a database.

```text
Client
  ↓ sends session cookie
Server
  ↓
Session Store
```

The browser usually stores only a session identifier in a cookie.

```ts
req.session.userId = user.id;
```

On later requests:

```ts
if (!req.session.userId) {
  return res.status(401).json({ error: "Not authenticated" });
}
```

#### Why sessions are useful

Because the server controls the session state, it can:

- track where a user is logged in
- invalidate individual sessions
- log a user out from all devices
- react to suspicious activity

Scott highlighted this as especially useful for large products with multiple clients, such as web, mobile, and TV applications.

#### Trade-off

Sessions provide more control, but they also require more infrastructure because the server must store and manage session state.

> Scott's point: in an ideal scenario, sessions can provide excellent control, but they are usually more difficult to manage.

### 2. JWT Authentication

JWT stands for **JSON Web Token**.

Unlike sessions, JWT authentication is generally **stateless**: the server does not need to store a session for every logged-in user.

After login, the server creates a token containing claims such as the user's ID.

```ts
const token = jwt.sign(
  { id: user.id, email: user.email },
  process.env.JWT_SECRET,
);
```

The client stores the token and sends it with protected requests:

```http
Authorization: Bearer <token>
```

The server verifies it:

```ts
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded;
```

The important idea is that the client must provide proof again on every request.

#### Advantages

- Stateless
- Simple for APIs and SPAs
- No session store required
- Easy to send between clients and APIs

#### Main trade-off

A JWT is harder to revoke immediately because the server normally does not keep a record of every issued token.

If a valid token is leaked, it may remain usable until it expires unless extra revocation infrastructure is added.

Scott considers JWTs very common today, especially because of single-page applications, but **not automatically the best option for every system**.

### 3. API Keys

API keys are commonly used when the **API itself is the product**, especially for third-party integrations.

```http
x-api-key: your-api-key
```

The server can look up the key:

```ts
const key = await db.query.apiKeys.findFirst({
  where: eq(apiKeys.key, apiKey),
});

if (!key) {
  return res.status(401).json({ error: "Invalid API key" });
}
```

Unlike a typical stateless JWT, an API key can have a record stored on the server.

That means it can be:

- identified
- rate-limited
- disabled
- revoked

This makes API keys especially useful for public or third-party APIs.

### Choosing the Strategy

There is no single authentication strategy that is always correct.

| Scenario                                              | Common Choice |
| ----------------------------------------------------- | ------------- |
| Traditional web application                           | **Sessions**  |
| SPA / frontend talking to an API                      | **JWT**       |
| Multiple controlled clients where login state matters | **Sessions**  |
| Third-party / public API                              | **API Key**   |
| Delegated access to another service                   | **OAuth**     |

Scott's main idea was:

> **Choose the authentication strategy based on what the product needs to control.**

For example, a service with web, mobile, and TV clients may benefit from sessions because the server can track and invalidate each login separately.

A developer-facing API, on the other hand, usually benefits more from API keys because they are easy to issue and revoke.

### A Small Security Flow

A protected route often follows this order:

```ts
router.delete("/habits/:id", authenticate, authorize, deleteHabit);
```

Conceptually:

```text
Request
  ↓
Identify user
  ↓
Authenticate user
  ↓
Authorize action
  ↓
Run handler
```

A useful HTTP distinction:

```text
401 → Authentication is missing or invalid
403 → Authentication succeeded, but permission is denied
```

Always authenticate before checking authorization.

> The course documentation contains more complete examples for authentication flows, authorization patterns, middleware, status codes, and security best practices: https://api-design-with-node-v5.super.site/6-authentication-and-authorization
