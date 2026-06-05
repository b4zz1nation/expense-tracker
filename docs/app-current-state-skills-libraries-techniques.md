# Expense Tracker Current State: Skills, Libraries, and Techniques

This document records how the current Expense Tracker app was built and improved so a future bot or developer can quickly understand the project, the libraries in use, and the implementation techniques that produced the current state.

Project path used during development:

```txt
/mnt/c/Users/FYPH/expense-tracker
```

Expo version note from `AGENTS.md`: use the versioned Expo SDK 56 docs before making Expo-specific code changes:

```txt
https://docs.expo.dev/versions/v56.0.0/
```

## Current app state

The app is a local-first Expo React Native expense tracker with:

- Expo Router navigation.
- A 3-tab main app shell:
  - Dashboard / Home
  - Expenses
  - Settings
- Modal routes for adding and editing expenses.
- Local SQLite persistence for expenses and app settings.
- Itemized expense entry by category.
- Monthly totals, recent expenses, and category breakdowns.
- Currency auto-detection and selectable preferred currency.
- System / Light / Dark appearance modes with persisted user preference.
- Compact settings appearance selector.
- Keyboard-safe item editing modal inside the expense form.
- Bottom-sheet detail views and currency picker.
- TypeScript, schema validation, and Jest tests.

## Hermes skills used

These are the main Hermes skills applied while getting the app to its current state.

### `expo-react-native-development`

Used for the core Expo / React Native workflow.

Applied guidance:

- Respect Expo SDK 56 versioned docs.
- Keep Expo Router routing changes small and verifiable.
- Use `app/_layout.tsx` for root providers and stack-level configuration.
- Use route groups for tabs: `app/(tabs)/...`.
- Use modal routes for add/edit flows: `app/expenses/new.tsx` and `app/expenses/[id].tsx`.
- Verify with TypeScript, tests, Expo Doctor/export, Metro status, and Android checks where relevant.
- Stop stale Metro/Expo processes before restarts.
- Account for WSL + Windows filesystem issues.
- Use `CHOKIDAR_USEPOLLING=1` for more reliable Metro refresh on `/mnt/c`.

### `test-driven-development`

Used when changing core data behavior such as itemized expense drafts and schemas.

Applied guidance:

- Add or update tests before trusting logic changes.
- Keep test scope focused on pure utilities and validation where possible.
- Verify itemized expense behavior with Jest tests before relying on UI behavior.

Relevant test areas:

- Currency formatting / lookup.
- Date helpers.
- Expense draft conversion.
- Expense form schema validation.

### `subagent-driven-development`

Used for parallel research and review during larger changes.

Applied guidance:

- Use subagents for isolated research and implementation-plan checks.
- Use reviewers for route integration, Expo Router correctness, and theme/spec compliance.
- Require final verification after reviewer feedback.

Examples of subagent work that shaped the app:

- Mobile navigation research for the bottom tab structure.
- Expo Router route structure review.
- Theme implementation research.
- UI palette/template research.
- Spec compliance review for theme requirements.
- Code quality review of dark-mode contrast and placeholder colors.

### `expo-modal-keyboard-ux`

Used for the compact item editing modal in `ExpenseForm`.

Applied guidance:

- Keep modal content scrollable.
- Avoid letting the keyboard compress the modal card into an unusable state.
- Dismiss the keyboard on the first backdrop tap, then close the modal only after the keyboard is gone.
- Measure keyboard position and modal height instead of relying on hardcoded lifts.
- Keep Android keyboard behavior compatible with Expo managed workflow.

### `writing-plans` / implementation planning pattern

The project includes `docs/plans/expense-tracker-mvp.md`, which describes the MVP architecture and acceptance criteria.

Applied guidance:

- Write the goal, architecture, stack, and acceptance criteria before large implementation work.
- Keep tasks bite-sized.
- Verify after each meaningful slice.

## Primary libraries and why they are used

### App runtime and navigation

- `expo ~56.0.8`
  - Main Expo SDK runtime.
- `react 19.2.3`
  - React runtime.
- `react-native 0.85.3`
  - Native mobile UI runtime.
- `expo-router ~56.2.8`
  - File-based routing for tabs, stacks, and modal routes.
- `expo-linking`
  - Linking support used by Expo Router.
- `expo-status-bar`
  - Status bar styling that follows the active theme.
- `expo-system-ui`
  - System UI integration for light/dark behavior.

### Local persistence and settings

- `expo-sqlite`
  - Local-first database for expenses and settings.
  - Tables:
    - `expenses`
    - `schema_migrations`
    - `app_settings`
- SQLite migrations in `src/db/migrations.ts`
  - Version 1: main expense table and indexes.
  - Version 2: `items_json` column for itemized expenses.
  - Version 3: generic `app_settings` key-value table.

### Forms, validation, and data safety

- `zod`
  - Runtime validation for expense form values.
- `react-hook-form` and `@hookform/resolvers`
  - Installed for form workflows; current form logic is mostly controlled React state, but these remain available for future form abstractions.
- TypeScript
  - Compile-time safety for routes, repositories, schema data, theme tokens, and props.

### Lists and itemized entries

- `@shopify/flash-list`
  - Used in `ExpenseForm` for itemized expense rows.
  - The list is rendered with `scrollEnabled={false}` inside the existing form flow so the parent screen remains responsible for scrolling.

### Bottom sheets and gestures

- `@gorhom/bottom-sheet`
  - Dashboard expense detail sheet.
  - Settings currency picker sheet.
- `react-native-gesture-handler`
  - Required gesture foundation for bottom sheets.
- `react-native-reanimated`
  - Animation/runtime dependency for bottom sheets.
- `react-native-worklets`
  - Required by the current Reanimated/bottom-sheet setup.
- `react-native-safe-area-context`
  - Safe-area layout and bottom inset handling.
- `react-native-screens`
  - Native screens integration used by Expo Router/React Navigation.
- `@react-native-masked-view/masked-view`
  - React Navigation / native UI dependency.

### Icons, charts, and visual UI

- `@expo/vector-icons`
  - MaterialCommunityIcons in Settings and ExpenseForm.
- `react-native-circular-progress`
  - Circular and semi-circular gauge visuals for category breakdowns.
- `react-native-svg`
  - Required by circular progress and related SVG rendering.
- `expo-font`
  - Required native peer for Expo vector icons and font loading.

### Currency and localization

- `expo-localization`
  - Reads device locale and currency hints.
- `country-to-currency`
  - Maps locale region to a default currency when the locale does not directly provide a currency code.
- `currency-codes`
  - Provides ISO currency names and metadata.
- `currency-symbol-map`
  - Provides display symbols for currency codes.

### Dates and utilities

- `date-fns`
  - Installed for date handling; current app also uses simple custom date helpers in `src/lib/dates.ts`.

### Testing

- `jest`
- `jest-expo`
- `@react-native/jest-preset`
- `@testing-library/react-native`
- `@types/jest`

Used to verify utility, schema, and data transformation behavior.

## Key architecture

### File-based routing

Current route shape:

```txt
app/_layout.tsx
app/(tabs)/_layout.tsx
app/(tabs)/index.tsx
app/(tabs)/expenses/index.tsx
app/(tabs)/settings.tsx
app/expenses/new.tsx
app/expenses/[id].tsx
```

Technique:

- Root stack owns app-wide providers and modal routes.
- `(tabs)` route group owns the three main app sections.
- Add and edit screens are stack modal presentations, not tabs.
- This avoids overcrowding the tab bar and keeps Add/Edit as focused workflows.

### Provider hierarchy

`app/_layout.tsx` wraps the app with:

```txt
GestureHandlerRootView
SafeAreaProvider
AppThemeProvider
NavigationThemeProvider
BottomSheetModalProvider
Stack
```

Why this order matters:

- Gesture handler must wrap gesture-driven surfaces.
- Safe area must be available to screens and bottom sheets.
- Theme provider must be available before navigation/options render.
- Bottom sheet provider must wrap screens that present `BottomSheetModal`.

### Data layer

Repository files:

```txt
src/db/database.ts
src/db/migrations.ts
src/db/expensesRepo.ts
src/db/settingsRepo.ts
```

Technique:

- Screens call repository functions instead of executing SQL directly.
- Database setup is lazy-initialized with an `initPromise` guard.
- Expenses use soft delete via `deleted_at` instead of hard delete.
- Money is stored as integer cents, not floating-point values.
- Queries filter out `deleted_at IS NULL` rows.
- Month queries use date-string ranges such as `YYYY-MM-01` to next month start.

### App settings

`app_settings` is a generic key-value table.

Current important keys:

```txt
preferred_currency
theme_mode
```

Technique:

- Currency preference can be unset, in which case the device default is used.
- Theme mode supports `system`, `light`, and `dark`.
- Settings are persisted in SQLite with `updated_at` timestamps.

## Major techniques applied

### 1. Local-first SQLite persistence

The app stores all expenses locally through `expo-sqlite`.

Implementation details:

- `expenses` table stores:
  - `amount_cents`
  - `currency`
  - `category_id`
  - `note`
  - `items_json`
  - `spent_on`
  - timestamps
  - `deleted_at`
- Indexes support month/category/currency queries.
- Soft deletes preserve history for possible future restore or audit features.

Why this matters:

- The app works without backend infrastructure.
- Data remains on the user's device.
- Future bots should preserve repository boundaries instead of scattering SQL into screens.

### 2. Integer-cent money handling

Money is converted to cents before storage.

Technique:

```txt
input string -> parseFloat -> Math.round(amount * 100) -> integer cents
```

Formatting is handled through `formatCents` and currency code awareness.

Why this matters:

- Avoids floating-point display/storage errors.
- Makes totals and category breakdowns deterministic.

### 3. Itemized expense entry

The Add Expense flow changed from a single vague note/amount to category-specific item entries.

Current UX example:

```txt
Category: Food
Group note: team lunch
Food items:
- Burger  8.50
- Fries   3.25
- Coffee  2.00
```

Technique:

- Category controls labels and placeholders through `ITEM_LABELS` in `ExpenseForm`.
- Items are edited through a compact modal.
- `itemizedValuesToExpenseDrafts` converts form values into one or more expense drafts.
- Each saved row stores `items_json` so detail sheets can show line items.
- If a group note exists, the saved expense can represent a group with multiple line items; otherwise items can become individually named expenses.

Why this matters:

- It matches the user's desire to track what was actually bought.
- It keeps dashboard totals/category breakdowns simple because each saved expense still has a total amount and category.

### 4. Schema validation with Zod

Expense inputs are validated before saving.

Technique:

- `src/schemas/expenseSchema.ts` validates category, date, note, and items.
- UI shows the first validation issue as a form error.
- Tests cover schema behavior.

Why this matters:

- Prevents invalid expenses from reaching SQLite.
- Keeps validation rules centralized and testable.

### 5. Bottom tab navigation with modal Add/Edit

Technique:

- Main areas are in bottom tabs.
- Add/Edit flows stay in modal stack screens.
- The dashboard bottom sheet hides the tab bar through `ExpenseSheetContext` while a detail sheet is open.

Why this matters:

- Dashboard, list, and settings are always one tap away.
- Add/Edit gets full-screen focus without polluting top-level navigation.

### 6. Bottom-sheet UX

Bottom sheets are used where the user is inspecting or selecting secondary content:

- Dashboard expense detail sheet.
- Settings currency picker.

Technique:

- `BottomSheetModalProvider` lives at the root.
- Sheet content uses `BottomSheetScrollView`, `BottomSheetFlatList`, and `BottomSheetTextInput` where appropriate.
- Sheet background, handle, backdrop opacity, and text colors are theme-aware.
- Currency picker uses a searchable list with the selected currency sorted to the top.

Why this matters:

- Bottom sheets are more mobile-native than full page transitions for quick inspect/select actions.
- Search and list scrolling stay contained inside the sheet.

### 7. Keyboard-safe compact item modal

The item modal in `ExpenseForm` had several iterations because the Android keyboard could cover or compress it.

Final technique:

- Track `keyboardDidShow` and `keyboardDidHide`.
- Capture `keyboardTop` from `event.endCoordinates.screenY`.
- Measure modal card height with `onLayout`.
- Compute only the overlap between modal bottom and keyboard top.
- Translate the modal upward by the minimum safe lift.
- Keep the card height constrained with `maxHeight`.
- Use a `ScrollView` inside the modal for overflowing content.
- Backdrop press behavior:
  - if keyboard visible: dismiss keyboard only
  - else: close modal

Why this matters:

- Avoids fixed magic-number lifts.
- Avoids shrinking the card until it disappears.
- Preserves a compact modal while still allowing editing near the keyboard.

### 8. System / Light / Dark theme architecture

Theme files:

```txt
src/theme/theme.ts
src/theme/ThemeContext.tsx
```

Technique:

- Semantic tokens instead of raw colors:
  - `background`
  - `surface`
  - `text`
  - `textMuted`
  - `primary`
  - `primarySoft`
  - `border`
  - `overlay`
  - `sheet`
  - `chartTrack`
  - etc.
- Theme mode type:

```ts
type ThemeMode = 'system' | 'light' | 'dark';
type EffectiveTheme = 'light' | 'dark';
```

- `useColorScheme()` reads OS mode.
- `Appearance.setColorScheme(...)` applies explicit overrides.
- `app.json` sets:

```json
"userInterfaceStyle": "automatic"
```

- `expo-system-ui` is included in plugins.
- Theme mode is persisted as `theme_mode` in `app_settings`.
- Navigation theme is derived from Expo Router `DefaultTheme` / `DarkTheme` plus app semantic colors.

Why this matters:

- Future UI changes should use semantic theme tokens, not hardcoded hex colors.
- It keeps dark-mode contrast and surfaces consistent across screens, sheets, modals, inputs, and charts.

### 9. Compact responsive spacing

Technique:

- `ThemeContext` uses `useWindowDimensions()`.
- `isCompact` is true when:

```txt
width < 380 OR height < 700
```

- Compact spacing tokens are used by shared components, screen padding, cards, and tab bar sizing.

Why this matters:

- Small Android devices need tighter spacing without creating a separate layout system.
- Future bots should update spacing tokens instead of sprinkling one-off screen-size checks everywhere.

### 10. Compact Appearance settings control

The Appearance section was intentionally simplified after user feedback.

Final technique:

- Minimal card title: `Appearance`.
- Inline segmented control:

```txt
System | Light | Dark
```

- Small icons for scanability.
- No explanatory subtitles.
- Selected state uses theme tokens:
  - `colors.primarySoft`
  - `colors.primary`
- Inactive state uses:
  - `colors.textMuted`
  - `colors.textSecondary`

Why this matters:

- Theme selection is a simple setting and should not be over-explained.
- This pattern is inspired by Apple segmented controls, Material segmented buttons, React Native Paper segmented buttons, and Android settings preference patterns.

### 11. Currency auto-detection and picker

Technique:

- Try `expo-localization` currency code first.
- If unavailable, derive region from locale and map region to currency through `country-to-currency`.
- Fall back to `USD`.
- Generate picker options from `currency-codes` plus symbols and flags.
- Persist overrides in `preferred_currency`.
- Allow reset to device default by clearing the setting.

Why this matters:

- The app starts with a reasonable local default.
- The user can override without losing the ability to go back to automatic behavior.

### 12. Dashboard category gauges

Technique:

- Category breakdown is computed in SQLite by grouping expenses by `category_id`.
- UI computes percent from `amountCents / monthlyTotal`.
- `react-native-circular-progress` renders:
  - semi-circular cards on the dashboard rail
  - full circular mini gauges in the expanded modal
- Gauge track color uses `colors.chartTrack`.

Why this matters:

- Gives a quick visual summary without making the dashboard too text-heavy.
- Keeps full detail available through an Expand modal.

### 13. Verification-first workflow

Common verification commands used:

```bash
npm run typecheck -- --pretty false
npm test -- --watchAll=false
npx expo-doctor
npx expo export --platform android
```

For WSL/Android/Metro work, also use:

```bash
curl -sS --max-time 3 http://127.0.0.1:8081/status
adb devices -l
adb reverse --list
```

Preferred dev-server command in this WSL setup:

```bash
npx expo start -c
```

or package script:

```bash
npm start -- --clear
```

Important environment note:

- The project lives on `/mnt/c`, so Metro Fast Refresh can miss file changes unless polling is enabled.
- `package.json` sets:

```json
"start": "CHOKIDAR_USEPOLLING=1 expo start"
```

## Important files for future bots

### Navigation and app shell

```txt
app/_layout.tsx
app/(tabs)/_layout.tsx
```

### Main screens

```txt
app/(tabs)/index.tsx
app/(tabs)/expenses/index.tsx
app/(tabs)/settings.tsx
app/expenses/new.tsx
app/expenses/[id].tsx
```

### Shared UI

```txt
src/components/Screen.tsx
src/components/AppButton.tsx
src/components/StatCard.tsx
src/components/EmptyState.tsx
src/components/ExpenseItem.tsx
src/components/ExpenseForm.tsx
```

### Data and validation

```txt
src/db/database.ts
src/db/migrations.ts
src/db/expensesRepo.ts
src/db/settingsRepo.ts
src/schemas/expenseSchema.ts
src/types/expense.ts
```

### Theme

```txt
src/theme/theme.ts
src/theme/ThemeContext.tsx
```

### Utilities

```txt
src/lib/currency.ts
src/lib/currencies.ts
src/lib/dates.ts
src/lib/expenseDrafts.ts
src/lib/ids.ts
src/constants/categories.ts
src/hooks/useExpenses.ts
src/context/ExpenseSheetContext.tsx
```

### Tests

```txt
__tests__/currency.test.ts
__tests__/dates.test.ts
__tests__/expenseDrafts.test.ts
__tests__/expenseSchema.test.ts
```

## Rules for future changes

1. Do not hardcode new colors in active TSX UI files unless there is a strong reason.
   - Prefer `useAppTheme()` and semantic tokens.
2. Preserve the keyboard-safe modal behavior in `ExpenseForm`.
   - Avoid replacing it with fixed keyboard offsets.
3. Preserve integer-cent money storage.
   - Do not store floats in SQLite.
4. Keep SQL inside repository files.
   - Screens should call repository functions.
5. Use the generic `app_settings` table for simple persisted preferences.
6. When adding UI dependencies, verify Expo SDK 56 compatibility.
7. For bottom-sheet work, keep root providers intact:
   - `GestureHandlerRootView`
   - `SafeAreaProvider`
   - `BottomSheetModalProvider`
8. Run at least:

```bash
npm run typecheck -- --pretty false
npm test -- --watchAll=false
```

9. Run `npx expo-doctor` after dependency/config changes.
10. Stop stale Metro/Expo processes before restarting, especially if port 8081 is occupied.

## Known environment conventions

- Project is on Windows filesystem from WSL:

```txt
/mnt/c/Users/FYPH/expense-tracker
```

- Fast Refresh reliability is improved by polling:

```txt
CHOKIDAR_USEPOLLING=1
```

- Preferred clean Expo restart:

```bash
npx expo start -c
```

- If native dependencies changed, do a clean Metro restart and reload Expo Go.

## Summary for the next bot

The current app is not just a basic CRUD expense tracker. Its important design decisions are:

- Local-first SQLite architecture.
- Integer-cent financial storage.
- Itemized category-based expense input.
- Expo Router tabs for main navigation and modals for add/edit.
- Bottom sheets for detail and selection workflows.
- A semantic theme system with persisted System/Light/Dark mode.
- Compact responsive spacing and compact Settings controls.
- Keyboard-safe modal behavior based on measured overlap, not magic offsets.
- Verification through TypeScript, Jest, Expo Doctor/export, and Metro/device checks when needed.

Future work should build on these patterns rather than replacing them with one-off screen logic.
