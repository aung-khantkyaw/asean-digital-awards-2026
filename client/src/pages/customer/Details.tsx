import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  ChevronLeft,
  ChevronRight,
  Compass,
  Hotel,
  Landmark,
  Loader2,
  MapPin,
  Navigation,
  Utensils,
  X,
} from "lucide-react";
import { Header } from "@/components/header";
import { useTranslation } from "react-i18next";
import {
  normalizeLocalizedField,
  normalizeLocalizedNames,
  pickLocalizedText,
} from "@/utils/localized";
import type { LocalizedTextPair } from "@/utils/localized";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:4000";

type GalleryImage = {
  src: string;
  alt: string;
};

type ContentCard = {
  name: string;
  description: string;
  address?: string;
  highlights?: string[];
  tags?: string[];
  images: GalleryImage[];
};

type TabKey = "history" | "visit-spots" | "restaurants" | "hotels";

type CityDetails = {
  id: string;
  user_id: string | null;
  burmese_name: string | null;
  english_name: string;
  address: LocalizedTextPair;
  description: LocalizedTextPair;
  geometry: string | null;
  image_urls: string[] | null;
};

type CityLocation = {
  id: string;
  city_id: string | null;
  user_id: string | null;
  burmese_name: string | null;
  english_name: string | null;
  address: LocalizedTextPair;
  description: LocalizedTextPair;
  location_type: string | null;
  geometry: string | null;
  image_urls: string[] | null;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function slugify(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

function normalizeImageUrls(source: unknown): string[] | null {
  if (!source) return null;
  if (Array.isArray(source)) {
    return source
      .map((item) => item?.toString().trim())
      .filter((item): item is string => Boolean(item));
  }
  if (typeof source === "string") {
    const trimmed = source.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => item?.toString().trim())
          .filter((item): item is string => Boolean(item));
      }
    } catch {
      // Not JSON, fall through
    }
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return null;
}

type CityApiPayload = Partial<{
  id: unknown;
  user_id: unknown;
  burmese_name: unknown;
  english_name: unknown;
  name: unknown;
  name_en: unknown;
  name_mm: unknown;
  address: unknown;
  address_en: unknown;
  address_mm: unknown;
  address_json: unknown;
  description: unknown;
  description_en: unknown;
  description_mm: unknown;
  description_json: unknown;
  english_description: unknown;
  burmese_description: unknown;
  geometry: unknown;
  image_urls: unknown;
}>;

function pickStringValue(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  }
  return null;
}

type LocationApiPayload = Partial<{
  id: unknown;
  city_id: unknown;
  user_id: unknown;
  burmese_name: unknown;
  english_name: unknown;
  name: unknown;
  name_en: unknown;
  name_mm: unknown;
  address: unknown;
  address_en: unknown;
  address_mm: unknown;
  address_json: unknown;
  description: unknown;
  description_en: unknown;
  description_mm: unknown;
  description_json: unknown;
  english_description: unknown;
  burmese_description: unknown;
  location_type: unknown;
  geometry: unknown;
  image_urls: unknown;
}>;

function normalizeCityResponse(city: unknown): CityDetails {
  const payload: CityApiPayload =
    typeof city === "object" && city !== null ? (city as CityApiPayload) : {};

  const address = normalizeLocalizedField({
    value: payload.address,
    value_en: payload.address_en,
    value_mm: payload.address_mm,
    json: payload.address_json,
  });

  const description = normalizeLocalizedField({
    value: payload.description,
    value_en: payload.description_en,
    value_mm: payload.description_mm,
    english: payload.english_description,
    burmese: payload.burmese_description,
    json: payload.description_json,
  });

  return {
    id: payload.id ? String(payload.id) : "",
    user_id: payload.user_id ? String(payload.user_id) : null,
    burmese_name:
      pickStringValue(payload.burmese_name, payload.name_mm) ?? null,
    english_name:
      pickStringValue(
        payload.english_name,
        payload.name_en,
        payload.name
      ) ?? "",
    address,
    description,
    geometry: typeof payload.geometry === "string" ? payload.geometry : null,
    image_urls: normalizeImageUrls(payload.image_urls ?? null),
  };
}

function normalizeLocationResponse(location: unknown): CityLocation {
  const payload: LocationApiPayload =
    typeof location === "object" && location !== null
      ? (location as LocationApiPayload)
      : {};

  const address = normalizeLocalizedField({
    value: payload.address,
    value_en: payload.address_en,
    value_mm: payload.address_mm,
    json: payload.address_json,
  });

  const description = normalizeLocalizedField({
    value: payload.description,
    value_en: payload.description_en,
    value_mm: payload.description_mm,
    english: payload.english_description,
    burmese: payload.burmese_description,
    json: payload.description_json,
  });

  return {
    id: payload.id ? String(payload.id) : "",
    city_id: payload.city_id ? String(payload.city_id) : null,
    user_id: payload.user_id ? String(payload.user_id) : null,
    burmese_name:
      pickStringValue(payload.burmese_name, payload.name_mm) ?? null,
    english_name: pickStringValue(
      payload.english_name,
      payload.name_en,
      payload.name
    ),
    address,
    description,
    location_type:
      typeof payload.location_type === "string" ? payload.location_type : null,
    geometry: typeof payload.geometry === "string" ? payload.geometry : null,
    image_urls: normalizeImageUrls(payload.image_urls ?? null),
  };
}

function formatLocationTag(type: string): string {
  return type
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function determineLocationCategory(
  type?: string | null
): "visit" | "restaurant" | "hotel" {
  if (!type) return "visit";
  const normalized = type.toLowerCase();
  if (
    normalized.includes("restaurant") ||
    normalized.includes("cafe") ||
    normalized.includes("food") ||
    normalized.includes("eatery")
  ) {
    return "restaurant";
  }
  if (
    normalized.includes("hotel") ||
    normalized.includes("resort") ||
    normalized.includes("inn") ||
    normalized.includes("lodge") ||
    normalized.includes("guesthouse")
  ) {
    return "hotel";
  }
  return "visit";
}

function createGalleryFromUrls(
  imageUrls: string[] | null | undefined,
  altPrefix: string
): GalleryImage[] {
  if (!imageUrls?.length) return [];
  return imageUrls.map((src, index) => ({
    src,
    alt: `${altPrefix} photo ${index + 1}`,
  }));
}

async function fetchCity(cityId: string, signal: AbortSignal) {
  const response = await fetch(`${API_BASE_URL}/cities/${cityId}`, {
    signal,
  });
  if (!response.ok) return null;
  const json = await response.json();
  if (!json?.is_success || !json.data) return null;
  const payload = Array.isArray(json.data) ? json.data[0] : json.data;
  if (!payload) return null;
  return normalizeCityResponse(payload);
}

async function fetchCityByIdentifier(identifier: string, signal: AbortSignal) {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  const direct = await fetchCity(trimmed, signal);
  if (direct) return direct;

  if (isUuid(trimmed)) return null;

  const response = await fetch(`${API_BASE_URL}/cities`, { signal });
  if (!response.ok) return null;
  const json = await response.json();
  const raw = json?.data;
  const items = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
    ? [raw]
    : [];
  const cities: CityDetails[] = items.map(normalizeCityResponse);

  const slug = slugify(trimmed);
  const match = cities.find((candidate) => {
    const englishSlug = slugify(candidate.english_name);
    const burmeseSlug = slugify(candidate.burmese_name);
    const idSlug = slugify(candidate.id);
    return slug === englishSlug || slug === burmeseSlug || slug === idSlug;
  });

  if (!match) return null;
  if (match.id === trimmed) return match;
  return (await fetchCity(match.id, signal)) ?? match;
}

async function fetchLocations(cityId: string, signal: AbortSignal) {
  const response = await fetch(
    `${API_BASE_URL}/locations?city_id=${encodeURIComponent(cityId)}`,
    { signal }
  );
  if (!response.ok) return [];
  const json = await response.json();
  if (!json?.is_success || !json.data) return [];
  const raw = json.data;
  const items = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
    ? [raw]
    : [];
  return items.map(normalizeLocationResponse);
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Navigation;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 mb-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/15 text-blue-300">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-sm text-slate-300/70">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ImageCarousel({
  images,
  altPrefix,
  onImageClick,
}: {
  images: GalleryImage[];
  altPrefix: string;
  onImageClick?: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (direction: "left" | "right") => {
    const node = scrollRef.current;
    if (!node) return;
    const amount = node.clientWidth * 0.8;
    node.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (!images.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-900/40 text-sm text-slate-400">
        Photo gallery coming soon.
      </div>
    );
  }

  return (
    <div className="relative group">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/40 p-2 scroll-smooth"
      >
        {images.map((image, index) => (
          <button
            key={`${altPrefix}-${index}`}
            type="button"
            onClick={() => onImageClick?.(index)}
            className="relative w-[220px] flex-shrink-0 overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <img
              src={image.src}
              alt={image.alt}
              className="h-40 w-full object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
          </button>
        ))}
      </div>
      {images.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            onClick={() => scrollBy("left")}
            aria-label="Scroll images left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            onClick={() => scrollBy("right")}
            aria-label="Scroll images right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}
    </div>
  );
}

function EmptySectionMessage({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-6 text-sm text-slate-300">
      {message}
    </div>
  );
}

function LoadingCity({ cityName }: { cityName: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      <Loader2 className="h-9 w-9 animate-spin text-blue-300" />
      <p className="mt-4 text-sm uppercase tracking-[0.3em] text-blue-200/80">
        Preparing {cityName} guide...
      </p>
    </div>
  );
}

function UnsupportedCity({
  cityName,
  message,
}: {
  cityName: string;
  message?: string;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(192,132,252,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.2)_0%,rgba(15,23,42,0.8)_50%,rgba(15,23,42,0.2)_100%)]" />
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-blue-300/80">
            Coming soon
          </span>
          <h1 className="mt-6 text-3xl font-semibold text-white sm:text-4xl">
            {cityName} route guide is on the way
          </h1>
          <p className="mt-4 text-sm text-slate-300/90 sm:text-base">
            {message ?? (
              <>
                We haven't published a detailed itinerary for {cityName} just
                yet. Explore our existing guides or head back to the interactive
                map to keep planning your adventure.
              </>
            )}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-slate-100 transition hover:border-blue-400/50 hover:text-white"
            >
              Go home
            </Link>
            <Link
              to="/landmark-map"
              className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-400"
            >
              Open map
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function formatCityName(raw: string) {
  return raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(
      (segment) =>
        segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
    )
    .join(" ");
}

export default function Details() {
  const { cityId } = useParams<{ cityId?: string }>();
  const requestedIdentifier = (cityId ?? "maubin").trim() || "maubin";

  const { i18n } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language ?? "en";

  const [city, setCity] = useState<CityDetails | null>(null);
  const [locations, setLocations] = useState<CityLocation[]>([]);
  const [isCityLoading, setIsCityLoading] = useState(true);
  const [areLocationsLoading, setAreLocationsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("history");
  const [modalState, setModalState] = useState<{
    open: boolean;
    title: string;
    images: GalleryImage[];
  }>({ open: false, title: "", images: [] });
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function loadCity() {
      setIsCityLoading(true);
      setAreLocationsLoading(false);
      setError(null);
      setCity(null);
      setLocations([]);

      try {
        const fetchedCity = await fetchCityByIdentifier(
          requestedIdentifier,
          controller.signal
        );

        if (!mounted) return;

        if (!fetchedCity) {
          setError("City not found in our dataset just yet.");
          setCity(null);
          setLocations([]);
          return;
        }

        setCity(fetchedCity);
        setIsCityLoading(false);

        setAreLocationsLoading(true);
        const fetchedLocations = await fetchLocations(
          fetchedCity.id,
          controller.signal
        );
        if (!mounted) return;
        setLocations(fetchedLocations);
      } catch (err) {
        if (!mounted) return;
        console.error(err);
        setError(
          "We couldn't load this city right now. Please try again shortly."
        );
        setCity(null);
        setLocations([]);
      } finally {
        if (mounted) {
          setIsCityLoading(false);
          setAreLocationsLoading(false);
        }
      }
    }

    loadCity();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [requestedIdentifier]);

  useEffect(() => {
    if (!modalState.open) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalState({ open: false, title: "", images: [] });
        return;
      }

      if (event.key === "ArrowLeft") {
        setLightboxIndex((current) =>
          modalState.images.length ? Math.max(current - 1, 0) : current
        );
      }

      if (event.key === "ArrowRight") {
        setLightboxIndex((current) =>
          modalState.images.length
            ? Math.min(current + 1, modalState.images.length - 1)
            : current
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalState]);

  useEffect(() => {
    document.body.style.overflow = modalState.open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalState.open]);

  const cityLocalizedNames = useMemo(
    () =>
      normalizeLocalizedNames({
        english_name: city?.english_name,
        burmese_name: city?.burmese_name,
      }),
    [city?.english_name, city?.burmese_name]
  );

  const { en: cityNameEn, mm: cityNameMm } = cityLocalizedNames;

  const displayCityName = useMemo(
    () =>
      pickLocalizedText(activeLanguage, {
        en: cityNameEn,
        mm: cityNameMm,
        fallback: formatCityName(requestedIdentifier),
      }),
    [activeLanguage, cityNameEn, cityNameMm, requestedIdentifier]
  );

  const cityDescriptionText = useMemo(() => {
    if (!city) return "";
    return pickLocalizedText(activeLanguage, {
      en: city.description.en,
      mm: city.description.mm,
      fallback: "",
    });
  }, [city, activeLanguage]);

  const heroDescription = cityDescriptionText
    ? cityDescriptionText
    : `Navigate the scenic waterways, heritage streets, and vibrant markets that define ${displayCityName}.`;

  const historyParagraphs = useMemo<string[]>(() => {
    if (!cityDescriptionText) return [];
    return cityDescriptionText
      .split(/\n+/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }, [cityDescriptionText]);

  const heroImages = useMemo(
    () => createGalleryFromUrls(city?.image_urls, displayCityName),
    [city?.image_urls, displayCityName]
  );

  const adventurePhotos = heroImages;
  const activeModalImage = modalState.images[lightboxIndex];

  const { visitCards, restaurantCards, hotelCards } = useMemo(() => {
    const visit: ContentCard[] = [];
    const restaurant: ContentCard[] = [];
    const hotel: ContentCard[] = [];

    if (!locations.length) {
      return {
        visitCards: visit,
        restaurantCards: restaurant,
        hotelCards: hotel,
      };
    }

    locations.forEach((location, index) => {
      const normalizedNames = normalizeLocalizedNames(location);
      const fallbackName = `${displayCityName} highlight ${index + 1}`;
      const name = pickLocalizedText(activeLanguage, {
        en: normalizedNames.en,
        mm: normalizedNames.mm,
        fallback: fallbackName,
      });
      const tag = location.location_type
        ? formatLocationTag(location.location_type)
        : undefined;
      const gallery = createGalleryFromUrls(location.image_urls, name);

      const fallbackDescription = `Discover this ${
        tag ? tag.toLowerCase() : "featured"
      } spot while exploring ${displayCityName}.`;

      const description = pickLocalizedText(activeLanguage, {
        en: location.description.en,
        mm: location.description.mm,
        fallback: fallbackDescription,
      }).trim();

      const addressText = pickLocalizedText(activeLanguage, {
        en: location.address.en,
        mm: location.address.mm,
        fallback: location.address.en ?? location.address.mm ?? null,
      }).trim();

      const card: ContentCard = {
        name,
        description,
        address: addressText.length ? addressText : undefined,
        tags: tag ? [tag] : undefined,
        images: gallery,
      };

      const category = determineLocationCategory(location.location_type);

      if (category === "visit") {
        visit.push(card);
      } else if (category === "restaurant") {
        restaurant.push(card);
      } else {
        hotel.push(card);
      }
    });

    return {
      visitCards: visit,
      restaurantCards: restaurant,
      hotelCards: hotel,
    };
  }, [locations, displayCityName, activeLanguage]);

  const datasetEligibleLocations = useMemo(() => {
    if (!locations.length) return [];
    return locations.filter((location) => {
      if (!location.location_type) return true;
      return !location.location_type.toLowerCase().includes("intersection");
    });
  }, [locations]);

  const locationHighlights = useMemo(() => {
    if (!datasetEligibleLocations.length) return [];
    return datasetEligibleLocations.slice(0, 4);
  }, [datasetEligibleLocations]);

  const datasetHighlights = useMemo(
    () =>
      datasetEligibleLocations.slice(0, 3).map((location, index) => {
        const normalizedNames = normalizeLocalizedNames(location);
        const title = pickLocalizedText(activeLanguage, {
          en: normalizedNames.en,
          mm: normalizedNames.mm,
          fallback: `Location ${index + 1}`,
        });
        const typeLabel = location.location_type
          ? formatLocationTag(location.location_type)
          : "Point of Interest";
        const fallbackDescription = `Discover this ${typeLabel.toLowerCase()} while exploring ${displayCityName}.`;
        const description = pickLocalizedText(activeLanguage, {
          en: location.description.en,
          mm: location.description.mm,
          fallback: fallbackDescription,
        });
        return {
          title,
          description,
        };
      }),
    [datasetEligibleLocations, displayCityName, activeLanguage]
  );

  const tabs: { key: TabKey; label: string; icon: typeof Landmark }[] = [
    { key: "history", label: "History", icon: Landmark },
    { key: "visit-spots", label: "Visit Spots", icon: Navigation },
    { key: "restaurants", label: "Restaurants", icon: Utensils },
    { key: "hotels", label: "Hotels", icon: Hotel },
  ];

  const openModal = (title: string, images: GalleryImage[], index = 0) => {
    setModalState({ open: true, title, images });
    setLightboxIndex(index);
  };

  const closeModal = () => {
    setModalState({ open: false, title: "", images: [] });
  };

  if (isCityLoading && !city) {
    return <LoadingCity cityName={displayCityName} />;
  }

  if (!city) {
    return (
      <UnsupportedCity
        cityName={displayCityName}
        message={
          error ??
          `We haven't published a detailed itinerary for ${displayCityName} just yet. Check the map for other destinations.`
        }
      />
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(192,132,252,0.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.2)_0%,rgba(15,23,42,0.8)_50%,rgba(15,23,42,0.2)_100%)]" />

      <Header />

      <main className="relative z-10 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/"
            className="group inline-flex items-center text-sm text-blue-300 transition hover:text-blue-200"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition group-hover:-translate-x-1" />
            Back Home
          </Link>

          <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-white drop-shadow md:text-5xl">
                Routes in {displayCityName} Township
              </h1>
              <p className="max-w-2xl text-base text-slate-300 md:text-lg">
                {heroDescription}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                to={`/landmark-map/${city.id}`}
                className="flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
              >
                <Navigation className="h-4 w-4" />
                Explore map
              </Link>
            </div>
          </div>

          {heroImages.length ? (
            <div className="relative mt-8 grid h-[520px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 shadow-2xl shadow-black/40">
              {heroImages.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  onClick={() =>
                    openModal("Adventure Photos", adventurePhotos, index)
                  }
                  className={`group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    index === 0
                      ? "col-span-2 row-span-2"
                      : index === heroImages.length - 1
                      ? "col-span-2"
                      : ""
                  }`}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </button>
              ))}

              <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/5" />

              <button
                type="button"
                onClick={() => openModal("Adventure Photos", adventurePhotos)}
                className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-white/20 bg-black/60 px-4 py-2 text-sm text-white backdrop-blur transition hover:bg-black/80"
              >
                <Camera className="h-4 w-4" />
                Show all photos ({adventurePhotos.length})
              </button>
            </div>
          ) : (
            <div className="mt-8 flex h-[320px] items-center justify-center rounded-3xl border border-dashed border-white/15 bg-slate-900/40 text-sm text-slate-300">
              Photo gallery will appear once city images are available.
            </div>
          )}

          <div className="mt-10 border-y border-white/10 py-4" id="history">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-2 border-b-2 pb-2 transition ${
                    activeTab === key
                      ? "border-blue-500 text-white"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "history" ? (
            <section className="mt-12 space-y-12">
              <SectionHeading
                icon={Landmark}
                title={`History of ${displayCityName}`}
                subtitle="From river gateway to cultural heart of the delta"
              />
              <div className="grid gap-8 text-slate-300 lg:grid-cols-[1.7fr_1fr]">
                <div className="space-y-5 text-base leading-relaxed">
                  {historyParagraphs.length ? (
                    historyParagraphs.map((paragraph, index) => (
                      <p key={`history-${index}`}>{paragraph}</p>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400">
                      We're gathering narrative details for {displayCityName}.
                    </p>
                  )}
                </div>
                <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/40 p-6">
                  <h3 className="text-lg font-semibold text-white">
                    Cultural Highlights
                  </h3>
                  <div className="space-y-4">
                    {datasetHighlights.length ? (
                      datasetHighlights.map((highlight) => (
                        <div
                          key={highlight.title}
                          className="rounded-xl border border-white/10 bg-slate-900/50 p-4"
                        >
                          <h4 className="text-base font-semibold text-white">
                            {highlight.title}
                          </h4>
                          <p className="mt-1 text-sm text-slate-300/80">
                            {highlight.description}
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptySectionMessage
                        message={`We'll surface cultural highlights as soon as data is available for ${displayCityName}.`}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* <div className="mt-10" id="plan-your-trip">
                <SectionHeading
                  icon={Navigation}
                  title="Popular Routes"
                  subtitle={`Preview three must-see stops on your ${displayCityName} itinerary`}
                />
                {visitCards.length ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    {visitCards.slice(0, 2).map((spot) => (
                      <div
                        key={spot.name}
                        className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-lg shadow-black/30 transition hover:border-blue-400/40 hover:shadow-blue-500/20"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-white">
                              {spot.name}
                            </h3>
                            {spot.address ? (
                              <p className="mt-1 text-sm text-blue-200">
                                {spot.address}
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white transition hover:bg-white/20"
                            onClick={() => openModal(spot.name, spot.images)}
                          >
                            <Camera className="h-4 w-4" />
                            View photos
                          </button>
                        </div>
                        <p className="mt-4 text-sm text-slate-300">
                          {spot.description}
                        </p>
                        {spot.highlights ? (
                          <ul className="mt-4 space-y-2 text-sm text-slate-300/80">
                            {spot.highlights.map((highlight) => (
                              <li
                                key={`${spot.name}-${highlight}`}
                                className="flex items-start gap-2"
                              >
                                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptySectionMessage message="Live routes will appear once locations are tagged for this city." />
                )}
              </div> */}

              {locationHighlights.length ? (
                <div className="mt-12 space-y-8" id="dataset-highlights">
                  <SectionHeading
                    icon={MapPin}
                    title={`${displayCityName} highlights from the dataset`}
                    subtitle={
                      areLocationsLoading
                        ? "Fetching the latest map locations..."
                        : "Live points of interest curated from the routing dataset"
                    }
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    {locationHighlights.map((highlight, index) => {
                      const normalizedNames =
                        normalizeLocalizedNames(highlight);
                      const highlightName = pickLocalizedText(activeLanguage, {
                        en: normalizedNames.en,
                        mm: normalizedNames.mm,
                        fallback: `Dataset highlight ${index + 1}`,
                      });
                      const highlightTag = highlight.location_type
                        ? formatLocationTag(highlight.location_type)
                        : null;
                      const highlightAddress = pickLocalizedText(
                        activeLanguage,
                        {
                          en: highlight.address.en,
                          mm: highlight.address.mm,
                          fallback:
                            highlight.address.en ??
                            highlight.address.mm ??
                            null,
                        }
                      ).trim();
                      const highlightDescription = pickLocalizedText(
                        activeLanguage,
                        {
                          en: highlight.description.en,
                          mm: highlight.description.mm,
                          fallback:
                            "We're still gathering storytelling details for this location. Open the interactive map for more context.",
                        }
                      ).trim();
                      return (
                        <article
                          key={highlight.id}
                          className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 shadow-lg shadow-black/30"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-lg font-semibold text-white">
                                {highlightName}
                              </h4>
                              {highlightAddress ? (
                                <p className="mt-1 flex items-center gap-1 text-xs text-blue-200">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {highlightAddress}
                                </p>
                              ) : null}
                            </div>
                            {highlightTag ? (
                              <span className="inline-flex items-center rounded-full border border-white/20 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-200/80">
                                {highlightTag}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm text-slate-300/90">
                            {highlightDescription}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {activeTab === "visit-spots" ? (
            <section className="mt-16 space-y-12">
              <SectionHeading
                icon={Landmark}
                title="Places to Visit"
                subtitle="Handpicked sights combining culture, nature, and architecture"
              />
              <div className="space-y-12">
                {visitCards.length ? (
                  visitCards.map((spot) => (
                    <div
                      key={spot.name}
                      className="flex flex-col gap-8 rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-lg shadow-black/40 lg:flex-row"
                    >
                      <div className="lg:w-5/12">
                        <ImageCarousel
                          images={spot.images}
                          altPrefix={spot.name}
                          onImageClick={(index) =>
                            openModal(spot.name, spot.images, index)
                          }
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between space-y-4">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-2xl font-semibold text-white">
                              {spot.name}
                            </h3>
                            {spot.address ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-blue-200">
                                <MapPin className="h-3.5 w-3.5" />
                                {spot.address}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm text-slate-300">
                            {spot.description}
                          </p>
                          {spot.highlights ? (
                            <ul className="mt-4 grid gap-2 text-sm text-slate-300/80">
                              {spot.highlights.map((highlight) => (
                                <li
                                  key={`${spot.name}-${highlight}`}
                                  className="flex items-start gap-2"
                                >
                                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400" />
                                  {highlight}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => openModal(spot.name, spot.images)}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
                          >
                            <Camera className="h-4 w-4" />
                            Open gallery
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-slate-100 transition hover:border-blue-300/60 hover:text-white"
                          >
                            <Navigation className="h-4 w-4" />
                            Start route
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptySectionMessage message="We don't have visit spots for this city yet. Check back soon." />
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "restaurants" ? (
            <section className="mt-16 space-y-12">
              <SectionHeading
                icon={Utensils}
                title="Restaurants"
                subtitle="Taste the delta with fresh seafood, street eats, and tea-house classics"
              />
              <div className="space-y-10">
                {restaurantCards.length ? (
                  restaurantCards.map((restaurant) => (
                    <div
                      key={restaurant.name}
                      className="flex flex-col gap-8 rounded-3xl border border-white/10 bg-slate-900/40 p-6 shadow-lg shadow-black/40 lg:flex-row"
                    >
                      <div className="lg:w-5/12">
                        <ImageCarousel
                          images={restaurant.images}
                          altPrefix={restaurant.name}
                          onImageClick={(index) =>
                            openModal(restaurant.name, restaurant.images, index)
                          }
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between space-y-4">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-2xl font-semibold text-white">
                              {restaurant.name}
                            </h3>
                            {restaurant.address ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-emerald-200">
                                <MapPin className="h-3.5 w-3.5" />
                                {restaurant.address}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 text-sm text-slate-300">
                            {restaurant.description}
                          </p>
                          {restaurant.tags ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {restaurant.tags.map((tag) => (
                                <span
                                  key={`${restaurant.name}-${tag}`}
                                  className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-wide text-emerald-200"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              openModal(restaurant.name, restaurant.images)
                            }
                            className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                          >
                            <Camera className="h-4 w-4" />
                            View dishes
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-slate-100 transition hover:border-emerald-300/60 hover:text-white"
                          >
                            <MapPin className="h-4 w-4" />
                            Reserve table
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptySectionMessage message="Dining recommendations will appear here once restaurants are added for this city." />
                )}
              </div>
            </section>
          ) : null}

          {activeTab === "hotels" ? (
            <section className="mt-16 space-y-12">
              <SectionHeading
                icon={Hotel}
                title="Hotels"
                subtitle="Stay near canals, mangroves, and heritage quarters"
              />
              {hotelCards.length ? (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {hotelCards.map((hotel) => (
                    <div
                      key={hotel.name}
                      className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 shadow-xl shadow-black/40"
                    >
                      <div className="relative h-52 overflow-hidden">
                        {hotel.images.length ? (
                          <>
                            <img
                              src={hotel.images[0]?.src}
                              alt={hotel.images[0]?.alt ?? hotel.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                openModal(hotel.name, hotel.images)
                              }
                              className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-white transition hover:bg-black/80"
                            >
                              <Camera className="h-4 w-4" />
                              Gallery
                            </button>
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-900/60 text-xs text-slate-300">
                            Images coming soon
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-6">
                        <div className="space-y-3">
                          <h3 className="text-xl font-semibold text-white">
                            {hotel.name}
                          </h3>
                          {hotel.address ? (
                            <p className="flex items-center gap-2 text-sm text-blue-200">
                              <MapPin className="h-4 w-4" /> {hotel.address}
                            </p>
                          ) : null}
                          <p className="text-sm text-slate-300">
                            {hotel.description}
                          </p>
                          {hotel.tags ? (
                            <div className="flex flex-wrap gap-2">
                              {hotel.tags.map((tag) => (
                                <span
                                  key={`${hotel.name}-${tag}`}
                                  className="rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-xs uppercase tracking-wide text-violet-200"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
                          >
                            Book stay
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm text-slate-100 transition hover:border-violet-300/60 hover:text-white"
                          >
                            Contact host
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptySectionMessage message="Accommodation options will be listed once hotels are catalogued for this city." />
              )}
            </section>
          ) : null}

          <footer
            id="contact"
            className="mt-16 rounded-3xl border border-white/10 bg-slate-950/70 px-6 py-10 text-sm text-slate-300"
          >
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-blue-300/80">
                  Ready to explore
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  Plan your {displayCityName} adventure today
                </h3>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                <a
                  href="mailto:hello@routingai.travel"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-slate-200 transition hover:border-blue-400/60 hover:text-white"
                >
                  <Navigation className="h-4 w-4" /> hello@routingai.travel
                </a>
                <a
                  href="tel:+959123456789"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-slate-200 transition hover:border-blue-400/60 hover:text-white"
                >
                  <Compass className="h-4 w-4" /> +95 9 123 456 789
                </a>
              </div>
            </div>
            <div className="mt-6 border-t border-white/10 pt-4 text-xs text-slate-500">
              <p>
                © {new Date().getFullYear()} Routing AI. Crafted for the ASEAN
                Digital Awards 2026 showcase.
              </p>
            </div>
          </footer>
        </div>
      </main>

      {modalState.open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-6">
          <div
            className="absolute inset-0"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-6xl rounded-3xl border border-white/10 bg-slate-900/90 p-6 backdrop-blur-lg">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">
                  {modalState.title}
                </h3>
                <p className="text-xs uppercase tracking-[0.3em] text-blue-200">
                  Photo collection
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-white/10 p-2 text-slate-200 transition hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                {activeModalImage ? (
                  <img
                    src={activeModalImage.src}
                    alt={activeModalImage.alt}
                    className="max-h-[480px] w-full object-contain"
                  />
                ) : (
                  <p className="text-sm text-slate-300">No images available.</p>
                )}
              </div>
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-2">
                {modalState.images.length ? (
                  modalState.images.map((image, index) => (
                    <button
                      key={`${modalState.title}-modal-${index}`}
                      type="button"
                      onClick={() => setLightboxIndex(index)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-2 text-left transition ${
                        lightboxIndex === index
                          ? "border-blue-400 bg-blue-500/10"
                          : "border-white/10 bg-white/5 hover:border-blue-300/40"
                      }`}
                    >
                      <span className="h-20 w-28 overflow-hidden rounded-xl">
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="h-full w-full object-cover"
                        />
                      </span>
                      <span className="text-sm text-slate-200">
                        {image.alt}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-300">
                    Once images are added for this location, they will appear
                    here.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
