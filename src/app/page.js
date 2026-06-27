import { redirect } from "next/navigation";

export default async function HomePage() {
  redirect("/login");
}

export async function generateMetadata() {
  return { title: "Redirecting..." };
}
