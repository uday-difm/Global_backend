import Link from "next/link";

export default function Sidebar() {
  return (
    <aside>
      <h2>CMS</h2>

      <nav>
        <Link href="/dashboard">Dashboard</Link>
        <br />

        <Link href="/media">Media</Link>
        <br />

        <Link href="/pages">Pages</Link>
        <br />

        <Link href="/blogs">Blogs</Link>
        <br />

        <Link href="/services">Services</Link>
        <br />

        <Link href="/settings">Settings</Link>
      </nav>
    </aside>
  );
}
