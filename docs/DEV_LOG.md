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

## 2026-10-21 — Phase 2: Basic interface

### Prompt carried forward

Continue through the todo phases sequentially, running tests, lint, and a production build before marking verified work complete.

### Changes

- Added the shared header, navigation, page container, and button-link components.
- Added the responsive home page with practice, statistics, and settings actions.
- Added React Router routes for every specified page plus an unknown-route fallback.
- Added focused placeholder content for later-phase pages so every route renders safely.
- Expanded the visual system with large controls, visible focus styles, responsive spacing, and child-friendly presentation.

### Verification

- Installed React Router; the dependency audit reported 0 vulnerabilities.
- `npm run test`: passed 1 test in 1 test file.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed.
- `npm run build`: passed; Vite generated the production bundle from 36 transformed modules.

### Bugs and fixes

- The updated home-page test first failed because both the header and hero intentionally contain a link named `Settings`. The assertion was changed to verify all matching links target `/settings`.
- The build then caught an unsupported `exact` property in the Testing Library role-query type. Removing that property preserved the exact accessible-name query and allowed both tests and TypeScript compilation to pass.

## 2026-10-21 — Phase 3: Practice configuration

### Prompt received

Implement Phase 3 only: operation, difficulty, and session-length selectors with correct defaults, validation, navigation, tests, todo updates, logging, commit, and push.

### Changes

- Added multi-select operation controls for addition, subtraction, multiplication, and division, including select-all and clear-all actions.
- Added four single-select difficulty cards with level descriptions.
- Added 5, 10, 20, and continuous session-length choices with a 10-question default.
- Added validation and a disabled start action when no operation is selected.
- Passed the complete setup configuration through React Router navigation state.
- Added responsive styles and explicit pressed-state accessibility labels.

### Verification

- `npm run test`: passed 3 tests in 2 test files.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed after formatting the new test.
- `npm run build`: passed; Vite generated the production bundle from 40 transformed modules.

### Bugs and fixes

- Initial selector tests could not query the operation buttons because adjacent visible label/status text produced names such as `AdditionSelected`. Added explicit names such as `Addition selected` and `Subtraction not selected`, improving both testability and screen-reader output.
- The first successful test rerun still failed the formatting gate for the edited test file. Running the configured formatter and then the entire check suite resolved it.

## 2026-10-21 — Phase 4: Arithmetic question generation

### Prompt received

Implement Phase 4 only: accurate question generation for all four operations and every specified difficulty, especially whole-number division and boundary cases; test, verify, update, log, commit, and push.

### Changes

- Added tested random-integer, immutable shuffle, and unique-ID utilities.
- Added operation-specific generators for all four arithmetic operations and all four difficulty levels.
- Ensured subtraction remains nonnegative and division is built from a nonzero divisor and whole-number quotient.
- Added arithmetic validation, a bounded generation retry loop, mixed-operation selection, and explicit empty-operation failure handling.
- Added repeated boundary tests covering thousands of generated questions.

### Verification

- `npm run test`: passed 24 tests in 4 test files.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed.
- `npm run build`: passed; Vite generated the production bundle from 40 transformed modules.

### Bugs and fixes

- Runtime tests passed on the first generator implementation, but the TypeScript production build found that `Array.isArray` did not safely narrow the `MathOperation | readonly MathOperation[]` union for record indexing. Replaced it with an explicit string check and typed readonly operation list; the full suite then passed.

## 2026-10-21 — Phase 5: Multiple-choice answers

### Prompt received

Implement Phase 5 only: exactly four unique shuffled answer choices per question, with one correct answer and three believable distractors; stress-test, update, log, commit, and push.

### Changes

- Added operation-specific distractors based on nearby sums, differences, multiplication facts, and division quotients/fact families.
- Added a bounded random retry loop and deterministic nearby-number fallback so generation cannot loop forever.
- Restricted choices to unique, nonnegative whole numbers and validated that the correct answer appears exactly once.
- Integrated shuffled answer choices into the main question generator.
- Added randomized stress tests across every operation and difficulty, including answers near zero and correct-answer position distribution.

### Verification

- `npm run test`: passed 30 tests in 5 test files. The choice suite exercised more than 5,000 generated questions.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed.
- `npm run build`: passed; Vite generated the production bundle from 40 transformed modules.

### Bugs and fixes

- No behavior defect appeared during this phase. Prettier adjusted the new service formatting before the verified run.

## 2026-10-21 — Phase 6: Question card interaction

### Prompt received

Implement Phase 6 only: choose an answer, flip the card, reveal the correct answer, self-report right or wrong, prevent double submissions, test, update, log, commit, and push.

### Changes

- Added accessible answer-choice buttons with selected and unselected states.
- Added a question card front, disabled-until-ready flip action, animated answer reveal, correct/selected answer recap, and operation-specific explanation.
- Added self-report buttons and a synchronous duplicate-submission guard.
- Made animation and explanations independently disableable and respected reduced-motion preferences.
- Used the question ID as a keyed state boundary so answer and flip state reset for each new question.

### Verification

- `npm run test`: passed 33 tests in 6 test files, including selection changes, reveal, reset, and double-click submission tests.
- `npm run lint`: passed with zero warnings after the submitted-state fix.
- `npm run format:check`: passed.
- `npm run build`: passed; Vite generated the production bundle from 40 transformed modules.

### Bugs and fixes

- The initial component tests exposed leaked DOM between tests because Vitest globals were disabled and React Testing Library's implicit cleanup did not register. Added explicit `afterEach(cleanup)` in the shared test setup; all component tests then ran in isolation.
- ESLint rejected reading a ref during render for disabled-button state. Kept the ref only as the synchronous double-submit guard and added React state for rendering the disabled state. The complete suite then passed.
