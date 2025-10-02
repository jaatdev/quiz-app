'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  showNumbers?: boolean;
}

export function ProgressBar({ current, total, showNumbers = true }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full">
      {showNumbers && (
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Progress</span>
          <span className="text-sm font-medium text-gray-900">
            {current} of {total}
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
