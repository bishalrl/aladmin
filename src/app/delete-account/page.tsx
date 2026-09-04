import { redirect } from "next/navigation";

/** Convenience URL → YantraMed account deletion page */
export default function DeleteAccountIndexPage() {
  redirect("/delete-account/yantramed");
}
