import React from 'react';

interface LoadingProps {
  fullScreen?: boolean;
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ fullScreen = false, message = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-md">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-md"></div>
          <div className="absolute h-6 w-6 rounded-full bg-indigo-100 animate-pulse"></div>
        </div>
        <p className="mt-4 text-sm font-bold text-slate-700 animate-pulse tracking-wide text-center">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-[50vh] w-full flex-col items-center justify-center p-6 text-center animate-fade-in my-auto">
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent shadow-xs"></div>
        <div className="absolute h-6 w-6 rounded-full bg-indigo-100 animate-pulse"></div>
      </div>
      <p className="mt-4 text-sm font-bold text-slate-700 animate-pulse tracking-wide">{message}</p>
    </div>
  );
};

export default Loading;

