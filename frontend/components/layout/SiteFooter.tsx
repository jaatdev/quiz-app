export function SiteFooter() {
  return (
    <footer className="mt-12 border-t bg-white/80 backdrop-blur dark:bg-gray-900/80">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">QuizMaster Pro</div>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Practice smarter. Track progress. Master topics.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Explore</div>
            <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li><a href="/leaderboard" className="hover:underline">Leaderboard</a></li>
              <li><a href="/stats" className="hover:underline">Statistics</a></li>
              <li><a href="/history" className="hover:underline">History</a></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Resources</div>
            <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
              <li><a href="https://github.com/jaatdev/quiz-app" target="_blank" className="hover:underline">GitHub</a></li>
              <li><a href="/admin" className="hover:underline">Admin</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 text-center text-xs text-gray-600 dark:text-gray-400">
          © {new Date().getFullYear()} QuizMaster Pro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
