# Crevea Server Agent Rules

These rules apply to every change in this repository and are part of the review contract.

## Before editing

- Read this file, the issue acceptance criteria, and the relevant module boundaries first.
- Inspect the current branch and worktree. Preserve unrelated user changes; never reset, clean, or overwrite them.
- Keep changes focused. Do not add dependencies, services, migrations, or framework changes without documenting the reason and rollout impact.
- Report the commands actually run and their results. Never claim a placeholder command or an unrun check passed.

## TypeScript and API contracts

- Use strict TypeScript. Do not add explicit or implicit `any`, `as any`, double casts, `@ts-ignore`, or blanket lint disables. Use `unknown` for untrusted data and narrow it after validation.
- Every JSON endpoint must define named request DTOs for body, path, and query inputs where applicable, plus named response DTOs. Prefer names such as `UserLoginRequestDto`, `OrderUpdateRequestDto`, `OrderResponseDto`, and `ApiErrorResponseDto`.
- Validate all untrusted input at the HTTP boundary with runtime schemas. Derive types from schemas where practical, then pass parsed DTOs through typed controllers and services.
- Keep request DTOs, domain models, and persistence models separate. Never expose Prisma/database records directly or spread whole records into responses.
- Map responses through explicit allowlisted functions such as `toOrderResponseDto`. Use role-specific DTOs when customer, vendor, and executive views differ.
- Updates must use operation-specific DTOs and authorized service methods. Do not pass `request.body`, `Partial<Entity>`, generic maps, client ORM operations, roles, ownership IDs, totals, audit fields, or payment status directly into persistence.
- Distinguish omitted PATCH fields from explicit `null`; reject empty or unknown updates unless the contract explicitly allows them.
- Declare serialization schemas for success and error statuses and test the actual HTTP output.

## Errors and security

- Use the shared error contract and stable application codes. Expected domain failures must not become generic 500 errors.
- Unknown failures return `500 INTERNAL_ERROR` with a safe message and request ID. Keep stack traces, SQL, Prisma/provider errors, paths, tokens, and payloads in redacted server logs only.
- Clients must branch on error codes/statuses, never message text. Do not disclose account existence or protected resources.
- Enforce authentication, authorization, and resource ownership on the server for every protected operation. UI checks are not authorization.
- Derive prices, totals, discounts, currency, permissions, and ownership from trusted server data. Verify payment signatures and prevent replay/duplicate processing.
- Validate upload size/type/path/ownership and keep private documents private. Do not add permissive CORS, auth bypasses, disabled TLS checks, raw SQL interpolation, or secrets to source/logs.
- Use transactions and database constraints for orders, inventory, coupons, wallets, payouts, and webhook effects. Keep migrations additive and reversible where possible.

## Tests and reliability

- Every feature includes automated tests for its acceptance criteria. Every bug fix includes a regression test whenever practical.
- Cover success, validation, authentication, authorization, boundary, dependency failure, duplicate-request, and concurrency paths where relevant.
- Use isolated databases and deterministic fixtures; never use production credentials or data. Stub external providers in normal CI.
- Test DTO allowlists, protected-field rejection, omitted versus nullable updates, serialized response fields, documented error status/code/message, and safe 500 responses.
- Bound pagination, file sizes, concurrency, retries, and timeouts. Avoid N+1 queries and whole-table list operations; review indexes for new filters.
- Keep request handlers thin and domain logic in services. Keep instances stateless and use durable infrastructure for jobs and coordination.

## Repository commands

- Install with the committed lockfile and Node 20+.
- `npm run build` is the production build.
- `npm run db:generate` regenerates Prisma client code.
- `npm run db:migrate` and `npm run db:deploy` are migration operations; never run destructive production migrations without explicit authorization.
- The current `test` and `lint` scripts are placeholders. Do not treat them as meaningful quality gates; replace them with real checks as part of the quality work.

## Pull requests

- Include the issue, behavior change, DTO/error contract impact, migration/operational impact, security considerations, tests run, and known limitations.
- Coordinate API changes with `crafted-canvas` and `crevea-admin`; update Postman examples and shared contract types.
- Do not weaken checks, delete assertions, skip failing tests, or hide failures with shell fallbacks.
- `main` is protected. A human must review changes and required checks must pass before merge.
- Never run `git push`, force-push, or update a remote branch without explicit user approval.
