# API Conventions

Claude loads these rules when building or modifying Express routes.

## URL Structure
```
/api/<resource>          GET (list), POST (create)
/api/<resource>/:id      GET (single), PUT (full update), PATCH (partial), DELETE
/api/<resource>/:id/<sub-resource>   nested resources
```

## HTTP Methods
| Method | Use case |
|--------|----------|
| GET    | Read, never mutate state |
| POST   | Create a new resource |
| PUT    | Full replacement of a resource |
| PATCH  | Partial update |
| DELETE | Remove a resource |

## Response Format
All responses use this envelope:
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "Human-readable message", "code": "MACHINE_CODE" }
```

## Status Codes
- `200` OK
- `201` Created (POST success)
- `204` No Content (DELETE success)
- `400` Bad Request (validation failure)
- `401` Unauthorized (not authenticated)
- `403` Forbidden (authenticated but not allowed)
- `404` Not Found
- `409` Conflict (duplicate resource)
- `500` Internal Server Error

## Auth
- Protected routes use `authenticate` middleware (JWT verification)
- Role-based routes use `authorize(role)` middleware after `authenticate`
- Never trust client-supplied user IDs — always derive user identity from the JWT

## Validation
- Use `express-validator` or `zod` for request body validation
- Return `400` with a structured errors array on validation failure:
```json
{ "success": false, "error": "Validation failed", "fields": [{ "field": "email", "message": "Invalid email" }] }
```

## Pagination
- List endpoints accept `?page=1&limit=20`
- Response includes `{ data: [...], pagination: { page, limit, total, totalPages } }`
