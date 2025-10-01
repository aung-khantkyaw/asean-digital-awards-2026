import { useUser, useStackApp } from "@stackframe/react";

// A simpler, minimal header design: flat background, subtle border, responsive layout.
export const Header = () => {
  const app = useStackApp();
  const user = useUser();

  return (
    <header className="w-full border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-screen-xl flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Left / Brand */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Optional logo placeholder (replace with an <img/> if needed) */}
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm select-none">
            ADA
          </div>
          <h1 className="text-sm sm:text-base font-semibold tracking-tight text-gray-800 truncate">
            ASEAN Digital Awards 2026
          </h1>
        </div>

        {/* Right / Auth Controls */}
        <nav aria-label="User" className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-gray-600">
                Hi, {user.displayName || "User"}
              </span>
              <button
                type="button"
                onClick={() => user.signOut()}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => app.redirectToSignIn()}
                className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => app.redirectToSignUp()}
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
              >
                Sign Up
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
