"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArcLayer, ScatterplotLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import mapboxgl from "mapbox-gl";
import { ATTACK_COLORS } from "../data/attacks";
import { MAP_STYLE, getMapboxToken } from "../lib/mapbox";

export default function ThreatMap({ attacks }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const overlayRef = useRef(null);
  const [clock, setClock] = useState(0);

  const points = useMemo(() => {
    return attacks.flatMap((attack) => [
      {
        id: `${attack.id}-src`,
        position: attack.source.coordinates,
        severity: attack.severity,
        timestamp: attack.timestamp,
        type: attack.type,
      },
      {
        id: `${attack.id}-target`,
        position: attack.target.coordinates,
        severity: attack.severity,
        timestamp: attack.timestamp,
        type: attack.type,
      },
    ]);
  }, [attacks]);

  const packetPoints = useMemo(() => {
    return attacks.slice(0, 80).map((attack) => {
      const progress = ((clock - attack.timestamp) % 4200) / 4200;
      const eased = 1 - Math.pow(1 - progress, 2);
      const [sourceLng, sourceLat] = attack.source.coordinates;
      const [targetLng, targetLat] = attack.target.coordinates;

      return {
        id: `${attack.id}-packet`,
        position: [
          sourceLng + (targetLng - sourceLng) * eased,
          sourceLat + (targetLat - sourceLat) * eased,
        ],
        severity: attack.severity,
        type: attack.type,
      };
    });
  }, [attacks, clock]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setClock(Date.now()), 180);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const token = getMapboxToken();
    if (!mapContainerRef.current || mapRef.current || !token) return;

    mapboxgl.accessToken = token;
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      projection: "globe",
      center: [8, 20],
      zoom: 1.45,
      pitch: 42,
      bearing: -12,
      antialias: true,
      attributionControl: false,
    });

    mapRef.current.on("style.load", () => {
      mapRef.current.setFog({
        color: "rgb(0, 0, 0)",
        "high-color": "rgb(15, 15, 15)",
        "horizon-blend": 0.18,
      });
    });

    overlayRef.current = new MapboxOverlay({ interleaved: false, layers: [] });
    mapRef.current.addControl(overlayRef.current);

    return () => {
      overlayRef.current?.finalize();
      mapRef.current?.remove();
      overlayRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!overlayRef.current) return;

    const arcLayer = new ArcLayer({
      id: "threat-arcs",
      data: attacks.slice(0, 120),
      getSourcePosition: (d) => d.source.coordinates,
      getTargetPosition: (d) => d.target.coordinates,
      getSourceColor: (d) => fadedColor(d, clock),
      getTargetColor: (d) => fadedColor(d, clock),
      getWidth: (d) => Math.max(1.5, d.volume / 45),
      greatCircle: true,
      opacity: 0.92,
      parameters: { depthTest: false },
      pickable: true,
    });

    const pulseLayer = new ScatterplotLayer({
      id: "threat-points",
      data: points,
      getFillColor: (d) => ATTACK_COLORS[d.type] || [255, 255, 255, 220],
      getLineColor: [255, 255, 255, 230],
      getPosition: (d) => d.position,
      getRadius: (d) => (d.severity === "Critical" ? 76000 : 52000),
      lineWidthMinPixels: 1.25,
      opacity: 0.8,
      parameters: { depthTest: false },
      radiusMaxPixels: 13,
      radiusMinPixels: 3,
      stroked: true,
    });

    const packetLayer = new ScatterplotLayer({
      id: "threat-packets",
      data: packetPoints,
      getFillColor: (d) => ATTACK_COLORS[d.type] || [255, 255, 255, 240],
      getLineColor: [255, 255, 255, 240],
      getPosition: (d) => d.position,
      getRadius: (d) => (d.severity === "Critical" ? 105000 : 76000),
      lineWidthMinPixels: 1,
      opacity: 0.95,
      parameters: { depthTest: false },
      radiusMaxPixels: 9,
      radiusMinPixels: 4,
      stroked: true,
    });

    overlayRef.current.setProps({
      layers: [arcLayer, pulseLayer, packetLayer],
    });
  }, [attacks, clock, packetPoints, points]);

  if (!getMapboxToken()) {
    return (
      <div className="map-fallback absolute inset-0">
        <div className="fallback-grid" />
        <div className="glass-panel hidden max-w-sm p-5 text-center sm:block">
          <p className="eyebrow">Mapbox Token Required</p>
          <p className="mt-3 text-sm leading-6 text-slate-200">
            Add <span className="text-white font-bold">NEXT_PUBLIC_MAPBOX_TOKEN</span>{" "}
            in <span className="text-white font-bold">.env.local</span> to render the
            live globe. The simulation dashboard is ready.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}

function fadedColor(attack, clock) {
  const color = ATTACK_COLORS[attack.type] || [255, 255, 255, 210];
  const age = Math.max(0, clock - attack.timestamp);
  const fade = Math.max(0.2, 1 - age / 45000);

  return [color[0], color[1], color[2], Math.round(color[3] * fade)];
}
