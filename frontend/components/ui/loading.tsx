export function Loading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="animate-pulse">
      <div className="h-32 bg-gray-200 rounded-lg"></div>
    </div>
  );
}
