import SkeletonVideoCard from '@/components/SkeletonVideoCard';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="skeleton mx-auto h-16 w-2/3 max-w-xl rounded" />
      <div className="skeleton mx-auto mt-4 h-6 w-1/3 max-w-md rounded" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonVideoCard key={i} />
        ))}
      </div>
    </div>
  );
}
