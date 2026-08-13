# 2 - Getting Started with Express

## 2.1 - Creating an Express application

First steps to create an Express app:

```ts
import express from "express";

const app = express();

app.get("/health", (req, res) => {
  res.json({ message: "hello" }).status(200);
});

export { app };

export default app;
```

> A /health route is a common convention used to check if a server is still running and operational, typically pinged at intervals to ensure the server's availability and responsiveness

```ts
import { app } from "./server.ts";

app.listen(3000, () => {
  console.log("server running on port: 3000");
});
```

## 2.2 - Testing APIs with Postman
