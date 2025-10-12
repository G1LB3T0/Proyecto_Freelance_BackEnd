# Backend Test Plan for GitHub Actions

## Objectives
- Validate critical authentication and authorization flows before merging to master.
- Guarantee that resource ownership restrictions remain intact across services.
- Ensure API endpoints exposed through Docker containers stay functional under integration tests.

## Test Suites to Implement

### 1. Authentication and Session Management
- `POST /login/login` should reject invalid credentials and return a JWT for valid users.
- `GET /login/verify` should confirm tokens signed with the current secret while rejecting forged tokens.
- `POST /login/refresh` should issue a new token with the same claims as the original session.
- `POST /login/logout` should respond successfully and instruct clients to delete stored tokens.

### 2. Role-Based Access Control
- Middleware should block users missing required `user_type` values.
- Admin tokens should bypass role restrictions in shared routes.
- Ownership helpers must deny access when a user attempts to update or delete someone else's resource.

### 3. CRUD Resources
Focus on representative modules to minimize runtime while covering patterns shared by others.
- Posts: create, list, update, and delete by owner; ensure non-owners receive HTTP 403.
- Projects: validate creation field requirements and status transitions; enforce role and ownership rules.
- Events: ensure only the owner or admin can modify metadata or remove events.

### 4. Negative and Resilience Cases
- Simulate database errors (mocked Prisma calls) and confirm the API returns the expected HTTP 500 envelope.
- Verify that undefined routes return the standardized 404 payload.

## Docker-Based Execution Strategy
- Use the existing `Docker-compose.yml` to provision Postgres and the backend container.
- Run tests using `docker compose run --rm backend npm run test:run`; this will connect to the `db` service and execute Vitest inside the container.
- Seed data via `init.sql` or targeted Prisma setup scripts executed in `beforeAll` hooks.

## GitHub Actions Workflow Outline

### Workflow File
`.github/workflows/ci-tests.yml`

### Trigger
```yaml
on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]
```

### Jobs Overview
- **setup**: Checkout repository, set up Docker Buildx (if required), and cache node modules with `actions/cache`.
- **test**: Build backend image with `docker compose -f Docker-compose.yml build backend` and run the test target using `docker compose -f Docker-compose.yml run --rm backend npm run test:run`.
- **cleanup**: Always run `docker compose -f Docker-compose.yml down -v` to remove containers and volumes between CI runs.

### Environment Variables
Define the following secrets in the repository and inject them in the workflow:
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `DATABASE_URL` (optional if using service discovery inside Docker)

### Sample Job Snippet
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm install
        working-directory: Proyecto_Freelance_BackEnd
      - name: Build services
        run: docker compose -f Docker-compose.yml build
        working-directory: Proyecto_Freelance_BackEnd
      - name: Run integration tests
        env:
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          JWT_EXPIRES_IN: ${{ secrets.JWT_EXPIRES_IN }}
        run: docker compose -f Docker-compose.yml run --rm backend npm run test:run
        working-directory: Proyecto_Freelance_BackEnd
      - name: Clean up
        if: always()
        run: docker compose -f Docker-compose.yml down -v
        working-directory: Proyecto_Freelance_BackEnd
```

## Next Steps
- Implement missing integration suites described above and confirm they pass locally via Docker.
- Create the GitHub Actions workflow file and commit it alongside the new tests.
- Monitor runtime; if execution exceeds time limits, partition the tests by feature or run the longest suites on a separate job.
