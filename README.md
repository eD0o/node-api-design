# 6 - Authentication & Authorization

## 6.1 - Authentication Strategies

Authentication and authorization are related, but they solve different problems.

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

This is especially useful for large products with multiple clients, such as web, mobile, and TV applications.

#### Trade-off

Sessions provide more control, but they also require more infrastructure because the server must store and manage session state.

> In an ideal scenario, sessions can provide excellent control, but they are usually more difficult to manage.

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

JWTs are very common today, especially because of single-page applications, but **not automatically the best option for every system**.

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

## 6.2 - User Registration Workflow

User signup mainly covers **identification** and **authentication**.

At this point, the goal is not to build a full authorization system with roles and permissions. The focus is creating a user securely and preparing them to access the API.

### Registration Flow

```text
Validate input
    ↓
Enforce unique fields
    ↓
Hash password
    ↓
Create user
    ↓
Generate JWT
    ↓
Return token
```

The complete flow is:

1. **Validate input**
2. **Ensure unique fields are not duplicated**
3. **Hash the password**
4. **Create the user in the database**
5. **Generate a JWT**
6. Optionally send something like an email verification later

Generating the token immediately after registration effectively **logs the user in automatically**.

Without it, the user would have to:

```text
Sign up → Go to login → Enter credentials again → Receive token
```

Unnecessary friction when the application can authenticate the user immediately after signup.

### 1. Validate the Input

The database schema already tells us which fields are required.

For example, fields marked as:

```text
NOT NULL + no default
```

must be provided when creating the user.

Validation should happen before attempting to create the database record.

```text
Request data
    ↓
Validate required fields
    ↓
Create user
```

### 2. Let the Database Enforce Uniqueness

Fields such as an email or username usually need to be unique.

This should be enforced by the **database**, using a unique constraint/index.

```ts
email: varchar("email", { length: 255 }).notNull().unique();
```

Avoid relying on a separate query like:

```ts
// Avoid using this as the uniqueness guarantee
const existingUser = await findUserByEmail(email);
```

The database should remain the final authority for uniqueness.

```text
INSERT user
    ↓
Database checks UNIQUE constraint
    ↓
Success or conflict
```

This is both safer and more scalable than treating an application-level lookup as the guarantee.

### 3. Never Store Plain-Text Passwords

A password should **never** be stored directly in the database.

```text
❌ MyPassword123!

✅ $2b$12$N9qo8uL...
```

If the database is compromised, plain-text passwords immediately expose user credentials.

Password hashing reduces this risk because the stored value is the **hash**, not the original password.

```text
Password
   ↓
Hashing algorithm
   ↓
Stored hash
```

The application later verifies a login attempt against that stored hash instead of recovering the original password.

### Bcrypt: The Gold Standard

The strategy used in the course is **bcrypt**, an algorithm designed specifically for password hashing.

At a high level:

```text
Password
   +
Random Salt
   ↓
Bcrypt
   ↓
Repeated computation
   ↓
Password Hash
```

The **salt** adds random data before hashing, helping prevent identical passwords from producing identical stored hashes.

A bcrypt hash also contains information about how it was generated, including the algorithm version, cost factor, salt, and resulting hash.

Example:

```text
$2b$12$N9qo8uLOickgx2ZMRZoMye...
```

Conceptually:

```text
$2b$  → bcrypt version
12    → cost factor
...   → salt + password hash
```

### Cost Factor

Bcrypt intentionally performs repeated computation.

For example, a cost factor of `12` corresponds to roughly:

```text
2^12 = 4,096 iterations
```

The goal is to make password hashing:

- expensive enough to slow brute-force attacks
- fast enough for legitimate signup and login requests

The main point is not to deeply study the cryptography here, but to understand **why bcrypt exists and what role salt + cost play**.

> Note: With bcrypt specifically, a random salt means the same password can produce different stored hashes. Bcrypt can still verify the password later because the salt and cost information are encoded into the stored hash.
