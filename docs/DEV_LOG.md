# Development Log

This log records the actual development work and verification performed for the CSE 4095 Math Practice Web Application. It is not copied from the instructor's example transcript.

## 2026-10-21 — Phase 1: Project setup

### Prompt received

Build the individual CSE 4095 Math Practice Web Application from `specification.md` and `TODO.md` using React, TypeScript, and Vite; keep it at the repository root; create permanent project instructions; work through phases sequentially; test, lint, build, commit, log actual evidence, and deploy publicly when ready.

### Changes

- Cloned the linked GitHub repository instead of modifying the unrelated parent workspace.
- Added the Vite/React/TypeScript project configuration and initial application entry point.
- Added ESLint, Prettier, Vitest, React Testing Library, and a basic render test.
- Added shared question, session, attempt, mistake, statistics, and settings types.
- Added `AGENTS.md` with permanent project and verification rules.
- Copied the supplied specification and todo list into the repository for traceability.

### Verification

- `npm install react react-dom` and the development-tool dependency install completed with 241 packages audited and 0 vulnerabilities.
- `npm run test`: passed 1 test in 1 test file.
- `npm run lint`: passed with zero warnings (the script uses `--max-warnings 0`).
- `npm run format:check`: passed; all checked files matched Prettier style.
- `npm run build`: passed after the TypeScript configuration fix; Vite 8.3.5 generated the production bundle.
- `npm run dev -- --host 127.0.0.1`: Vite reported ready in 86 ms at `http://127.0.0.1:5173/`.
- `curl -I http://127.0.0.1:5173/`: returned `HTTP/1.1 200 OK`.

### Bugs and fixes

- The initially opened folder was not the linked assignment repository and contained unrelated untracked coursework. The linked repository was cloned into its own folder so unrelated files would not be committed.
- The first production build failed with `TS2882` for the side-effect import of `src/styles/global.css`. Adding `vite/client` to `tsconfig.app.json` supplied Vite's asset declarations; the complete test, lint, format-check, and build sequence then passed.
- The first formatting run changed the copied Markdown source documents. `specification.md` and `TODO.md` were restored from the supplied files and added to `.prettierignore`; only verified TODO checkbox edits are made afterward.
