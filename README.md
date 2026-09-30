# TravelerVPN (client app)

Cross-platform VPN client built with Expo / React Native. It connects through the
Xray core, lets users pick premium servers (subscription) or import their own VLESS
servers, and handles subscription purchase (web + crypto) and renewal reminders.

## Stack

- **Expo SDK 57 / React Native 0.86**, `expo-router` (file-based routes), React Compiler,
  typed routes, strict TypeScript.
- **Xray core** via [`expo-libxray`](https://github.com/VoDev01/expo-libxray) — see the
  library README for the native details.
- **Drizzle ORM + `expo-sqlite`** for the local server cache.
- **i18next + Locize** for translations (English, Russian).
- `expo-notifications` (expiry reminders), `expo-clipboard`, `expo-secure-store`,
  `expo-localization`, `@react-three/fiber` (3D server map).

## Repository layout

```
src/app/            expo-router routes
  _layout.tsx       root stack (waits for DB migrations)
  (tabs)/           index (map/connect), addServers, subscription, settings
  servers.tsx, server-edit.tsx, split-tunneling.tsx
src/hooks/          useBackendClient, useServers, useLibxray, useSettings,
                    useSubscriptionExpiryReminder, ...
src/components/     UI (map, loaders, ...)
src/context/        Theme, Model, ServerMap contexts
src/utility/        api.ts (HTTP client), userId.ts, telegramId.ts
src/types/          shared types (VpnUser, ...)
db/                 Drizzle client, schema, DAO/repository
drizzle/            generated SQL migrations + metadata
plugins/            Expo config plugins (withPlugin, ABI filters)
assets/             fonts, images, models
i18n.ts             i18next + Locize setup
app.config.ts       Expo config
```

## Requirements

- Node.js and **Yarn Classic** (this repo uses `yarn.lock` v1).
- Android Studio / Xcode for native builds.
- A **development build** is required: `expo-libxray` (VPN) and notifications do not
  work in Expo Go.

## Configuration

`app.config.ts`:

- `extra.backendBaseUrl` / `extra.backendWsUrl` — backend origin (default
  `http://traveler-vpn.com`).
- `extra.subscriptionExpiryReminderDays` — days before expiry to fire the local
  reminder notification.
- `scheme: "travelervpn"` — deep-link scheme.

Environment (`.env`, not committed):

- `EXPO_PUBLIC_LOCIZE_PROJECT_ID`, `EXPO_PUBLIC_LOCIZE_API_KEY` — Locize translations.

## Getting started

```bash
yarn install
yarn start        # dev server (then press a / i / w)
yarn android      # expo run:android
yarn ios          # expo run:ios
yarn web
```

Do **not** run `yarn reset-project` during normal work — it moves/deletes `src/` and
`scripts/` and replaces the app with a blank template.

## Features

- Connect/disconnect through the Xray tunnel; interactive 3D server map with latency.
- Premium servers from the subscription; bring-your-own VLESS/VMESS servers.
- Subscription purchase and renewal (see below).
- Restore a subscription on a new device using the linked Telegram account.
- Settings: theme, language, and the account (UUID, Telegram id, subscription).
- Local subscription-expiry reminder notification.

## Backend integration

`src/utility/api.ts` is the HTTP client. Requests are form-encoded
(`URLSearchParams`) with JSON responses; `PUT /api/user/update` sends a JSON body.
Key endpoints:

- `POST /api/user/subscription`, `GET /api/user`, `POST /api/user/telegram`,
  `GET /api/user/traffic`, `POST /api/ip/geo`.
- `POST /api/billing/code`, `GET /api/billing/status`, `POST /api/billing/renewal`.
- `POST /api/user/recover/start`, `GET /api/user/recover/verify`.

The device is identified by a locally generated UUID (`src/utility/userId.ts`, stored
in SecureStore + AsyncStorage) and sent as `userId`.

## Subscriptions & payments

1. On the **Subscription** tab the app requests a single-use activation code.
2. The user opens the website (`https://traveler-vpn.com/pay?code=…`) and pays with
   crypto (Trybit). The app never links to a store page — plans are chosen on the web.
3. The app polls `/api/billing/status` until the code is applied, then refreshes the
   user. Near expiry it can request an on-demand renewal invoice
   (`/api/billing/renewal`).
4. If the device is lost, the user restores access in Settings → *Restore subscription*
   by confirming through the Telegram bot linked to their account.

A local notification (`subscriptionExpiryReminderDays` before `expiryAt`) reminds the
user to renew.

## Native, database, i18n

- VPN boundary: `src/hooks/useLibxray.ts` wraps `expo-libxray`. Android native
  components are registered via `plugins/withPlugin.ts`; `plugins/withAndroidAbiFilters.ts`
  restricts builds to `arm64-v8a` + `x86_64`.
- `android/` and `ios/` are generated outputs; change native config through
  `app.config.ts`/plugins and regenerate with Expo.
- SQLite schema lives in `db/schema/`; after changes run `yarn drizzle-kit generate`
  and commit the generated SQL, journal, snapshot and `drizzle/migrations.js` together.
- Translations use Locize; add keys to the inline fallback in `i18n.ts` (en/ru).

## Typecheck / lint

```bash
yarn tsc --noEmit   # typecheck
yarn lint           # eslint (currently fails: eslint deps are not declared)
```

There is no test runner or CI in this repository.

## License

MIT © VoDev01. See [`LICENSE`](LICENSE).
