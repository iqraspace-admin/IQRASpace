#!/usr/bin/env node
/**
 * Uploads a signed release .aab for org.iqraspace.app to Google Play
 * Console via the Android Publisher API, used by the `iqs-deploy` skill
 * (.claude/skills/iqs-deploy/SKILL.md) as its Deploy step.
 *
 * Hardcoded to the "internal" testing track ONLY — this is deliberate,
 * not configurable via env var. Promoting a build to closed testing or
 * production is a manual, owner-driven Play Console decision (20
 * testers / 14 days closed-testing requirement, pre-launch report
 * review, etc. — see apps/flutter/DEPLOYMENT.md §6), never something an
 * automated skill should do unattended.
 *
 * Requires one-time owner setup (GCP service account + Play Console
 * permission grant) that cannot be done from inside a coding session —
 * see apps/flutter/DEPLOYMENT.md §9.
 *
 * Usage (from apps/flutter/scripts/deploy):
 *   npm install
 *   node --env-file=.env.local upload-to-play.mjs <path-to-app-release.aab>
 */

import { createReadStream, existsSync, statSync } from "node:fs";
import { google } from "googleapis";

const PACKAGE_NAME = "org.iqraspace.app";
const TRACK = "internal";

const keyPath = process.env.PLAY_SERVICE_ACCOUNT_JSON_PATH;
const aabPath = process.argv[2];

if (!aabPath) {
  console.error("Usage: node upload-to-play.mjs <path-to-app-release.aab>");
  process.exit(1);
}
if (!existsSync(aabPath) || !statSync(aabPath).isFile()) {
  console.error(`AAB not found: ${aabPath}`);
  process.exit(1);
}
if (!keyPath) {
  console.error(
    "PLAY_SERVICE_ACCOUNT_JSON_PATH is not set. This is one-time owner-only " +
      "setup (Google Cloud service account + Play Console permission grant) " +
      "— see apps/flutter/DEPLOYMENT.md §9. Not something this script can do " +
      "for itself.",
  );
  process.exit(1);
}
if (!existsSync(keyPath)) {
  console.error(`PLAY_SERVICE_ACCOUNT_JSON_PATH points to a file that doesn't exist: ${keyPath}`);
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  keyFile: keyPath,
  scopes: ["https://www.googleapis.com/auth/androidpublisher"],
});

const androidpublisher = google.androidpublisher({ version: "v3", auth });

const { data: edit } = await androidpublisher.edits.insert({
  packageName: PACKAGE_NAME,
});
const editId = edit.id;

const { data: bundle } = await androidpublisher.edits.bundles.upload({
  packageName: PACKAGE_NAME,
  editId,
  media: {
    mimeType: "application/octet-stream",
    body: createReadStream(aabPath),
  },
});

await androidpublisher.edits.tracks.update({
  packageName: PACKAGE_NAME,
  editId,
  track: TRACK,
  requestBody: {
    releases: [
      {
        versionCodes: [String(bundle.versionCode)],
        status: "completed",
      },
    ],
  },
});

await androidpublisher.edits.commit({
  packageName: PACKAGE_NAME,
  editId,
});

console.log(`Uploaded versionCode ${bundle.versionCode} to Play Console track "${TRACK}" for ${PACKAGE_NAME}.`);
console.log("Verify at: https://play.google.com/console -> IqraSpace -> Testing -> Internal testing");
