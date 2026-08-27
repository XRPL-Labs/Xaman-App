# Updates

Per-version log of what landed in each update cycle: issue → PR → branch, newest version first.
Maintained as changes are merged into the `update/x.y.z` branch; the update branch merges to `main` at the end of the cycle.

## 5.2.6 — `update/5.2.6` (in progress)

| Issue | PR | Branch | Change |
|---|---|---|---|
| [#96](https://github.com/WietseWind/Xaman-App/issues/96) | [#99](https://github.com/WietseWind/Xaman-App/pull/99) | `fix/tx-template-qr-network` | Transaction template QR/deeplink no longer errors "not on this network" on XRPL networks; explicit Xahau `NetworkID` (21337/21338) now offers network switch via review flow |
| — | [#104](https://github.com/WietseWind/Xaman-App/pull/104) | `fix/scan-error-locale-key` | Fix wrong locale key (`global.` → `scan.theQRIsNotWhatWeExpect`) breaking the QR-unexpected error message |
| — | [#102](https://github.com/WietseWind/Xaman-App/pull/102) | `feature/endpoints-guard` | Guard production `HOSTNAME`/`ApiUrl` values: check script + pre-commit + required CI check on `main` (branch protection, admins included) |
| — | [#103](https://github.com/WietseWind/Xaman-App/pull/103) | `fix/ci-branch-triggers` | CI workflows trigger on `main`/`update/**` instead of stale `master`/`develop` (note: five self-hosted workflows temp-disabled repo-level until runners exist, see [#105](https://github.com/WietseWind/Xaman-App/issues/105)) |
