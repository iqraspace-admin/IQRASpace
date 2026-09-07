import type { CapacitorConfig } from "@capacitor/cli";

// Android-only for now (mobile/android branch — see MOBILE.md §0): no
// @capacitor/ios dependency, no ios/ project. iOS is deliberately
// deferred to its own branch once Android is complete and stable — this
// file stays platform-agnostic on purpose so adding iOS later is just
// `npm i @capacitor/ios && npx cap add ios`, not a config rewrite.
//
// Bundle id follows the reverse-domain convention for the already-owned
// iqraspace.org domain (org.iqraspace.<product>) — this value is baked
// into both stores' listings once published, so treat it as effectively
// permanent (see MOBILE.md's "things that can never change" note).
const config: CapacitorConfig = {
  appId: "org.iqraspace.quran",
  appName: "IqraSpace Quran",
  // `npm run build:mobile` (next.config.ts's CAPACITOR_BUILD flag) writes
  // the fully static export here — this is the *only* thing Capacitor
  // bundles into the native shell, so it must be re-run (via `npm run
  // cap:sync`, which does both steps) any time app code changes.
  webDir: "out",
  server: {
    // Real device/emulator testing against localhost's own dev server
    // (`npm run dev`) would need `server.url` pointed at the host
    // machine's LAN IP — deliberately not set here, so a default `npx cap
    // run` always loads the last synced static build, not a dev server
    // that may not be running. See MOBILE.md's "live-reload during
    // development" section for the opt-in override.
    androidScheme: "https",
  },
};

export default config;
