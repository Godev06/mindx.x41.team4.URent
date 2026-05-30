# 🚀 URent Client Documentation

> [!NOTE]
> The technical documentation for the URent ecosystem has been centralized at the repository root to ensure structural consistency, unified technical schemas, and maintainability.

Please refer to the following root-level resources:
- **Unified Master Portal**: [Root README](../README.md)
- **30-Minute Developer Onboarding**: [docs/onboarding-development.md](../docs/onboarding-development.md)
- **System Architecture & Design**: [docs/system-architecture.md](../docs/system-architecture.md)
- **API Reference & Websockets**: [docs/api-specification.md](../docs/api-specification.md)
- **Database Schema**: [docs/database-schema.md](../docs/database-schema.md)
- **Deployment & Operations**: [docs/deployment-operation.md](../docs/deployment-operation.md)

---

## Quick Command Reference (Client Workspace)

Run these npm scripts from the **repository root**:
```bash
# 1. Install all monorepo dependencies
npm install

# 2. Boot up client in isolation (dev environment)
npm run dev:client

# 3. Boot up client & server concurrently
npm run dev

# 4. Check TypeScript compilation types
npm run check

# 5. Run ESLint code quality checks
npm run lint --prefix urent-client
```
