# Login API Design — URLShortner

Date: 2026-09-15
Status: Approved
Scope: Login only + minimal wiring (no signup, no URL-module changes)

## 1. Context

- `src/modules/user/user.controller.ts`: stub routes, duplicate `@Post()` on signup+login, empty bodies.
- `src/modules/user/dto/login-user.dto.ts`: field typo `emeil` instead of `email`.
- `src/modules/user/user.service.ts`: empty.
- `src/app.module.ts`: `UserModule` not registered, so `/user` routes are dead. `AuthModule` was removed earlier.
- Prisma `User` model (`email @unique`, `password`) exists; `PrismaService` is `@Global()`.
- Redis available via `REDIS_CLIENT` (`ioredis` instance) in `RedisModule`.
- `@nestjs/jwt` installed; `bcrypt` not installed; no `ValidationPipe`; no JWT env vars.
- Out of scope: signup implementation, `UrlService` missing `PrismaService` injection, `JwtAccessGuard` for URL routes.

## 2. Decisions (user-confirmed)

- Auth: access JWT + refresh tokens (rotation).
- Hashing: `bcrypt`.
- Refresh storage: Redis.
- Scope: login + minimal wiring prerequisites.

## 3. Approach (selected: A)

A — Access JWT (15m) + opaque refresh token in Redis (recommended).
B — Access + JWT refresh in Postgres table (rejected: needs migration + cleanup).
C — Stateless JWT only (rejected: no rotation, weaker sessions).

Why A: uses existing `REDIS_CLIENT`, no DB migration, TTL-based expiry, O(1) revocation via DEL, fits confirmed choices.

## 4. Architecture

- `POST /user/login` → `UserService.login()`:
  1. `PrismaService.user.findUnique({ where: { email } })`.
  2. `bcrypt.compare(password, user.password)` — generic 401 on either miss or mismatch.
  3. Sign access JWT (`sub: user.id, email`) via `JwtService`, 15m expiry.
  4. Generate opaque refresh token (`crypto.randomBytes(48)` hex + `jti`), store `refresh:<userId>:<jti>` → token in Redis with `EX 7d`, return pair.
- `POST /user/refresh` → `{ refreshToken }` → lookup/scan Redis key, verify, delete old, issue new pair (rotation).
- `POST /user/logout` → `{ refreshToken }` → `DEL` key, always 200.
- `UserModule` imports `JwtModule` (access secret/expiry from `ConfigService`) + `RedisModule` (for `REDIS_CLIENT`); registered in `AppModule`.
- `main.ts`: `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))`.

## 5. Components / file changes

1. `src/modules/user/dto/login-user.dto.ts`: rename `emeil` → `email`.
2. `src/modules/user/dto/refresh-token.dto.ts` (new): `{ refreshToken: string }` with validators.
3. `src/modules/user/user.controller.ts`: `@Post('login')`, `@Post('refresh')`, `@Post('logout')`; leave signup/update/get/delete stubs untouched.
4. `src/modules/user/user.service.ts`: inject `PrismaService`, `JwtService`, `@Inject(REDIS_CLIENT) Redis`; implement `login/refresh/logout` + `validateUser`.
5. `src/modules/user/user.module.ts`: import `JwtModule.registerAsync` + `RedisModule`; provide/export `UserService`.
6. `src/app.module.ts`: add `UserModule` to imports.
7. `src/main.ts`: add global `ValidationPipe`.
8. `package.json`: add `bcrypt` + `@types/bcrypt` (install).
9. `.env` / `.env.example`: add `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES=15m`, `JWT_REFRESH_EXPIRES_D=7`.

No changes to: `User` Prisma schema, signup stub, URL module, guards (deferred).

## 6. Data flow / contracts

Request `POST /user/login`:
`{ "email": "a@b.com", "password": "secret123" }`

Success 200:
`{ "accessToken": "<jwt>", "refreshToken": "<opaque>", "expiresIn": 900, "user": { "id": "...", "email": "...", "name": "..." } }`

Errors: 400 validation; 401 `{ message: "Invalid credentials" }` for bad email or password (no enumeration); 500 logged, generic message.

Refresh request: `{ "refreshToken": "..." }` → 200 new pair; 401 on unknown/expired.
Logout request: `{ "refreshToken": "..." }` → 200 always (idempotent).

Redis key: `refresh:<userId>:<jti>`, value = opaque token, TTL = 7d.

## 7. Error handling

- class-validator → 400 via `ValidationPipe`.
- Unknown email and bad password both → 401 generic.
- Unknown/expired refresh → 401.
- Prisma/Redis failures → Nest logger + 500 generic.
- Never return password hash; never log passwords or tokens.

## 8. Testing

- `user.service.spec.ts` with mocked `PrismaService`/`JwtService`/`REDIS_CLIENT`: valid login, unknown email → 401, wrong password → 401, refresh rotation deletes old key, logout DEL idempotent.
- `user.controller.spec.ts`: delegates to service, shape check.
- Manual: `npm run build`, `jest src/modules/user`, curl login → refresh → logout.
- Precondition note: existing rows with plaintext passwords will fail `bcrypt.compare` until signup hashing lands (separate task).

## 9. Self-review

- No TBDs; scope is single-feature (login + minimal wiring).
- Architecture matches components (Redis opaque refresh, no Postgres migration).
- No contradictions; signup explicitly out of scope with documented bcrypt precondition.
- No ambiguous requirements; env names and TTLs fixed.
