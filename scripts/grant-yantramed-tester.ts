/**
 * Grant complimentary (tester) YantraMed access — no Paddle payment.
 *
 * Usage:
 *   npx tsx scripts/grant-yantramed-tester.ts tester@gmail.com
 *   npx tsx scripts/grant-yantramed-tester.ts tester@gmail.com --revoke
 *
 * Requires YantraMed Firebase Admin credentials in .env
 */
import "dotenv/config";
import { yantramedCompAccessService } from "../src/services/YantramedCompAccessService";

async function main() {
  const email = process.argv[2]?.trim();
  const revoke = process.argv.includes("--revoke");

  if (!email) {
    console.error(
      "Usage: npx tsx scripts/grant-yantramed-tester.ts <gmail> [--revoke]",
    );
    process.exit(1);
  }

  if (revoke) {
    await yantramedCompAccessService.revoke(email);
    console.log(`✓ Revoked complimentary access for ${email.toLowerCase()}`);
    return;
  }

  const result = await yantramedCompAccessService.grant(
    email,
    "tester — full Advanced access, no payment",
  );

  console.log("\n✓ Complimentary access granted");
  console.log("  Email:     ", result.email);
  console.log("  Firebase UID:", result.firebaseUid ?? "(not signed up yet)");
  console.log(
    "  users/{uid} written:",
    result.firestoreUserWritten ? "yes" : "no — will apply after first Google login",
  );
  console.log("\nGive this Gmail to the tester:");
  console.log(`  ${result.email}`);
  console.log("\nInstructions for tester:");
  console.log("  1. Open YantraMed app");
  console.log("  2. Sign in with Google using that email");
  console.log("  3. Full course access unlocks (has_access=true, tier=advanced)");
  if (!result.firebaseUid) {
    console.log("\nNote: User has not signed in yet.");
    console.log("  After their first Google login, re-run this script once to write users/{uid},");
    console.log("  OR they can use subscription/status API which checks comp_access by email.");
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
