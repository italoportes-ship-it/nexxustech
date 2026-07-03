import { Skeleton } from "@/components/ui/skeleton";

interface ProductCardSkeletonProps {
  count?: number;
}

export default function ProductCardSkeleton({ count = 6 }: ProductCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bento-card !p-6 flex flex-col animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="flex-1">
            {/* Badge skeleton */}
            <Skeleton className="h-5 w-16 rounded-full mb-4" />
            {/* Title skeleton */}
            <Skeleton className="h-5 w-3/4 rounded-lg mb-3" />
            {/* Description skeleton */}
            <Skeleton className="h-4 w-full rounded-lg mb-2" />
            <Skeleton className="h-4 w-5/6 rounded-lg mb-4" />
            {/* Tags skeleton */}
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-lg" />
              <Skeleton className="h-6 w-24 rounded-lg" />
              <Skeleton className="h-6 w-16 rounded-lg" />
            </div>
          </div>
          {/* Price and CTA skeleton */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            <Skeleton className="h-6 w-28 rounded-lg" />
            <Skeleton className="h-4 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </>
  );
}

export function CourseCardSkeleton({ count = 4 }: ProductCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bento-card !p-6 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          {/* Badges */}
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          {/* Title */}
          <Skeleton className="h-6 w-4/5 rounded-lg mb-3" />
          {/* Description */}
          <Skeleton className="h-4 w-full rounded-lg mb-2" />
          <Skeleton className="h-4 w-3/4 rounded-lg mb-4" />
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Skeleton className="h-6 w-16 rounded-lg" />
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-6 w-18 rounded-lg" />
          </div>
          {/* Price and CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Skeleton className="h-7 w-32 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
}
