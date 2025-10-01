import { Header } from "./header";
import { useStackApp, useUser } from "@stackframe/react";

// Home page redesigned: cleaner hero, contextual message for authenticated users.
export default function Home() {
  const app = useStackApp();
  const user = useUser();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-white relative">
      <Header />

      {/* Decorative subtle background elements */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-blue-100 blur-3xl opacity-40" />
        <div className="absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-indigo-100 blur-3xl opacity-40" />
      </div>

      <main className="flex-1 relative z-10">
        <section className="mx-auto max-w-5xl px-4 sm:px-6 pt-16 pb-20">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-slate-800 leading-tight">
              ASEAN Digital Awards 2026
            </h1>
            <p className="mt-4 text-lg text-slate-600 leading-relaxed">
              Celebrating innovation, impact, and excellence in digital
              solutions across Southeast Asia.{" "}
              {user
                ? "Explore your dashboard, submit entries, and track your progress."
                : "Sign up to submit your digital solution and join a regional community of innovators."}
            </p>
            {!user && (
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => window.location.assign("/handler/sign-up")}
                  className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
                >
                  Get Started
                </button>
                <button
                  onClick={() => window.location.assign("/handler/sign-in")}
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
                >
                  Log In
                </button>
              </div>
            )}
            {user && (
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="/landmark-map"
                  className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
                >
                  View Map
                </a>
                <button
                  onClick={() => app.redirectToAccountSettings()}
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
                >
                  Manage Profile
                </button>
              </div>
            )}
          </div>

          {/* Feature highlights */}
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Regional Recognition",
                body: "Gain visibility across ASEAN for impactful digital products.",
              },
              {
                title: "Innovation Focus",
                body: "Showcase creativity in solving real-world challenges.",
              },
              {
                title: "Collaboration",
                body: "Connect with peers, mentors, and stakeholders.",
              },
              {
                title: "Growth Path",
                body: "Leverage exposure to scale your solution regionally.",
              },
              {
                title: "User Ownership",
                body: "Your account and data stay in your control.",
              },
              {
                title: "Secure Platform",
                body: "Modern authentication and privacy-first architecture.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="group relative rounded-lg border border-slate-200 bg-white/60 backdrop-blur-sm p-5 shadow-sm transition hover:shadow-md"
              >
                <h3 className="text-sm font-semibold text-slate-800 mb-1">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {f.body}
                </p>
                <div className="absolute inset-0 rounded-lg ring-0 ring-blue-500/0 group-hover:ring-2 group-hover:ring-blue-500/30 transition" />
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t bg-white/70 backdrop-blur py-8 mt-auto">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} ASEAN Digital Awards. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
}
