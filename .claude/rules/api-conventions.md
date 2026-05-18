# API Conventions

Claude loads these rules when building or modifying Express routes.

## URL Structure
```
/api/v1/<resource>              GET (list), POST (create)
/api/v1/<resource>/:id          GET (single), PUT (full update), PATCH (partial), DELETE
/api/v1/<resource>/:id/<sub>    nested resources
```
All routes are versioned under `/api/v1/`. Health check lives at `GET /api/health` (no version prefix).

## HTTP Methods
| Method | Use case |
|--------|----------|
| GET    | Read, never mutate state |
| POST   | Create a new resource |
| PUT    | Full replacement of a resource |
| PATCH  | Partial update |
| DELETE | Remove a resource |

## Response Format
All responses use this envelope (via `ApiResponse` utility):
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "message": "Human-readable error message" }
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
- Use `Joi` for request body validation (already installed — do not introduce express-validator or zod)
- Return `400` with a descriptive message on validation failure:
```json
{ "success": false, "message": "Validation error description" }
```

## Pagination
- List endpoints accept `?page=1&limit=20`
- Response includes `{ data: [...], pagination: { page, limit, total, totalPages } }`
