"use client";

import { useEffect, useMemo, useState } from "react";
import FilterPanel from "./FilterPanel";
import InteractionPanel from "./InteractionPanel";
import ThreatMap from "./Map";
import Sidebar from "./Sidebar";
import StatsBar from "./StatsBar";
import { createAttackEvent, seedAttacks } from "../data/attacks";

const INITIAL_FILTERS = {
  type: "All",
  severity: "All",
  target: "All",
};

function getTargets(attacks) {
  return Array.from(new Set(attacks.map((attack) => attack.target.country))).sort();
}

export default function ThreatDashboard() {
  const [attacks, setAttacks] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [isLive, setIsLive] = useState(true);
  const [now, setNow] = useState(0);
  const [isMapInfoOpen, setIsMapInfoOpen] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setAttacks(seedAttacks(42)), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const updateClock = () => setNow(Date.now());
    const timeoutId = window.setTimeout(updateClock, 0);
    const intervalId = window.setInterval(updateClock, 1000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!isLive) return undefined;

    let timeoutId;

    const scheduleNextAttack = () => {
      timeoutId = window.setTimeout(
        () => {
          setAttacks((previous) => {
            const next = [createAttackEvent(), ...previous];
            return next.slice(0, 220);
          });
          scheduleNextAttack();
        },
        1900 + Math.floor(Math.random() * 1300)
      );
    };

    scheduleNextAttack();

    return () => window.clearTimeout(timeoutId);
  }, [isLive]);

  const availableTargets = useMemo(() => getTargets(attacks), [attacks]);

  const filteredAttacks = useMemo(() => {
    return attacks.filter((attack) => {
      if (filters.type !== "All" && attack.type !== filters.type) return false;
      if (filters.severity !== "All" && attack.severity !== filters.severity) {
        return false;
      }
      if (filters.target !== "All" && attack.target.country !== filters.target) {
        return false;
      }
      return true;
    });
  }, [attacks, filters]);

  const activeAttack = filteredAttacks[0] || attacks[0];

  return (
    <main className="min-h-dvh bg-black text-slate-50">
      <div className="grid min-h-dvh lg:grid-cols-[minmax(360px,460px)_1fr]">
        <InteractionPanel
          activeAttack={activeAttack}
          allAttacks={attacks}
          availableTargets={availableTargets}
          filters={filters}
          isLive={isLive}
          onOpenMapInfo={() => setIsMapInfoOpen(true)}
          onResetFilters={() => setFilters(INITIAL_FILTERS)}
          onSetFilters={setFilters}
          onToggleLive={setIsLive}
          visibleAttacks={filteredAttacks}
        />

        <section className="map-workspace">
          <div className="map-stage">
            <ThreatMap attacks={filteredAttacks} />
            <div className="pointer-events-none absolute inset-0 map-vignette" />

            <MapCommandBar
              activeAttack={activeAttack}
              isLive={isLive}
              isMapInfoOpen={isMapInfoOpen}
              onToggleLive={setIsLive}
              onToggleMapInfo={() => setIsMapInfoOpen((current) => !current)}
            />

            {isMapInfoOpen ? (
              <MapInfoDock
                attacks={filteredAttacks}
                availableTargets={availableTargets}
                filters={filters}
                now={now}
                onChangeFilters={setFilters}
                onClose={() => setIsMapInfoOpen(false)}
                totalAttacks={attacks.length}
              />
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function MapCommandBar({
  activeAttack,
  isLive,
  isMapInfoOpen,
  onToggleLive,
  onToggleMapInfo,
}) {
  return (
    <div className="map-command-bar">
      <div className="map-route-summary">
        <p className="eyebrow">Active Route</p>
        <p className="mt-1 truncate text-sm font-semibold text-white">
          {activeAttack
            ? `${activeAttack.source.country} / ${activeAttack.target.country}`
            : "Waiting for signal"}
        </p>
        <p className="mt-0.5 text-xs text-slate-300 font-mono font-medium">
          {activeAttack
            ? `${activeAttack.type} | ${activeAttack.severity} | ${activeAttack.volume} events/min`
            : "Live feed initializing"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-pressed={isLive}
          onClick={() => onToggleLive((current) => !current)}
          className="live-toggle"
        >
          {isLive ? "Live" : "Paused"}
        </button>
        <button
          type="button"
          aria-expanded={isMapInfoOpen}
          onClick={onToggleMapInfo}
          className="map-menu-button"
        >
          {isMapInfoOpen ? "Hide Info" : "Map Info"}
        </button>
      </div>
    </div>
  );
}

function MapInfoDock({
  attacks,
  availableTargets,
  filters,
  now,
  onChangeFilters,
  onClose,
  totalAttacks,
}) {
  return (
    <aside className="map-info-dock">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Visualization Controls</p>
          <p className="mt-1 text-sm text-slate-300">Filters, feed, and rankings</p>
        </div>
        <button type="button" onClick={onClose} className="map-close-button">
          Close
        </button>
      </div>

      <div className="grid gap-3">
        <StatsBar attacks={attacks} compact now={now} totalAttacks={totalAttacks} />
        <FilterPanel
          availableTargets={availableTargets}
          filters={filters}
          onChange={onChangeFilters}
        />
        <Sidebar attacks={attacks} now={now} />
      </div>
    </aside>
  );
}
