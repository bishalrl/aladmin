/**
 * Create a Firebase Auth email/password tester account with full YantraMed access.
 *
 * Google Sign-In does NOT have a shareable password. This creates an email+password
 * Auth user the tester can use if the app supports email login, OR you can still
 * grant a real Gmail for Google Sign-In separately.
 *
 * Usage:
 *   npx tsx scripts/create-yantramed-tester-account.ts
 *   npx tsx scripts/create-yantramed-tester-account.ts tester@example.com 'MyPass123!'
 */
import "dotenv/config";
import { randomBytes } from "crypto";
import { firebaseProjectManager } from "../src/lib/firebase/FirebaseProjectManager";
import { yantramedCompAccessService } from "../src/services/YantramedCompAccessService";
import { yantramedBillingFirestoreService } from "../src/services/YantramedBillingFirestoreService";

function makePassword(): string {
  return `YmTest-${randomBytes(6).toString("base64url")}!a1`;
}

async function main() {
  const email = (
    process.argv[2]?.trim() ||
    process.env.YANTRAMED_TESTER_EMAIL ||
    "yantramed.tester@sikaupaisa.com"
  ).toLowerCase();
  const password = process.argv[3]?.trim() || makePassword();

  const auth = firebaseProjectManager.getAuth("yantramed");
  if (!auth) {
    throw new Error(
      "YantraMed Firebase Auth not configured. Set YANTRAMED_FIREBASE_CREDENTIALS_FILE in .env",
    );
  }

  let uid: string;
  let created = false;

  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    await auth.updateUser(uid, {
      password,
      emailVerified: true,
      disabled: false,
    });
    console.log("Updated existing Auth user password.");
  } catch {
    const user = await auth.createUser({
      email,
      password,
      emailVerified: true,
      displayName: "YantraMed Tester",
      disabled: false,
    });
    uid = user.uid;
    created = true;
    console.log("Created new Auth user.");
  }

  // Full complimentary access in Firestore
  await yantramedCompAccessService.grant(
    email,
    "tester account — email/password, full Advanced access",
  );

  await yantramedBillingFirestoreService.syncSubscription(
    uid,
    {
      has_access: true,
      tier: "advanced",
      status: "active",
      subscription_id: `comp_${email}`,
      customer_id: null,
      price_id: null,
      product_id: null,
      plan_name: "Advanced",
      billing_interval: null,
      email,
      provider: "comp",
    },
    {
      email,
      display_name: "YantraMed Tester",
    },
  );

  console.log("\n========================================");
  console.log("  TESTER ACCOUNT (share with tester)");
  console.log("========================================");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log(`  UID:      ${uid}`);
  console.log(`  Created:  ${created ? "yes" : "no (password reset)"}`);
  console.log("  Access:   Advanced (unlimited, no payment)");
  console.log("========================================");
  console.log("\nHow the tester signs in:");
  console.log("  • If the app has Email/Password login → use the credentials above.");
  console.log("  • If the app is Google-only → Google has no shareable password.");
  console.log("    Use a real Gmail you control, then:");
  console.log(`    npx tsx scripts/grant-yantramed-tester.ts that-gmail@gmail.com`);
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
