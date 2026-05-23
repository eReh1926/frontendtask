# Auth Frontend Folder Structure (Next.js + Redux)

This frontend specializes in authentication and session management.

## Directory Overview

- `app/` - Routing and Layouts.
  - `StoreProvider.tsx` - Wraps the app in the Redux Provider. Must be inside `<body>`.
  - `layout.tsx` - Root layout with hydration safety.
- `lib/` - Auth logic and state management.
  - `features/` - Logic for auth slices.
  - `store.ts` - Global store.
- `docs/` - Project documentation.

## Important Things

1. **Hydration**: The `<html>` and `<body>` tags in `layout.tsx` use `suppressHydrationWarning` to prevent errors from browser extensions.
2. **Logo Handling**: The site logo uses the `priority` prop to optimize Largest Contentful Paint.
3. **Responsive Design**: All components should be mobile-first using Tailwind CSS.

this was
already there???

