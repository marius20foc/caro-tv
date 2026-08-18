export default function VideoLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="skeleton h-5 w-64 rounded" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="skeleton aspect-video w-full rounded-xl" />
          <div className="skeleton mt-6 h-8 w-3/4 rounded" />
          <div className="skeleton mt-4 h-4 w-1/2 rounded" />
          <div className="skeleton mt-8 h-24 w-full rounded-xl" />
        </div>
        <div className="space-y-6">
          <div className="skeleton h-56 w-full rounded-xl" />
          <div className="skeleton h-44 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
