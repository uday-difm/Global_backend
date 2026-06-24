import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/requireAuth";
import CatchAllPage, { generateMetadata as slugGenerateMetadata } from "./[...slug]/page";

export async function generateMetadata() {
  return slugGenerateMetadata({ params: Promise.resolve({ slug: [] }) });
}

export default async function HomePage() {
  const user = await requireAuth();

  if (user) {
    return <CatchAllPage params={Promise.resolve({ slug: [] })} />;
  } else {
    redirect("/login");
  }
}
