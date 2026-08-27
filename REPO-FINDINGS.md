# Xaman App — Repository Findings

Working reference for feature development. (2026-08-18; recreated after the file went missing — content preserved from the same day's revision)

## What this is

Xaman (formerly XUMM), the self-custodial XRPL/Xahau mobile client. React Native app with substantial custom native code on both platforms, deliberately conservative dependency policy.

- **App version:** 5.2.5 / build 186 (source of truth: `ios/Xaman.xcodeproj` `MARKETING_VERSION` + `android/app/build.gradle` `canonicalVersionName`; `package.json` still says 4.4.0 — it is *not* the version source)
- **Branch:** `main` (clean at time of survey)

## Tech stack & constraints

| Piece | Version | Notes |
|---|---|---|
| React Native | **0.74.2** (pinned, patched) | Old architecture. Do not upgrade. |
| React | 18.2.0 | |
| TypeScript | 5.4.3 | strict-ish, path aliases (see below) |
| react-native-navigation | 7.40.1 (patched) | Wix native navigation, NOT react-navigation |
| Realm | 12.13.0 | Local storage, schema versioned (currently **v23**) |
| xrpl-accountlib | ^9.2.0 | Signing, definitions |
| xrpl-client | (via accountlib deps) | WS connections in NetworkService |
| Firebase (RN) | 20.4.0 (messaging patched) | analytics/crashlytics/messaging, no ad-tracking subspec |
| tangem-sdk-react-native | 2.3.1 | Card hardware wallets |
| Veriff SDK | 7.1.0 | KYC (xApps) |
| Node | >=18 | |

**patch-package patches** (`patches/`) — these must keep applying; anything touching these deps is high-risk:
- `react-native+0.74.2` — core patch
- `react-native-navigation+7.40.1`
- `react-native-camera+4.2.1` (11 MB patch — effectively a fork)
- `react-native-interactable+2.0.1`
- `@react-native-firebase+messaging+20.4.0`

**Android:** minSdk 26, compileSdk 34, targetSdk 36 (API 36 compliance done recently; legacy back button & portrait kept). Kotlin 1.9.24, AGP 8.5.1, forced kotlinx-coroutines 1.5.2. Google Play Billing 8.0.0. 16KB page-size work deferred (likely gates next release).
**iOS:** platform 13.4, CocoaPods with modular-headers Firebase pods, Catalyst disabled.

## Source layout (`src/`, ~1600 TS/TSX files)

```
src/
  app.tsx                 # Application class: boot, services init, root switching
  common/
    constants/            # AppScreens, NetworkConfig, amendments, endpoints, errors, flags
    helpers/              # navigator (RNN wrapper), device, app, clipboard, interface...
    libs/
      ledger/             # THE core domain lib (see below)
      payload/            # Sign-request payload handling (Xaman platform)
      vault.ts            # JS bridge to native VaultManagerModule (keychain/keystore)
      biometric.ts, crypto.ts, iap.ts, preferences.ts
    utils/                # amount/balance/fee/monetary/codec/string/...
  components/
    General/              # ~45 primitives (Button, AmountText, SwipeButton, ...)
    Modules/              # Feature components (AssetsList, EventsList, FeePicker, ReviewTransaction parts, ...)
  locale/                 # i18n-js, en.json + ~40 translations, TRANSLATION_GUIDELINES.md
  screens/                # RNN screens: Home, Events, Send (step wizard), Settings,
                          #   Modal/* (ReviewTransaction, XAppBrowser, Scan, Submit...),
                          #   Overlay/* (~35 bottom-sheet style overlays), Setup, Onboarding
  services/               # Singletons: Network, Ledger, Backend, Api, Push, Auth,
                          #   Navigation, App, Account, Resolver, Style, Logger, Linking
  store/                  # Realm: models/objects, models/schemas/v1..v23, repositories
  theme/                  # colors, fonts, sizes, styles (StyleService for dark/light)
```

**Path aliases** (tsconfig + babel): `@common`, `@components`, `@locale`, `@screens`, `@services`, `@store`, `@theme`.

## The ledger library — where protocol features live

`src/common/libs/ledger/`:

- `transactions/genuine/<TxType>/` — one dir per transaction type. Covers XRPL + Xahau + pending/amendment types: full AMM set, NFTokens, URITokens (Xahau), Hooks (SetHook, Invoke, Import, ClaimReward, Remit), Checks, Escrows, PayChannels, MPTokens, Vault*, Loan*/LoanBroker* (lending), Credentials, PermissionedDomain, DID, Oracle, Batch, CronSet, DelegateSet, SetRemarks, Clawback, etc.
- `transactions/pseudo/` — SignIn, PaymentChannelAuthorize
- `transactions/fallback/` — renders unknown types generically (app degrades gracefully)
- `objects/` — ledger entry objects (Check, Escrow, Offer, NFTokenOffer, URIToken, MPToken, Vault, Loan, ...) for on-ledger object display
- `parser/fields/` — typed field parsers (AccountID, Amount, Hash256, UInt32, STArray, ...)
- `mixin/` — `Sign.mixin` (signing capability), `Mutations.mixin` (balance-change analysis for Events)
- `factory/` — transaction/object/explainer/validation factories
- `types/enums.ts` — `TransactionTypes` enum

### Pattern: adding/changing a transaction type (e.g. new amendment)

A recent example (`CronSet`) touches exactly these files:

1. `src/common/libs/ledger/types/enums.ts` — add to `TransactionTypes`
2. `src/common/libs/ledger/transactions/genuine/<Type>/`
   - `<Type>.class.ts` — static `Fields` config + `declare` field types
   - `<Type>.info.ts` — Events/label/description generation (explainer)
   - `<Type>.validation.ts` — pre-sign validation
   - `index.ts`
3. `src/common/libs/ledger/transactions/genuine/index.ts` — register
4. `src/common/libs/ledger/transactions/types.ts` — union type
5. `src/screens/Modal/ReviewTransaction/Steps/Review/Templates/genuine/<Type>.tsx` — review UI template
6. `.../Templates/genuine/index.ts` — register template
7. `src/locale/en.json` — strings (only `en.json`; other locales sync via `npm run sync-locals` / translation pipeline)
8. Tests in `transactions/genuine/__tests__/` where applicable

`amendments.ts` in constants maps amendment names → hashes (definitions come from server via NetworkService, so many new tx types work without new binary codec work).

## Services (singletons, init'd in `src/app.tsx`)

- **NetworkService** — WS to XRPL/Xahau nodes (`xrpl-client`), network switching (MAINNET/XAHAU + test/devnets), fees, server definitions, amendments
- **LedgerService** — ledger queries on top of NetworkService
- **BackendService / ApiService** — Xaman platform backend (sign-requests, curated assets, xApps)
- **PushNotificationsService** — FCM, sign request delivery
- **AuthenticationService** — passcode/biometrics chain
- **NavigationService** — RNN root management (onboarding vs session)
- **ResolverService** — account name/avatar resolution
- **StyleService** — dark/light theming

## Security-critical code (extra care, review-heavy zones)

- `src/common/libs/vault.ts` + native `VaultManagerModule`
  - iOS: `ios/Xaman/Libs/Security/` — Vault (Cipher V1 AES-CBC legacy, V2 AES-GCM), Keychain storage, Crypto, Biometric, UniqueIdProvider
  - Android: `android/app/src/main/java/libs/security/` — mirror structure (vault, crypto, authentication, providers)
  - Android last-known device id: plaintext `ANDROID_ID` in `shared_prefs/xaman_device_id.xml` (`last_known_android_id`). Cipher V2 Extra Security uses this when the Keystore unique-id wrap is unreadable. `android:allowBackup="false"` and `data_extraction_rules.xml` exclude sharedpref from backup and device transfer. Residual risk is root or forensic access on the device only.
- `src/common/libs/crypto.ts`, `biometric.ts`
- Signing: `mixin/Sign.mixin.ts` + xrpl-accountlib
- Native also includes: IAP, LocalNotification, custom WebView (forked RNCWebView) for xApps, BlurView, HapticFeedback, QRCode, Toast, SharedPreferences, AppUpdate, DeviceUtils/AppUtils
- **`DeviceUtils.m` `isJailBroken`**: since 2026-08-18 resolves `NO` under `TARGET_IPHONE_SIMULATOR` (sim sees host FS → path checks always false-positived, hanging Release sim builds on splash via the silent `return;` in `app.tsx checkup()`). Real devices unaffected. The silent-hang-on-jailbreak in app.tsx is deliberate — do not "fix" it.

## Storage (Realm)

- `store/models/objects/` — Account, AccountDetails, Core, Profile, Network, Node, TrustLine, Currency, Contact, AmmPair, UserInteraction
- `store/models/schemas/v1..v23` + `latest.ts` — **every model change requires a new schema version dir with migration**; populate.ts seeds defaults
- `store/repositories/` — data access layer (never touch Realm directly from screens)

## UI conventions

- Class components dominate (`Component<Props, State>`); functional components exist in newer modules — match whatever the file/area already uses
- Screens: `ScreenName/ScreenNameView.tsx + styles.tsx + index.ts`, registered in `common/constants/screens.ts` (AppScreens) and navigated via `Navigator` helper (RNN)
- Overlays = RNN overlays styled as bottom sheets (`screens/Overlay/*`)
- Styling via `StyleService.create` referencing `theme/colors` tokens (`$background`, `$textPrimary`, ...) for dark/light support
- i18n: `Localize.t('scope.key')` — keys live in `src/locale/en.json`

## Build / run / test

- `make run-ios` (default sim: iPhone 16 Pro Max), `make run-android`, `make build-ios|build-android`
- `npm start` — Metro; `npm run validate` — eslint + tsc; `npm test` — jest (116 test files + snapshots)
- e2e: Detox + Cucumber (`e2e/*.feature`), see "Detox e2e" below for local runs
- CI: GitHub Actions — validate, unit, ios, android, e2e (but see branch-trigger caveat below)
- `scripts/build-env.sh` generates env files pre-build; `bump-build-number.sh` for releases
- react-cosmos configured (`.cosmos/`) for component fixtures

## Git workflow (mandatory)

- **Never commit directly to `main`/`master`.** Every feature/fix gets its own `feature/...` or `fix/...` branch; merge/rebase to `main` only after confirmation.
- **Always work against the fork:** remote `WietseWind` → `github.com/WietseWind/Xaman-App`. The `XRPL-Labs` remote (public repo) is intentionally behind — never push there.

## Ground rules observed in repo history (keep following)

1. **No dependency updates** unless forced by store compliance (recent examples: targetSdk 36, Billing 8.0.0 — done minimally)
2. Patches over forks/upgrades — patch-package is the escape hatch
3. Small, surgical commits; sparse comments (only where behavior is non-obvious — e.g. the RegularKey badge edge-case note, ticket #107146)
4. Backend-driven behavior toggles where possible (e.g. blocked destination accounts based on backend, devmode gates)
5. New protocol features follow the established per-tx-type file pattern exactly
6. Translations: touch `en.json` only, other locales come from the translation pipeline

## XRPL/Xahau protocol notes (learned during fixes)

- **NetworkID rule:** networks with id ≤ 1024 (XRPL mainnet 0, testnet 1, devnet 2) must NOT carry a `NetworkID` field in transactions; networks with id > 1024 (Xahau 21337, Xahau Testnet 21338) REQUIRE it. `Sign.mixin.ts` auto-populates `NetworkID` at signing time when connected network id > 1024 — so payload JSONs should generally omit it and let signing fill it in. Same rule lives in `common/utils/fee.ts`.
- **Force network mechanism:** `payload.meta.force_network` (network `key`, e.g. `XAHAU`) → `ReviewTransaction` Preflight (`checkForcedNetwork`) blocks with a "Switch network" action if the connected network differs. Switching to non-Main network types is dev-mode gated (`renderSwitchNetworkAction`). Reuse this instead of pre-prompting in scan/linking handlers.
- **Transaction template QRs** (docs "simple-link-qr"): hex-encoded JSON detected by `xumm-string-decode` as `XrplTransactionTemplate`. Handled in TWO near-duplicate places that must stay in sync: `ScanModal.handleTransactionTemplate` (in-app scanner) and `LinkingService.handleTransactionTemplate` (OS deeplinks). Only TrustSet templates are supported.
- Deeplink formats land in `LinkingService.handle`; valid hosts for deeplink parsing are `xumm.app`/`xaman.app` (hardcoded in xumm-string-decode); URL schemes: `xumm`, `xaman`, `xrpl`, `xrp`. Test on sim: `xcrun simctl openurl booted "xumm://xaman.app/detect/<hex>"`.

## Dev workflow notes (iOS simulator)

- Fresh build: `npx react-native run-ios --simulator="iPhone 16 Pro" --mode=Debug --no-packager` (Wietse normally builds from Xcode play button; `make .pre-ios` currently fails on a stale CocoaPods/bundler gem pin — bypass when Pods/Manifest.lock matches Podfile.lock)
- **Metro stale-bundle gotcha:** edits to boot-time singletons (services) do NOT apply via Fast Refresh, and Metro's delta graph can serve a stale bundle even after app relaunch. When in doubt: kill Metro, `npm start -- --reset-cache`, then terminate+relaunch the app, and verify with `curl -s 'http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false' | grep -c "<new code marker>"`.
- App passcode on dev sim: 111111; auto-lock set to 1 week for dev convenience.

## Watch-outs

- `package.json` version is stale by design; don't "fix" it casually
- RN 0.74.2 old-arch: no new-arch-only APIs, no libraries requiring RN ≥0.75
- Realm schema changes ripple: objects + schemas/vNN + migration + repositories
- The custom WebView (xApps) is a security boundary — changes there need scrutiny
- Android 16KB page-size compliance is deferred and likely gates the next release
- `.pre-ios` runs `pod install` via Makefile; `scripts/check-pod-install.sh` guards pod state

## Test suite state (repaired 2026-08-18, branch `fix/jest-suite-stale`, PR #100)

- Jest unit tests run REAL Realm (Node binding) — storage-setup pattern lives in `src/store/__tests__/utils/index.ts`; services-level suites can boot a real store with `new DataStorage(); await storage.initialize()` + `DataStorage.wipe()/close()` in afterAll (see repaired `LinkingService.test.ts`). Native modules (VaultManagerModule etc.) come from `src/__mocks__/react-native.ts`; service mocks live in `src/services/__mocks__/` (activate with `jest.mock('@services/NetworkService')` / `('@services/LedgerService')`).
- `npm test` green as of repair: 114 suites passed, 2 pre-existing `describe.skip` (Button, ledger objects base), 720 tests. Full run ~1 min with coverage.
- A test that throws inside an un-awaited async service handler kills the whole Node runner (unhandled rejection, Node 24) — one bad suite can abort `npm test` mid-run and mask everything after it. Inventory per-suite when that happens.
- Common staleness patterns fixed (recognize these when they reappear): Amount-type getters now emit `mpt_issuance_id: undefined` for non-native amounts (`parser/fields/Amount.ts`) breaking `toStrictEqual`; OfferCreate `OfferSequence` no longer falls back to `Sequence` (commit b86fccc0) so fixtures without a real OfferSequence parse as undefined and lose the "will also cancel" description line; credential tx descriptions are now implemented (note trailing space in `theCredentialTypeIs` locale string); overlay options gained `statusBar`; `ApiError` message is now `API error (non 200) …`; `StyleService.select()` returns an unresolved `$({...})` marker under Jest so snapshot colors can render as `undefined` (test-env artifact, not an app bug).
- ESLint and `tsc --noEmit` both EXCLUDE test files (`**/*.test.ts` in tsconfig exclude, `__tests__` eslint-ignored); ts-jest runs `isolatedModules` (transpile-only) — Jest execution is the only gate on test code.

## Detox e2e (REVIVED locally 2026-08-18, branch `fix/e2e-local-run`, PR #101)

49/49 scenarios, 567 steps green in ~12 min — incl. `07_transaction_template.feature` (PR #106) covering #99 template deeplinks: direct sign (steps through the non-curated `new-trust-line-alert-overlay`), unknown/missing NetworkID rejection, switch-network offer for known other network, non-TrustSet rejection. Detox 20.32.0 + cucumber-js 10.3.1, Release sim build. Note: `theQRIsNotWhatWeExpect` lives under the `scan.` i18n scope (a `global.` reference shows a missing-translation placeholder — fixed in #106).

**Run locally:**
```
DETOX_CONFIGURATION=ios.simulator.local+xaman.ios make test-e2e
DETOX_CONFIGURATION=ios.simulator.local+xaman.ios make retest-e2e   # rerun without rebuild
```
The `Xaman-e2e` simulator is auto-created when missing, and a preflight fails fast with a clear
message when the Xaman backend / xahau-test.net are unreachable (PR #107). The network need itself
is inherent (real device registration + real on-ledger signing); going offline = backend mock +
local ledger node, a separate project.

Key knowledge:
- **Release sim builds hang on splash without the `TARGET_IPHONE_SIMULATOR` exemption in `DeviceUtils.m` `isJailBroken`** — sim sees host FS (`/bin/bash`), path check flags jailbroken, `app.tsx checkup()` silently never resolves. Debug builds skip via NODE_ENV, which is why dev sims never showed this.
- The `ios.simulator.local` detox device targets the dedicated `Xaman-e2e` sim by name so e2e never wipes the dev simulator's app state; CI config (`ios.simulator`) untouched.
- Scenarios use the real Xahau testnet faucet (`xahau-test.net/newcreds`, per-IP rate limited — fixtures retry with backoff) and real backend device registration; the suite needs network. Activation is verified on-ledger before the step passes.
- The cucumber adapter force-stops everything after the first failure — only the FIRST failure in a run log is meaningful.
- App-flow changes absorbed into features: DegenMode (Safe/Degen) step on first account generate; activated accounts show the native XAH row (anchor on `account-native-balance`, spendable balance e.g. `99`) instead of `tokens-list-empty-view`; zero-balance trustline removal goes straight to review (no "Yes, I'm sure" alert — only the dust path prompts).
- Detox URL blacklist must include both `.*xumm.app.*` and `.*xaman.app.*` (backend long-polls stall Detox sync otherwise).
- `.github/workflows/*.yml` (unit AND e2e) still trigger only on `master`/`develop` while the repo branch is `main` — CI test gates never fire (deliberately left alone for now).

## Release-cycle git flow (current: update/5.2.6)

feature/fix branch off main → PR on WietseWind fork targeting `update/5.2.6` → Wietse tests on device + approves → merge PR into update branch. At end of cycle, `update/5.2.6` merges to main as a whole. First merged: PR #99 (fix #96, template QR network detection). Open: PR #100 (jest repair), PR #101 (e2e revival).

`UPDATES.md` (repo root, committed): per-version table of issue → PR → branch → change; update on every PR merged into the update branch.

## CI / release protection (added 2026-08-18)

- `scripts/check-endpoints.sh`: guards production `HOSTNAME`/`ApiUrl` in `src/common/constants/endpoints.ts` (exact active lines, no extra assignments; commented dev lines allowed). Runs in pre-commit AND the `endpoints-guard` workflow (GitHub-hosted ubuntu).
- Branch protection on `main`: required check `check-production-endpoints`, `enforce_admins: true` → direct pushes to main are blocked for everyone; everything lands via PR with the green check. Version bumps go on the update branch.
- The five heavy workflows (validate/unit/ios/android/e2e) need self-hosted macOS ARM64 runners; temp-disabled repo-level (`gh workflow disable`) until runners exist — issue #105 has the re-enable runbook. Do NOT globally disable Actions: it would kill the required guard check and deadlock main merges.
- Locale gotcha: `Localize.t` renders missing keys as broken text — `theQRIsNotWhatWeExpect` lives under `scan.`, not `global.` (fixed in #104). When touching error strings, verify the key path in `src/locale/en.json`.
