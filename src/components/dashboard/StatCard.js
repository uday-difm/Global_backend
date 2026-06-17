export default function StatCard({ title, value }) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md sm:p-6">
      <p className="text-xs text-gray-500 sm:text-sm">{title}</p>

      <h2 className="mt-2 text-2xl font-bold sm:text-3xl lg:text-4xl">
        {value}
      </h2>
    </div>
  );
}
