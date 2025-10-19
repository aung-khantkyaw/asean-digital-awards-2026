import Header from "@/components/common/Header";
import { useTranslation } from "react-i18next";
import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "@/assets/styles/home.css";

export default function Home() {
  const mapCenter: LatLngTuple = [16.8394054, 96.0167634];
  const { t } = useTranslation(["home", "common"]);

  const quickLinks = [
    { href: "/", label: t("common:footer.links.home") },
    { href: "/map", label: t("common:footer.links.map") },
    { href: "#timeline", label: t("common:footer.links.timeline") },
  ];
  const supportLinks = [
    {
      href: "mailto:aungkhantkyaw.info@gmail.com",
      label: t("common:footer.support.email"),
    },
    // { href: "/help-center", label: t("common:footer.support.center") },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />

      <main className="container mx-auto px-4 lg:px-8 relative">
        <div>
          <div className="p-4 lg:p-8">
            <header className="text-center my-12 lg:my-24">
              <h1 className="text-4xl lg:text-6xl font-bold text-white">
                {t("common:hero.title")}
              </h1>
              <p className="mt-4 text-lg text-gray-300">
                {t("common:hero.subtitle")}
              </p>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <aside className="lg:sticky lg:top-32">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-white shadow-lg">
                  <h2 className="text-3xl font-bold mb-4 text-white">
                    {t("map.title")}
                  </h2>
                  <div className="relative w-full h-[600px] bg-gray-900/50 rounded-lg overflow-hidden border border-white/10">
                    <MapContainer
                      center={mapCenter}
                      zoom={5}
                      style={{ height: "80vh", width: "100%" }}
                    >
                      <TileLayer
                        attribution=""
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                      />
                    </MapContainer>
                  </div>
                  <p className="text-gray-400 mt-4 text-center text-sm">
                    {t("map.description")}
                  </p>
                </div>
              </aside>

              <main className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-white shadow-lg lg:p-8">
                <h2 className="text-3xl font-bold mb-6 text-white">
                  {t("history.title")}
                </h2>
                <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
                  <p className="typing-text-long">{t("history.intro")}</p>
                  <div className="typing-text typing-text-delay-1">
                    <h3 className="font-semibold text-xl text-blue-400 inline-block">
                      {t("history.bagan.title")}
                    </h3>
                    <p className="text-gray-400 mt-1 text-base">
                      {t("history.bagan.description")}
                    </p>
                  </div>
                  <div className="typing-text typing-text-delay-2">
                    <h3 className="font-semibold text-xl text-purple-400 inline-block">
                      {t("history.konbaung.title")}
                    </h3>
                    <p className="text-gray-400 mt-1 text-base">
                      {t("history.konbaung.description")}
                    </p>
                  </div>
                  <div className="typing-text typing-text-delay-3">
                    <h3 className="font-semibold text-xl text-teal-400 inline-block">
                      {t("history.colonial.title")}
                    </h3>
                    <p className="text-gray-400 mt-1 text-base">
                      {t("history.colonial.description")}
                    </p>
                  </div>
                </div>
                <a
                  href="/landmark-map"
                  className="mt-12 w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center text-lg"
                >
                  <span className="material-icons mr-2">explore</span>{" "}
                  {t("cta.button")}
                </a>
              </main>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative mt-auto border-t border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="mx-auto max-w-6xl px-4 sm:px-8 py-12 text-slate-200">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr]">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300/80">
                <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
                {t("common:footer.badge")}
              </span>
              <h3 className="text-2xl font-semibold">
                {t("common:footer.title")}
              </h3>
              <p className="text-sm text-slate-300/80">
                {t("common:footer.tagline")}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300/90">
                {t("common:footer.linksTitle")}
              </h4>
              <ul className="mt-4 space-y-3 text-sm">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="inline-flex items-center gap-2 text-slate-300 transition hover:text-emerald-300"
                    >
                      <span className="h-px w-5 bg-emerald-400/60" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300/90">
                {t("common:footer.supportTitle")}
              </h4>
              <ul className="mt-4 space-y-3 text-sm">
                {supportLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="inline-flex items-center gap-2 text-slate-300 transition hover:text-emerald-300"
                    >
                      <span className="size-2 rounded-full border border-emerald-400/60" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>
              © {new Date().getFullYear()} {t("common:footer.copyright")}
            </span>
            <span className="flex items-center gap-2 text-slate-400/80">
              <span className="size-2 rounded-full bg-emerald-400/80" />
              {t("common:footer.status")}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
