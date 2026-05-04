"use client";

import { useEffect, useMemo, useState } from "react";
import FilterPanel from "./FilterPanel";
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
    <main className="relative min-h-dvh overflow-x-hidden bg-[#05060a] font-mono text-slate-50 lg:overflow-hidden">
      <ThreatMap attacks={filteredAttacks} />

      <div className="pointer-events-none absolute inset-0 map-vignette" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="pointer-events-none relative z-10 grid min-h-dvh gap-3 p-3 sm:p-4 lg:absolute lg:inset-0 lg:grid-rows-[auto_1fr_auto] lg:gap-4 lg:p-5">
        <header className="grid gap-3 lg:grid-cols-[minmax(260px,380px)_1fr] lg:items-start">
          <RouteCard attack={activeAttack} isLive={isLive} onToggleLive={setIsLive} />
          <StatsBar attacks={filteredAttacks} now={now} totalAttacks={attacks.length} />
        </header>

        <div className="hidden items-start justify-between lg:flex">
          <StatusRail />
          <ThreatSpeedPanel attack={activeAttack} />
        </div>

        <section className="grid gap-3 lg:grid-cols-[minmax(340px,520px)_minmax(340px,420px)] lg:items-end lg:justify-between">
          <FilterPanel
            availableTargets={availableTargets}
            filters={filters}
            onChange={setFilters}
          />
          <Sidebar attacks={filteredAttacks} now={now} />
        </section>
      </div>
    </main>
  );
}

function RouteCard({ attack, isLive, onToggleLive }) {
  const route = attack
    ? `${attack.source.country} / ${attack.target.country}`
    : "Initializing global mesh";

  return (
    <section className="glass-panel pointer-events-auto overflow-hidden">
      <div className="route-card-head">
        <div>
          <p className="eyebrow">Active Attack Route</p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-semibold leading-none text-white">
              {attack ? attack.volume.toLocaleString() : "--"}
            </span>
            <span className="text-sm text-slate-400">events / min</span>
          </div>
        </div>
        <button
          type="button"
          aria-pressed={isLive}
          onClick={() => onToggleLive((current) => !current)}
          className="live-toggle"
        >
          {isLive ? "Live" : "Paused"}
        </button>
      </div>
      <div className="route-strip">
        <span>{route}</span>
        <span>{attack ? attack.type : "Standby"}</span>
        <span>{attack ? attack.severity : "Syncing"}</span>
      </div>
    </section>
  );
}

function StatusRail() {
  const items = ["Map", "Feed", "Filter", "Signal"];

  return (
    <nav className="glass-panel pointer-events-auto flex flex-col gap-2 p-2">
      {items.map((item, index) => (
        <button key={item} type="button" className="rail-button" title={item}>
          {index + 1}
        </button>
      ))}
    </nav>
  );
}

function ThreatSpeedPanel({ attack }) {
  return (
    <aside className="pointer-events-auto grid gap-2 text-right">
      <div className="metric-chip">
        <span className="text-sm text-slate-300">severity</span>
        <strong>{attack?.severity || "--"}</strong>
      </div>
      <div className="metric-chip">
        <span className="text-sm text-slate-300">confidence</span>
        <strong>{attack?.confidence || "--"}%</strong>
      </div>
    </aside>
  );
}
