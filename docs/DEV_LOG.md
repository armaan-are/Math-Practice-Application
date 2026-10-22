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

## 2026-10-21 — Phase 7: Practice sessions

### Prompt received

Implement Phase 7 only: complete session state, progress, transitions, continuous mode, correct and incorrect counts, accurate end behavior, tests, todo updates, logging, commit, and push.

### Changes

- Added validated setup-state loading and safe redirection for missing or invalid session configuration.
- Added complete in-memory session and attempt records with IDs, timestamps, configuration, totals, and active state.
- Added progress and score displays, automatic next-question generation, immediate-repeat avoidance, and keyed card reset.
- Added fixed-length completion and confirmed continuous-session ending, both carrying an exact session snapshot and attempt list to the summary route.
- Added session-page tests for invalid setup, result/progress updates, question advancement, and continuous ending.

### Verification

- `npm run test`: passed 36 tests in 7 test files.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed.
- `npm run build`: passed; Vite generated the production bundle from 47 transformed modules.

### Bugs and fixes

- No defect appeared in the verified Phase 7 run. The formatter normalized the new page and test before checks.

## 2026-10-21 — Phase 8: Session summary

### Prompt received

Implement Phase 8 only: accurate completion and summary totals, correct, incorrect, accuracy, all navigation actions, tests, todo updates, logging, commit, and push.

### Changes

- Added a validated session-summary route that redirects safely when completion data is missing.
- Added attempted, correct, incorrect, mistake-review, accuracy, operation, and difficulty results.
- Added practice-again, practice-mistakes, settings, statistics, and home actions.
- Added a zero-attempt accuracy guard for continuous sessions ended before answering.
- Added responsive summary presentation and component tests for populated, empty, and missing states.

### Verification

- `npm run test`: passed 39 tests in 8 test files.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed.
- `npm run build`: passed; Vite generated the production bundle from 47 transformed modules.

### Bugs and fixes

- No functional defect occurred in the verified Phase 8 run. The formatter normalized the new summary component before checks.

## 2026-10-21 — Phase 9: Local data storage

### Prompt received

Implement Phase 9 only: robust browser localStorage for settings, attempts, and sessions, with validation and corrupt/unavailable-data handling; test refresh behavior, update, log, commit, and push.

### Changes

- Added a namespaced localStorage service with schema version 1 and a migration entry point.
- Added validated read/write functions for settings, completed attempts, and session history.
- Added category-specific corrupt-data recovery without clearing unrelated browser keys.
- Added unavailable-storage and quota-capacity result handling, history de-duplication, and a 100-session detail limit.
- Connected setup defaults, attempt recording, and completed-session persistence to the service.
- Added persistence tests that write data and reload it through fresh service reads, matching refresh/restart storage behavior.

### Verification

- `npm run test`: passed 43 tests in 9 test files.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed after formatting the repaired service.
- `npm run build`: passed; Vite generated the production bundle from 49 transformed modules.

### Bugs and fixes

- The first quota test revealed that the schema-version write in storage initialization could throw before the guarded data write. Wrapped initialization and propagated its typed failure result from settings saves; the real capacity path now returns `{ ok: false, error: 'capacity' }` without crashing.

## 2026-10-21 — Phase 10: Statistics

### Prompt received

Implement Phase 10 only: totals, accuracy, operation and difficulty breakdowns, recent stored history, zero-attempt handling, tests, todo updates, logging, commit, and push.

### Changes

- Added pure statistics and accuracy calculations derived from stored attempts.
- Added overall totals, all operation and difficulty cards, empty states, and newest-first recent sessions.
- Added a confirmed reset that clears practice attempts, sessions, and aggregate statistics while preserving settings.
- Added unit and component coverage for populated, empty, and reset states.

### Verification

- `npm run test`: passed 47 tests in 11 test files.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed.
- `npm run build`: passed; Vite generated the production bundle from 50 transformed modules.

### Bugs and fixes

- The first component assertion expected one `100%` label, but the correct UI shows it in overall, operation, and difficulty cards. Updated the test to require at least one match without rejecting valid breakdowns.
- The strict lint gate flagged the revision-only memo dependency. Referencing the revision inside the memo makes the deliberate refresh trigger explicit; lint and build then passed.

## 2026-10-21 — Phase 11: Settings

### Prompt received

Implement Phase 11 only: working settings, practice defaults, mastery threshold, sound/animation/explanation controls, confirmed clear-data action, persistence tests, logging, commit, and push.

### Changes

- Added persisted controls for sound, animation, explanations, positive feedback, mastery threshold, operations, difficulty, and session length.
- Applied saved defaults on practice setup and animation/explanation preferences during sessions.
- Added explicit save status and strongly confirmed clear-all behavior that restores defaults and returns home.
- Added settings persistence and clear-all component tests.

### Verification

- `npm run test`: passed 49 tests in 12 test files.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed.
- `npm run build`: passed; Vite generated the production bundle from 50 transformed modules.

### Bugs and fixes

- The persistence test found that clearing the controlled mastery input immediately inserted 1, causing a typed 4 to become 14 and clamp to 10. Allowed a temporary blank editing state and committed only nonblank values; the setting now saves 4 correctly.

## 2026-10-21 — Phase 12: Mistake tracking

### Prompt received

Implement Phase 12 only: record and update mistake patterns whenever a student self-reports wrong, persist them, preserve meaningful subtraction and division operand order, test, update the todo, log, commit, and push.

### Changes

- Added mistake-pattern creation when a completed attempt is self-reported wrong, including the operation, ordered operands, correct answer, difficulty, timestamp, and initialized progress counts.
- Added stable pattern matching that treats addition and multiplication as commutative while keeping subtraction and division operand order distinct.
- Added repeat-mistake updates that increment the incorrect count, refresh the timestamp, reset mastery progress, and avoid duplicate records.
- Added validated localStorage loading and saving for mistake patterns, including arithmetic consistency checks and category-specific recovery from corrupt records.
- Added application-startup loading so invalid stored mistake-pattern data is repaired before the interface renders.
- Added unit, storage, and practice-page integration tests covering wrong self-reports, repeat mistakes, correct-answer no-ops, persistence, corrupt data, and operand-order behavior.

### Verification

- `npm run test`: passed 55 tests in 13 test files.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed.
- `npm run build`: passed; Vite generated the production bundle from 51 transformed modules.
- `git diff --check`: passed with no whitespace errors.

### Bugs and fixes

- No test failure occurred during this phase. A final requirement review found that startup loading should be literal rather than deferred until the review feature; added startup validation and strengthened stored-pattern validation before the final verification run.

## 2026-10-21 — Phase 13: Similar question generation

### Prompt received

Implement Phase 13 only: generate valid similar practice questions using nearby operands, appropriate reversed operands, and fact families; never reverse subtraction or division as equivalent; test, update the todo, log, and commit.

### Changes

- Added a similar-question generator that accepts a mistake pattern, chooses among valid nearby, reversed-operand, and fact-family strategies, and returns a complete multiple-choice question.
- Added operation- and level-specific validation so every related question remains inside the original difficulty range.
- Generated nearby division questions by changing a divisor or quotient and recalculating the dividend, guaranteeing a nonzero divisor and whole-number answer.
- Limited operand reversal to addition and multiplication; subtraction and division retain their original operand meaning.
- Added inverse addition/subtraction and multiplication/division fact families, omitting an inverse candidate when it would fall outside the selected difficulty.
- Labeled generated questions as `mistake-review`, attached the originating mistake-pattern ID, excluded the exact original question, and supported excluding recently used question keys when alternatives exist.
- Added unit and stress coverage for all operations, difficulty boundaries, strategy selection, valid answer choices, fact families, recent-question avoidance, and ordered noncommutative operations.

### Verification

- `npm run test`: passed 70 tests in 14 test files.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed.
- `npm run build`: passed; Vite generated the production bundle from 51 transformed modules.
- `git diff --check`: passed with no whitespace errors.

### Bugs and fixes

- No functional failure occurred during this phase. A final coverage review added deterministic assertions that the main service selects reversal and fact-family strategies, rather than testing only the candidate helpers.

## 2026-10-21 — Phase 14: Mistake review mode

### Prompt received

Implement Phase 14 only: usable mistake-review sessions, pattern prioritization, similar-question practice and mastery progression; confirm a wrong self-reported answer activates review; test, update the todo, log, and commit.

### Changes

- Added regular-practice and mistake-review choices to setup, with matching active-pattern counts, a clear unavailable explanation, and automatic selection from the summary's Practice Mistakes link.
- Added filtering for active, unmastered patterns matching the chosen operations and difficulty.
- Added priority scoring for incorrect frequency, recency, and remaining mastery progress, with randomized tie-breaking and immediate-repeat avoidance when multiple patterns are available.
- Connected mistake-review sessions to the similar-question generator and rotated among eligible patterns.
- Persisted the originating mistake-pattern ID on each review attempt and counted review questions in completed sessions.
- Updated the original pattern after every review answer, counted review attempts and correct answers, handled wrong related answers, and persisted all pattern changes.
- Applied the saved mastery threshold, excluded mastered patterns, ended review sessions when all eligible patterns were mastered, and retained reactivation after a future wrong answer.
- Added service, setup, integration, persistence-linkage, session-count, prioritization, and mastery-transition tests, including the wrong-answer-to-enabled-review flow.

### Verification

- `npm run test`: passed 79 tests in 15 test files.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed.
- `npm run build`: passed; Vite generated the production bundle from 53 transformed modules.
- `git diff --check`: passed with no whitespace errors.

### Bugs and fixes

- During incremental editing, inspection found a duplicate `state` property in the setup navigation call before tests were run. Removed the obsolete property so the complete review configuration is passed through one route-state object.
- No automated test failed in the final Phase 14 verification runs.

## 2026-10-21 — Phase 15: Advanced mistake statistics

### Prompt received

Implement Phase 15 only: mistake-review statistics, frequently missed facts, active versus mastered patterns, and related history; test empty and populated states, update the todo, log, and commit.

### Changes

- Added mistake-review calculations for active and mastered pattern counts, similar questions practiced, and correct review answers.
- Added most-missed-operation detection with support for ties and deterministic fact sorting by incorrect count, recent miss, and stable ID.
- Added a child-friendly statistics section with summary cards, most-missed operations, and a ranked list of frequently missed facts.
- Added separate active and mastered pattern lists showing miss counts, configurable mastery progress, and the latest missed date.
- Added newest-first related review history with the generated fact, date, level, and self-reported result.
- Added clear empty states for users with no mistake patterns or similar-question history.
- Updated the confirmed statistics reset to remove mistake patterns along with attempts, sessions, and aggregate statistics while continuing to preserve settings.
- Added calculation and component coverage for empty data, populated data, ties, ordering, active/mastered separation, review history, and reset behavior.

### Verification

- `npm run test`: passed 82 tests in 15 test files.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed.
- `npm run build`: passed; Vite generated the production bundle from 53 transformed modules.
- `git diff --check`: passed with no whitespace errors.

### Bugs and fixes

- Review of the existing reset behavior found that it cleared attempts and sessions but would leave the newly displayed mistake patterns behind. Included mistake patterns in the same confirmed practice-history reset and added an assertion that they are removed.
- No automated test failed in the final Phase 15 verification runs.
## 2026-10-22 — Phase 16: Accessibility foundations

### Prompt received

Implement Phase 16 only: full keyboard operation, keys 1–4 for answers, accessible labels, announcements, focus management, reduced-motion support, tests, todo updates, logging, commit, and push.

### Changes

- Added number-key shortcuts for answer choices, native keyboard-operable buttons, visible focus styling, and a guard that leaves form typing alone.
- Added spoken math labels, question/answer/session live regions, and focus movement to each new question and revealed answer.
- Added live `prefers-reduced-motion` detection and combined it with the application's animation preference.
- Added component tests for shortcuts, form-input isolation, announcements, focus, progress, native controls, and reduced motion.

### Verification

- Targeted accessibility tests: passed 12 tests in 2 files.
- Full `npm test -- --run`: passed 86 tests in 15 files.
- `npm run lint`: passed with zero warnings after the reduced-motion subscription fix.
- `npm run format:check`: passed.
- `npm run build`: passed; Vite generated the production bundle from 54 transformed modules.
- Browser check: number key 3 selected answer 3, the selected state included visible “Selected” text, Space activated the native Flip card button, focus moved to the revealed answer, and no horizontal overflow appeared in the checked view.
- Contrast calculation: primary tested text/background pairs ranged from 5.60:1 to 15.81:1, above WCAG AA normal-text contrast.
- The 200% zoom and larger-system-font TODO items remain unchecked because this run did not establish those exact environment settings.

### Bugs and fixes

- The first accessibility test run found three test defects: a rerender fixture changed display text without changing operands, a jsdom Tab simulation could not leave a programmatically focused `tabIndex=-1` heading, and a text query became ambiguous after live regions were added. Corrected the fixture and tested native tabbability/semantics without relying on jsdom's incomplete focus traversal.
- The full check then found React's lint rule rejecting a synchronous state update inside the reduced-motion effect. Replaced the effect-managed state with `useSyncExternalStore`, preserving live media-query updates without a cascading render.
