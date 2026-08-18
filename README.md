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
