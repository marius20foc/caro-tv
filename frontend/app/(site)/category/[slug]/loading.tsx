import SkeletonVideoCard from '@/components/SkeletonVideoCard';

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="skeleton h-5 w-56 rounded" />
      <div className="skeleton mt-8 h-14 w-2/3 max-w-lg rounded" />
      <div className="skeleton mt-4 h-4 w-1/2 max-w-md rounded" />
      <div className="masonry mt-10 columns-1 sm:columns-2 lg:columns-3 xl:columns-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonVideoCard key={i} />
        ))}
      </div>
    </div>
  );
}
