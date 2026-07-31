import { useGeolocation } from "@/hooks/useGeolocation";
import { useLanguage } from "@/context/LanguageContext";
import { MapPin, Navigation, AlertCircle, Loader2, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationTrackerProps {
  /** If true, auto-request location on mount */
  autoRequest?: boolean;
  /** Callback when location is obtained */
  onLocation?: (lat: number, lng: number) => void;
  /** Whether to show the embedded map */
  showMap?: boolean;
}

const LocationTracker = ({ autoRequest = false, onLocation, showMap = true }: LocationTrackerProps) => {
  const { t } = useLanguage();
  const { lat, lng, accuracy, error, loading, tracking, getLocation, startTracking, stopTracking } = useGeolocation();

  // Notify parent when location changes
  if (lat !== null && lng !== null && onLocation) {
    onLocation(lat, lng);
  }

  // Auto-request on mount if enabled
  if (autoRequest && lat === null && !loading && !error) {
    getLocation();
  }

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  return (
    <div className="rounded-xl border bg-card p-5 card-shadow space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${lat ? "bg-primary/10" : "bg-muted"}`}>
          <MapPin className={`h-5 w-5 ${lat ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div>
          <p className="font-semibold text-foreground text-sm">{t("location_status")}</p>
          <p className={`text-xs font-medium ${lat ? "text-primary" : "text-muted-foreground"}`}>
            {lat ? t("location_enabled") : t("location_disabled")}
          </p>
        </div>
        {tracking && (
          <span className="ml-auto flex items-center gap-1 text-xs text-primary animate-pulse">
            <Navigation className="h-3 w-3" /> Live
          </span>
        )}
      </div>

      {/* Coordinates */}
      {lat !== null && lng !== null && (
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 text-xs">
          <div>
            <p className="text-muted-foreground">{t("latitude")}</p>
            <p className="font-mono font-semibold text-foreground">{lat.toFixed(6)}°</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("longitude")}</p>
            <p className="font-mono font-semibold text-foreground">{lng.toFixed(6)}°</p>
          </div>
          {accuracy && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Accuracy</p>
              <p className="font-mono font-semibold text-foreground">±{Math.round(accuracy)}m</p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Not tracked yet */}
      {!lat && !error && !loading && (
        <p className="text-xs text-muted-foreground">{t("location_not_tracked")}</p>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={tracking ? "outline" : "hero"}
          onClick={tracking ? stopTracking : startTracking}
          disabled={loading}
          className="text-xs"
        >
          {loading ? (
            <><Loader2 className="h-3 w-3 mr-1 animate-spin" />{t("requesting_location")}</>
          ) : tracking ? (
            <><StopCircle className="h-3 w-3 mr-1" />{t("stop_tracking")}</>
          ) : (
            <><Navigation className="h-3 w-3 mr-1" />{t("track_location")}</>
          )}
        </Button>
        {!tracking && (
          <Button size="sm" variant="outline" onClick={getLocation} disabled={loading} className="text-xs">
            <MapPin className="h-3 w-3 mr-1" /> {t("current_location")}
          </Button>
        )}
      </div>

      {/* Google Maps Embed */}
      {showMap && lat !== null && lng !== null && (
        <div className="rounded-lg overflow-hidden border h-48 mt-1">
          {mapsApiKey ? (
            <iframe
              title="Current Location Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps/embed/v1/place?key=${mapsApiKey}&q=${lat},${lng}&zoom=15`}
            />
          ) : (
            /* Fallback: OpenStreetMap (no API key needed) */
            <iframe
              title="Current Location Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default LocationTracker;
