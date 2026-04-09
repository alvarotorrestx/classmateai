import SkeletonBlock from "./SkeletonBlock";

const StatCardSkeleton = () => (
  <div className="bg-surface rounded-2xl border border-theme shadow-sm p-4 flex flex-col gap-2">
    <SkeletonBlock className="h-3 w-20" />
    <SkeletonBlock className="h-8 w-14" />
    <SkeletonBlock className="h-3 w-24" />
  </div>
);

const CourseCardSkeleton = () => (
  <div className="bg-surface rounded-2xl border border-theme shadow-sm p-4">
    <div className="flex items-start justify-between mb-3">
      <SkeletonBlock className="h-4 w-2/3" />
      <SkeletonBlock className="h-5 w-12 rounded-full" />
    </div>
    <SkeletonBlock className="h-3 w-1/2 mb-3" />
    <div className="flex gap-4 mb-3">
      <SkeletonBlock className="h-3 w-20" />
      <SkeletonBlock className="h-3 w-20" />
    </div>
    <div className="flex items-center justify-between mb-1">
      <SkeletonBlock className="h-3 w-14" />
      <SkeletonBlock className="h-3 w-10" />
    </div>
    <SkeletonBlock className="h-1.5 w-full rounded-full" />
  </div>
);

export const DashboardSkeleton = () => (
  <div aria-busy="true" className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    <div>
      <SkeletonBlock className="h-6 w-44 mb-3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl border border-theme shadow-sm p-4 flex flex-col gap-2">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-4 w-2/3" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-5/6" />
            <SkeletonBlock className="h-4 w-28 mt-1" />
          </div>
        ))}
      </div>
    </div>

    <div>
      <div className="flex items-center justify-between mb-4">
        <SkeletonBlock className="h-6 w-36" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-9 w-16" />
          <SkeletonBlock className="h-9 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

export const CourseGridSkeleton = ({ count = 3 }) => (
  <div aria-busy="true" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <CourseCardSkeleton key={i} />
    ))}
  </div>
);

export const DeckGridSkeleton = ({ count = 3 }) => (
  <div aria-busy="true" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-surface rounded-2xl border border-theme shadow-sm p-5">
        <SkeletonBlock className="h-4 w-2/3 mb-2" />
        <SkeletonBlock className="h-3 w-1/2 mb-5" />
        <SkeletonBlock className="h-10 w-28 rounded-xl mt-auto" />
      </div>
    ))}
  </div>
);

export const QuizListSkeleton = ({ count = 4 }) => (
  <div aria-busy="true" className="flex flex-col gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-surface rounded-2xl border border-theme shadow-sm p-5">
        <SkeletonBlock className="h-4 w-1/2 mb-2" />
        <SkeletonBlock className="h-3 w-28 mb-4" />
        <SkeletonBlock className="h-9 w-28 rounded-xl" />
      </div>
    ))}
  </div>
);

export const FlashcardSessionSkeleton = () => (
  <div aria-busy="true" className="max-w-lg mx-auto">
    <SkeletonBlock className="h-6 w-48 mx-auto mb-2" />
    <SkeletonBlock className="h-4 w-40 mx-auto mb-6" />
    <div className="bg-surface rounded-2xl border border-theme p-8 min-h-64 mb-6">
      <SkeletonBlock className="h-4 w-20 mx-auto mb-6" />
      <SkeletonBlock className="h-5 w-3/4 mx-auto mb-3" />
      <SkeletonBlock className="h-5 w-2/3 mx-auto" />
    </div>
    <div className="flex justify-between gap-3">
      <SkeletonBlock className="h-11 w-28 rounded-xl" />
      <SkeletonBlock className="h-11 w-24 rounded-xl" />
      <SkeletonBlock className="h-11 w-24 rounded-xl" />
    </div>
  </div>
);

export const QuizSessionSkeleton = () => (
  <div aria-busy="true" className="max-w-2xl mx-auto">
    <div className="flex items-center justify-between mb-6">
      <SkeletonBlock className="h-4 w-32" />
      <SkeletonBlock className="h-4 w-28" />
    </div>
    <SkeletonBlock className="h-1.5 w-full rounded-full mb-8" />
    <div className="bg-surface rounded-2xl border border-theme shadow-sm p-6 mb-6">
      <SkeletonBlock className="h-4 w-24 mb-3" />
      <SkeletonBlock className="h-6 w-4/5 mb-2" />
      <SkeletonBlock className="h-6 w-3/4" />
    </div>
    <div className="flex flex-col gap-3 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-surface rounded-2xl border border-theme px-5 py-4">
          <div className="flex items-center gap-4">
            <SkeletonBlock className="h-8 w-8 rounded-full" />
            <SkeletonBlock className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
    <div className="flex justify-between gap-3">
      <SkeletonBlock className="h-10 w-28 rounded-xl" />
      <div className="flex gap-3">
        <SkeletonBlock className="h-10 w-24 rounded-xl" />
        <SkeletonBlock className="h-10 w-28 rounded-xl" />
      </div>
    </div>
  </div>
);

export const StudyGuideSkeleton = () => (
  <div aria-busy="true" className="space-y-3 py-1">
    {Array.from({ length: 7 }).map((_, i) => (
      <SkeletonBlock
        key={i}
        className={`h-3 ${i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-11/12" : "w-4/5"}`}
      />
    ))}
  </div>
);
