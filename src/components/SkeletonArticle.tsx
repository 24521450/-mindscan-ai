import React from "react";

const SkeletonArticle: React.FC = () => (
  <div className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl shadow-md overflow-hidden border border-slate-100 dark:border-slate-800">
    <div className="h-48 bg-slate-200 dark:bg-slate-800 w-full" />
    <div className="p-5">
      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
      <div className="flex gap-2 mb-2">
        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6 mb-2" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mt-4" />
    </div>
  </div>
);

export default SkeletonArticle;
