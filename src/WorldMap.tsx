import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { geoOrthographic, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import type { GeoPermissibleObjects } from "d3-geo";

// Served from public/data — copies of world-atlas's topojson files.
const LAND_URL = "/data/land-110m.json";
const COUNTRIES_URL = "/data/countries-110m.json";

type Place = {
  // Unique per marker (several markers can share a countryId).
  key: string;
  // ISO-3166 numeric country code, matching the topojson feature ids above.
  countryId: string;
  name: string;
  role: string;
  coordinates: [number, number];
  home?: boolean;
};

// A handful of pins per home country (India, USA) instead of just one,
// plus a single pin for each one-trip destination.
const PLACES: Place[] = [
  { key: "us-denver", countryId: "840", name: "Denver, CO", role: "Home base", coordinates: [-104.9903, 39.7392], home: true },
  { key: "us-telluride", countryId: "840", name: "Telluride, CO", role: "Via Ferrata", coordinates: [-107.8123, 37.9375] },
  { key: "us-estes-park", countryId: "840", name: "Estes Park, CO", role: "Seven Keys Inn", coordinates: [-105.5217, 40.3772] },
  { key: "us-havasupai", countryId: "840", name: "Havasupai, AZ", role: "Havasupai Falls", coordinates: [-112.6979, 36.2551] },
  { key: "us-santa-fe", countryId: "840", name: "Santa Fe, NM", role: "Chimayó pilgrimage", coordinates: [-105.9378, 35.687] },
  { key: "us-texas", countryId: "840", name: "Austin, TX", role: "Texas", coordinates: [-97.7431, 30.2672] },
  { key: "us-florida", countryId: "840", name: "Miami, FL", role: "Florida", coordinates: [-80.1918, 25.7617] },
  { key: "us-california", countryId: "840", name: "Los Angeles, CA", role: "California", coordinates: [-118.2437, 34.0522] },
  { key: "us-utah", countryId: "840", name: "Moab, UT", role: "Utah", coordinates: [-109.5498, 38.5733] },

  { key: "in-delhi", countryId: "356", name: "New Delhi", role: "Where I'm from", coordinates: [77.209, 28.6139] },
  { key: "in-hyderabad", countryId: "356", name: "Hyderabad", role: "India", coordinates: [78.4867, 17.385] },
  { key: "in-mumbai", countryId: "356", name: "Mumbai", role: "India", coordinates: [72.8777, 19.076] },
  { key: "in-bengaluru", countryId: "356", name: "Bengaluru", role: "India", coordinates: [77.5946, 12.9716] },

  { key: "nepal", countryId: "524", name: "Nepal", role: "Everest Base Camp", coordinates: [85.324, 27.7172] },
  { key: "bhutan", countryId: "064", name: "Bhutan", role: "Visited", coordinates: [89.6339, 27.4712] },
  { key: "indonesia", countryId: "360", name: "Indonesia", role: "Bali", coordinates: [115.1889, -8.4095] },
];

const VISITED_IDS = new Set(PLACES.map((place) => place.countryId));
const SIZE = 800;

type Rotation = [number, number, number];

// Plain module-level helpers (not components/hooks) so reading the clock
// isn't flagged as an impure render — they only ever run from inside
// event handlers, but the lint rule can't see that through an inline
// arrow-wrapped handler.
function now() {
  return performance.now();
}

function markNow(ref: { current: number }) {
  ref.current = now();
}

// Whether a [lon, lat] point sits on the hemisphere currently facing the
// camera, given the globe's current rotation — standard great-circle
// visibility test (angular distance from the view center under 90deg).
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

type LoadedGeo = {
  land: GeoPermissibleObjects;
  countries: { id: string; feature: GeoPermissibleObjects }[];
};

export function WorldMap() {
  const [geo, setGeo] = useState<LoadedGeo | null>(null);
  const [paused, setPaused] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  const svgWrapRef = useRef<HTMLDivElement>(null);
  const landRef = useRef<SVGPathElement>(null);
  const graticuleRef = useRef<SVGPathElement>(null);
  const countryRefs = useRef(new Map<string, SVGPathElement>());
  const markerRefs = useRef(new Map<string, SVGGElement>());
  const tagRef = useRef<SVGGElement>(null);
  const tagNameRef = useRef<SVGTextElement>(null);
  const tagRoleRef = useRef<SVGTextElement>(null);

  // Mutable, imperative animation state — deliberately NOT React state, so
  // the rotation loop never triggers a re-render. Only the initial data
  // load goes through setState.
  const rotationRef = useRef<Rotation>([45, -22, 0]);
  const flyToRef = useRef<{ from: Rotation; to: Rotation; start: number } | null>(null);
  const draggingRef = useRef(false);
  const draggedRef = useRef(false);
  const hoveredIdRef = useRef<string | null>(null);
  const lastPointRef = useRef({ x: 0, y: 0 });
  const idleSinceRef = useRef(0);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Built once, from local variables only (never reading another ref's
  // `.current`) — reading a ref during the render of another ref's
  // initializer is what the render-purity lint rule objects to.
  const geoToolsRef = useRef(
    (() => {
      const projection = geoOrthographic()
        .translate([SIZE / 2, SIZE / 2])
        .scale(SIZE / 2 - 12)
        .clipAngle(90)
        .precision(0.3);
      return { projection, path: geoPath(projection), graticule: geoGraticule10() };
    })()
  );

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch(LAND_URL).then((res) => res.json()),
      fetch(COUNTRIES_URL).then((res) => res.json()),
    ]).then(([landTopo, countriesTopo]) => {
      if (cancelled) return;

      const landObject = landTopo.objects.land;
      const land = feature(landTopo, landObject) as unknown as GeoPermissibleObjects;

      const countriesObject = countriesTopo.objects.countries;
      const collection = feature(countriesTopo, countriesObject) as unknown as {
        features: { id: string; type: string }[];
      };

      const countries = collection.features
        .filter((f) => VISITED_IDS.has(f.id as string))
        .map((f) => ({ id: f.id as string, feature: f as unknown as GeoPermissibleObjects }));

      setGeo({ land, countries });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // The main draw step: re-project every visible shape from the current
  // rotation and paint it straight onto the DOM via refs, bypassing React
  // entirely so a 60fps loop never triggers reconciliation.
  useEffect(() => {
    if (!geo) return;

    let raf = 0;
    let last = performance.now();
    // Only spend CPU on the loop while the globe is actually on screen
    // and the tab is in the foreground.
    let onScreen = false;

    const wrap = svgWrapRef.current;
    const observer = wrap
      ? new IntersectionObserver(([entry]) => {
          onScreen = entry.isIntersecting;
        })
      : null;
    if (wrap && observer) observer.observe(wrap);

    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const draw = () => {
      const { projection, path, graticule } = geoToolsRef.current;
      const rotation = rotationRef.current;
      projection.rotate(rotation);

      if (landRef.current) landRef.current.setAttribute("d", path(geo.land) ?? "");
      if (graticuleRef.current) {
        graticuleRef.current.setAttribute("d", path(graticule) ?? "");
      }

      for (const { id, feature: countryFeature } of geo.countries) {
        const el = countryRefs.current.get(id);
        if (el) el.setAttribute("d", path(countryFeature) ?? "");
      }

      for (const place of PLACES) {
        const el = markerRefs.current.get(place.key);
        if (!el) continue;
        const projected = projection(place.coordinates);
        const visible = isFacingCamera(place.coordinates, rotation);
        el.style.display = visible ? "" : "none";
        if (projected) el.setAttribute("transform", `translate(${projected[0]}, ${projected[1]})`);
      }

      if (hoveredIdRef.current) {
        const el = markerRefs.current.get(hoveredIdRef.current);
        if (el && tagRef.current) {
          tagRef.current.setAttribute("transform", el.getAttribute("transform") ?? "");
        }
      }
    };

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      if (!onScreen || document.hidden) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const flight = flyToRef.current;
      if (flight) {
        const elapsed = now - flight.start;
        const t = Math.min(1, elapsed / 650);
        const eased = easeOutCubic(t);
        rotationRef.current = [
          flight.from[0] + (flight.to[0] - flight.from[0]) * eased,
          flight.from[1] + (flight.to[1] - flight.from[1]) * eased,
          0,
        ];
        if (t >= 1) flyToRef.current = null;
      } else if (
        !draggingRef.current &&
        !hoveredIdRef.current &&
        !pausedRef.current &&
        now - idleSinceRef.current > 900
      ) {
        const [lambda, phi, gamma] = rotationRef.current;
        rotationRef.current = [lambda + dt * 0.012, phi, gamma];
      }

      draw();
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [geo]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    draggedRef.current = false;
    flyToRef.current = null;
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
    rotationRef.current = [lambda + dx * 0.35, nextPhi, gamma];
  };

  const endDrag = () => {
    draggingRef.current = false;
    markNow(idleSinceRef);
  };

  const handleMarkerEnter = (id: string) => {
    hoveredIdRef.current = id;
    markerRefs.current.get(id)?.classList.add("world-marker-group-hovered");
    const place = PLACES.find((p) => p.key === id);
    if (place && tagNameRef.current && tagRoleRef.current && tagRef.current) {
      tagNameRef.current.textContent = place.name;
      tagRoleRef.current.textContent = place.role;
      tagRef.current.style.display = "";
    }
  };

  const handleMarkerLeave = (id: string) => {
    markerRefs.current.get(id)?.classList.remove("world-marker-group-hovered");
    if (hoveredIdRef.current !== id) return;
    hoveredIdRef.current = null;
    if (tagRef.current) tagRef.current.style.display = "none";
  };

  const handleMarkerClick = (place: Place) => {
    if (draggedRef.current) return;
    flyToRef.current = {
      from: rotationRef.current,
      to: [-place.coordinates[0], -place.coordinates[1], 0],
      start: now(),
    };
    markNow(idleSinceRef);
    // Touch has no hover — show the label on tap too, not just on hover.
    handleMarkerEnter(place.key);
  };

  const handleMarkerKeyDown = (event: ReactKeyboardEvent<SVGGElement>, place: Place) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleMarkerClick(place);
    }
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
        ref={svgWrapRef}
        className="world-globe"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <div className="world-globe-glow" />

        <svg viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <path ref={landRef} className="world-country" />
          <path ref={graticuleRef} className="world-graticule" />

          {geo?.countries.map(({ id }) => (
            <path
              key={id}
              ref={(el) => {
                if (el) countryRefs.current.set(id, el);
              }}
              className="world-country-visited"
            />
          ))}

          {PLACES.map((place) => (
            <g
              key={place.key}
              ref={(el) => {
                if (el) markerRefs.current.set(place.key, el);
              }}
              className="world-marker-group"
              role="button"
              tabIndex={0}
              aria-label={`${place.name} — ${place.role}`}
              onPointerEnter={() => handleMarkerEnter(place.key)}
              onPointerLeave={() => handleMarkerLeave(place.key)}
              onFocus={() => handleMarkerEnter(place.key)}
              onBlur={() => handleMarkerLeave(place.key)}
              onClick={() => handleMarkerClick(place)}
              onKeyDown={(event) => handleMarkerKeyDown(event, place)}
            >
              {/* Larger invisible hit area — the visible dot alone is well
                  under the ~24px minimum touch/click target. */}
              <circle r={13} className="world-marker-hit" />
              <circle
                r={place.home ? 7 : 5}
                className={`world-marker${place.home ? " world-marker-home" : ""}`}
              />
            </g>
          ))}

          <g ref={tagRef} className="world-marker-tag" style={{ display: "none" }}>
            <text ref={tagNameRef} textAnchor="middle" y={-16} className="world-marker-tag-name" />
            <text ref={tagRoleRef} textAnchor="middle" y={-3} className="world-marker-tag-role" />
          </g>
        </svg>

        <button
          type="button"
          className="world-globe-toggle"
          onClick={() => setPaused((current) => !current)}
          aria-pressed={!paused}
        >
          {paused ? "PLAY" : "PAUSE"}
        </button>
      </div>
    </section>
  );
}
