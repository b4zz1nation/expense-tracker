# Expense Tracker MVP Implementation Plan

> **For Hermes:** Use subagent-driven-development skill for reviews and targeted follow-up tasks.

**Goal:** Build a working local-first Expo React Native expense tracker MVP.

**Architecture:** Expo Router screens call a repository layer backed by `expo-sqlite`. The app stores money as integer cents, uses fixed categories, and keeps UI state simple.

**Tech Stack:** Expo SDK 56, React Native, TypeScript, Expo Router, expo-sqlite, Zod, Jest.

---

## MVP Acceptance Criteria

- Add expense.
- Persist expense locally in SQLite.
- List expenses by month.
- Edit/delete expenses.
- Dashboard monthly total and category breakdown update.
- TypeScript compiles.
- Utility/schema tests pass.

## Implementation Summary

1. Scaffold Expo TypeScript app.
2. Configure Expo Router.
3. Add constants/types/utilities.
4. Add SQLite migration + expense repository.
5. Add reusable form/list/dashboard components.
6. Add dashboard, expense list, add/edit, settings screens.
7. Add logic tests and run verification.
