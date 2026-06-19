import { redirect } from "next/navigation";

// /login is now consolidated — always redirect to the unified login at "/"
export default function LoginRedirect() {
  redirect("/");
}
