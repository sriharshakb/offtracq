import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { ComposableMap, Geographies, Geography, Graticule, Marker } from "react-simple-maps";

// Served from public/data — a copy of world-atlas's countries-110m.json.
const GEO_URL = "/data/countries-110m.json";

type Place = {
  // ISO-3166 numeric country code, matching the topojson feature ids above.
  id: string;
  name: string;
  role: string;
  coordinates: [number, number];
};

const HOME_ID = "840";

const PLACES: Place[] = [
  { id: "840", name: "United States", role: "Home base", coordinates: [-104.9903, 39.7392] },
  { id: "356", name: "India", role: "Where I'm from", coordinates: [77.209, 28.6139] },
  { id: "524", name: "Nepal", role: "Everest Base Camp", coordinates: [85.324, 27.7172] },
  { id: "064", name: "Bhutan", role: "Visited", coordinates: [89.6339, 27.4712] },
  { id: "360", name: "Indonesia", role: "Bali", coordinates: [115.1889, -8.4095] },
];

const VISITED_IDS = new Set(PLACES.map((place) => place.id));

type Rotation = [number, number, number];

// Whether a [lon, lat] point sits on the hemisphere currently facing the
// camera, given the globe's current rotation — standard great-circle
// visibility test (angular distance from the view center under 90deg).
// Plain module-level helper (not a component/hook) so reading the clock
// here isn't flagged as an impure render — it only ever runs from inside
// event handlers.
function markNow(ref: { current: number }) {
  ref.current = performance.now();
}

function isFacingCamera([lon, lat]: [number, number], rotation: Rotation) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lon0 = toRad(-rotation[0]);
  const lat0 = toRad(-rotation[1]);
  const lonR = toRad(lon);
  const latR = toRad(lat);
  const cosC =
    Math.sin(lat0) * Math.sin(latR) + Math.cos(lat0) * Math.cos(latR) * Math.cos(lonR - lon0);
  return cosC > 0.02;
}

export function WorldMap() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [rotation, setRotation] = useState<Rotation>([45, -22, 0]);

  const draggingRef = useRef(false);
  const draggedRef = useRef(false);
  const hoveredRef = useRef<string | null>(null);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const idleSinceRef = useRef(0);
  const rotationRef = useRef(rotation);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    hoveredRef.current = hoveredId;
  }, [hoveredId]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      if (!draggingRef.current && !hoveredRef.current && now - idleSinceRef.current > 900) {
        const [lambda, phi, gamma] = rotationRef.current;
        setRotation([lambda + dt * 0.012, phi, gamma]);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    draggedRef.current = false;
    lastPointRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = event.clientX - lastPointRef.current.x;
    const dy = event.clientY - lastPointRef.current.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) draggedRef.current = true;
    lastPointRef.current = { x: event.clientX, y: event.clientY };

    const [lambda, phi, gamma] = rotationRef.current;
    const nextPhi = Math.max(-85, Math.min(85, phi - dy * 0.35));
    setRotation([lambda + dx * 0.35, nextPhi, gamma]);
  };

  const endDrag = () => {
    draggingRef.current = false;
    markNow(idleSinceRef);
  };

  const handleMarkerClick = (place: Place) => {
    // A click that ended a drag shouldn't also re-center the globe.
    if (draggedRef.current) return;
    setRotation([-place.coordinates[0], -place.coordinates[1], 0]);
    markNow(idleSinceRef);
  };

  return (
    <section className="journey-section" id="journey">
      <div className="journey-header">
        <p className="section-kicker">THE ROUTE SO FAR</p>
        <h2>
          A FEW STAMPS IN.
          <br />
          <span>SO MUCH LEFT TO GO.</span>
        </h2>
        <p className="journey-intro">
          Home base in the U.S., roots in India, and a handful of stops
          in between — Nepal, Bhutan, Bali. Barely scratching the
          surface of what's still out there. Drag the globe to look
          around.
        </p>
      </div>

      <div
        className="world-globe"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <div className="world-globe-glow" />

        <ComposableMap
          projection="geoOrthographic"
          projectionConfig={{ scale: 210, rotate: rotation }}
          width={800}
          height={800}
        >
          <Graticule stroke="rgba(245, 245, 245, 0.08)" />

          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const visited = VISITED_IDS.has(geo.id as string);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    className={`world-country${visited ? " world-country-visited" : ""}`}
                  />
                );
              })
            }
          </Geographies>

          {PLACES.filter((place) => isFacingCamera(place.coordinates, rotation)).map((place) => (
            <Marker
              key={place.id}
              coordinates={place.coordinates}
              onPointerEnter={() => setHoveredId(place.id)}
              onPointerLeave={() => setHoveredId((current) => (current === place.id ? null : current))}
              onClick={() => handleMarkerClick(place)}
            >
              <circle
                r={place.id === HOME_ID ? 6 : 5}
                className={`world-marker${place.id === HOME_ID ? " world-marker-home" : ""}${
                  hoveredId === place.id ? " world-marker-active" : ""
                }`}
              />

              {hoveredId === place.id && (
                <g className="world-marker-tag" transform="translate(0, -14)">
                  <text textAnchor="middle" y={0} className="world-marker-tag-name">
                    {place.name}
                  </text>
                  <text textAnchor="middle" y={13} className="world-marker-tag-role">
                    {place.role}
                  </text>
                </g>
              )}
            </Marker>
          ))}
        </ComposableMap>
      </div>
    </section>
  );
}
