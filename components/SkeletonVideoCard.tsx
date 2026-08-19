/**
 * Card skeleton pentru stari de incarcare (loading.tsx) – shimmer neon.
 */
export default function SkeletonVideoCard() {
  return (
    <div className="glass overflow-hidden rounded-xl">
      <div className="skeleton aspect-video w-full" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-4/5 rounded" />
        <div className="skeleton h-4 w-3/5 rounded" />
        <div className="skeleton h-8 w-1/2 rounded" />
      </div>
    </div>
  );
}
