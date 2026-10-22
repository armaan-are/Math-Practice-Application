# Project Instructions

## Source of truth

- Read `specification.md` and `TODO.md` before planning or implementing work.
- Implement phases in `TODO.md` sequentially. Do not mark a checkbox complete until the work is implemented and verified.
- Keep the React, TypeScript, and Vite application at the repository root.
- Preserve the assignment's self-reported result flow: selecting a multiple-choice answer does not determine the recorded result; the student records it after flipping the card.

## Development workflow

- Make focused, meaningful commits after each verified phase or coherent phase group.
- For every completed phase, run the relevant automated tests, `npm run lint`, `npm run format:check`, and `npm run build`.
- Fix failures before marking tasks complete.
- Record actual prompts, changes, commands, results, and observed bugs in `docs/DEV_LOG.md`. Never fabricate results or copy the instructor's example transcript.
- Keep arithmetic and persistence logic in testable TypeScript services instead of page components.
- Add or update tests with every behavior change, especially arithmetic generation, mistake tracking, persistence, and statistics.

## Product constraints

- The primary audience is children ages 7-12. Use plain, supportive language, large touch targets, and a bright but uncluttered design.
- Support keyboard navigation, screen readers, reduced motion, responsive layouts, and sufficient contrast.
- Store progress only in browser `localStorage`; do not add accounts, analytics, advertisements, or a backend.
- Avoid negative subtraction answers and fractional division answers in the initial release.
- Keep all answer choices unique and include the correct answer exactly once.
- Treat stored browser data as untrusted and recover only the invalid category when possible.

## Definition of done

- A completion claim must distinguish implementation, automated verification, manual browser verification, commit/push state, and deployment state.
- Do not claim browser/device/accessibility behavior that was not actually tested.
- A deployment is complete only after the public URL and client-side routes are verified.
