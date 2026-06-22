import CatchAllPage, { generateMetadata as slugGenerateMetadata } from "./[...slug]/page";

export async function generateMetadata() {
  return slugGenerateMetadata({ params: Promise.resolve({ slug: [] }) });
}

export default async function HomePage() {
  return <CatchAllPage params={Promise.resolve({ slug: [] })} />;
}
