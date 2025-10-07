import { LoginForm } from "@/components/login-form";

import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngTuple } from "leaflet";

export default function LoginPage() {
  const mapCenter: LatLngTuple = [19.7468086, 96.0675273];
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="bg-white text-primary-foreground flex size-20 items-center justify-center rounded-md">
            <img src="/myanmar_explorer.png" alt="Logo" className="size-16" />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <MapContainer
          center={mapCenter}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution=""
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </MapContainer>
      </div>
    </div>
  );
}
