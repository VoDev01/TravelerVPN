# TravelerVPN Agent Notes

## Toolchain

- This is an Expo SDK 57 / React Native 0.86 app. Before changing Expo APIs or configuration, read the exact SDK 57 page under https://docs.expo.dev/versions/v57.0.0/; do not rely on latest-version examples.
- Use Yarn Classic (`yarn.lock` v1). Main commands are `yarn start`, `yarn android`, `yarn ios`, `yarn web`, and `yarn lint`.
- Typecheck with `yarn tsc --noEmit`. The current baseline fails in `db/client.ts:20` because the seed rows do not match `serversTable`.
- `yarn lint` currently fails before linting because `eslint` and the flat-config packages imported by `eslint.config.mjs` are not declared dependencies.
- There is no test runner, test script, or CI workflow in this repository.
- Never run `yarn reset-project` during normal work: it moves or recursively deletes `src/` and `scripts/` and replaces the app with a blank template.

## App Wiring

- `expo-router/entry` loads file-based routes from `src/app`; `src/app/_layout.tsx` is the root stack and blocks app rendering while Drizzle migrations run.
- The `(tabs)` layout manually creates a bottom-tab navigator and imports its screens directly. `/servers` returns a `selectedServerId` route parameter that `src/app/(tabs)/index.tsx` uses to initiate the VPN connection.
- TypeScript is strict. `@/*` maps to `src/*`, while `@/assets/*` maps to the root `assets/*` directory.
- React Compiler and typed routes are enabled in `app.json`.

## Native And Data

- `android/` and `ios/` are ignored generated outputs. Make native changes through `app.json` or config plugins, then regenerate with Expo; do not treat generated native edits as source.
- `plugins/withAndroidPlugin.ts` registers the Xray VPN and multiprocess WorkManager components. `plugins/withAndroidAbiFilters.ts` restricts Android builds to `arm64-v8a` and `x86_64`; preserve these constraints when changing native configuration.
- The native VPN boundary is `src/hooks/useLibxray.ts` (`expo-libxray`). Native-device behavior cannot be validated by the web build alone.
- SQLite schema source is `db/schema/`; `drizzle.config.ts` generates SQL and metadata into tracked `drizzle/`. After schema changes run `yarn drizzle-kit generate` and commit the generated SQL, journal, snapshot, and `drizzle/migrations.js` updates together.
- Expo migrations import `.sql` through the Babel inline-import plugin; Metro also has custom handling for SQL, SVG, GLB, and GLTF files. Preserve both configs when changing asset or migration loading.

## Environment And Checkout

- Runtime configuration uses `EXPO_PUBLIC_BACKEND_BASEURL`, `EXPO_PUBLIC_BACKEND_WSURL`, `EXPO_PUBLIC_LOCIZE_PROJECT_ID`, and `EXPO_PUBLIC_LOCIZE_API_KEY`. Do not commit `.env`; Locize uploads missing translations only in development.
- Backend requests in `src/utility/api.ts` use URL-encoded parameters for query strings and non-GET bodies, not JSON.
- Root `assets/` is ignored and currently untracked even though `app.json` and source imports require it. Do not remove local assets, and do not assume a clean clone can build without obtaining them separately.
