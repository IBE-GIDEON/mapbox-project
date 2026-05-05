"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const SUGGESTIONS = [
  "What is happening now?",
  "Who is attacking most?",
  "Top targeted countries",
  "Critical threats only",
  "What is targeting Nigeria?",
  "Show DDoS activity",
  "Summarize active route",
  "Open map info",
];

export default function InteractionPanel({
  activeAttack,
  allAttacks,
  availableTargets,
  filters,
  isLive,
  onOpenMapInfo,
  onResetFilters,
  onSetFilters,
  onToggleLive,
  visibleAttacks,
}) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const answerPanelRef = useRef(null);

  const liveSummary = useMemo(
    () => getLiveSummary(activeAttack, visibleAttacks, allAttacks),
    [activeAttack, allAttacks, visibleAttacks]
  );

  useEffect(() => {
    const panel = answerPanelRef.current;
    if (!panel) return;

    panel.scrollTo({ top: panel.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function submitPrompt(value = prompt) {
    const cleanValue = value.trim();
    if (!cleanValue) return;

    const result = answerPrompt({
      activeAttack,
      allAttacks,
      availableTargets,
      filters,
      prompt: cleanValue,
      visibleAttacks,
    });

    if (result.nextFilters) {
      onSetFilters(result.nextFilters);
    }

    if (result.action === "open-info") {
      onOpenMapInfo();
    }

    if (result.action === "reset") {
      onResetFilters();
    }

    setMessages((current) => [
      ...current.slice(-5),
      { role: "user", text: cleanValue },
      { role: "assistant", text: result.reply },
    ]);
    setPrompt("");
  }

  return (
    <aside className={`chat-surface${messages.length ? " has-messages" : ""}`}>
      <div className="ai-orb" />

      <header className="ai-hero">
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow">Threat Analyst</p>
          <button
            type="button"
            aria-pressed={isLive}
            onClick={() => onToggleLive((current) => !current)}
            className="live-toggle"
          >
            {isLive ? "Live" : "Paused"}
          </button>
        </div>
      </header>

      <section ref={answerPanelRef} className="ai-answer-panel" aria-label="Threat analyst answers">
        {messages.length === 0 ? (
          <div className="answer-card live">
            <span className="message-label">Live map read</span>
            <p>{liveSummary}</p>
          </div>
        ) : null}

        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`answer-card ${message.role}`}>
            <span className="message-label">
              {message.role === "assistant" ? "Answer" : "Question"}
            </span>
            <p>{message.text}</p>
          </div>
        ))}
      </section>

      <div className="chat-input-dock">
        <form
        className="ai-composer"
        onSubmit={(event) => {
          event.preventDefault();
          submitPrompt();
        }}
      >
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="ai-input"
          placeholder="Message AI chat..."
          rows={4}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submitPrompt();
            }
          }}
        />

        <div className="composer-actions">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="tool-pill compact" aria-label="Attach data">
              +
            </button>
            <button type="button" onClick={() => submitPrompt("Search active threats")} className="tool-pill">
              Search
            </button>
            <button type="button" onClick={onOpenMapInfo} className="tool-pill">
              Map info
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleLive((current) => !current)}
              className="tool-pill compact"
              aria-label={isLive ? "Pause live feed" : "Resume live feed"}
            >
              {isLive ? "||" : ">"}
            </button>
            <button type="submit" className="send-button" aria-label="Send analyst command">
              ↑
            </button>
          </div>
        </div>
        </form>

        {messages.length === 0 ? (
          <div className="suggestion-cloud">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => submitPrompt(suggestion)}
                className="suggestion-pill"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}

        <footer className="chat-footer font-mono font-medium">
          <span>{visibleAttacks.length.toLocaleString()} visible</span>
          <span>{allAttacks.length.toLocaleString()} tracked</span>
          <span>{filters.target === "All" ? "Global" : filters.target}</span>
        </footer>
      </div>
    </aside>
  );
}

function answerPrompt({
  activeAttack,
  allAttacks,
  availableTargets,
  filters,
  prompt,
  visibleAttacks,
}) {
  const lower = prompt.toLowerCase();

  if (lower.includes("open") && (lower.includes("info") || lower.includes("panel"))) {
    return {
      action: "open-info",
      reply: "Opened the map info panel with the live feed, leaderboards, and filters.",
    };
  }

  if (lower.includes("reset") || lower.includes("clear filters")) {
    return {
      action: "reset",
      reply: "Resetting to the full global view across all attack types, severities, and targets.",
    };
  }

  const nextFilters = deriveFiltersFromPrompt(lower, filters, availableTargets);
  const changed = Object.keys(nextFilters).some((key) => nextFilters[key] !== filters[key]);

  if (changed && isFilterCommand(lower)) {
    return {
      nextFilters,
      reply: `Focused the visualization on ${nextFilters.type}, ${nextFilters.severity}, ${nextFilters.target}. The map and feed now reflect that slice.`,
    };
  }

  const scopedAttacks = getQuestionScope(lower, allAttacks, visibleAttacks, availableTargets);
  const mentionedCountry = findCountry(lower, availableTargets);

  if (mentionedCountry && isQuestion(lower)) {
    return {
      reply: summarizeCountry(mentionedCountry, scopedAttacks),
    };
  }

  if (asksForTopAttacker(lower)) {
    const top = topCountries(scopedAttacks, "source", 5);
    return { reply: `Top attacking countries right now: ${formatRanking(top)}.` };
  }

  if (asksForTopTarget(lower)) {
    const top = topCountries(scopedAttacks, "target", 5);
    return { reply: `Top targeted countries right now: ${formatRanking(top)}.` };
  }

  if (lower.includes("critical")) {
    const critical = scopedAttacks.filter((attack) => attack.severity === "Critical");
    return {
      reply: `${critical.length} critical attacks are visible. ${summarizeTypes(critical)} ${summarizeTargets(critical)}`,
    };
  }

  if (lower.includes("active route") || lower.includes("current route")) {
    return { reply: summarizeActiveRoute(activeAttack) };
  }

  if (
    lower.includes("type") ||
    lower.includes("vector") ||
    lower.includes("attack") ||
    lower.includes("threat")
  ) {
    return { reply: summarizeTypes(scopedAttacks) };
  }

  if (lower.includes("happening") || lower.includes("summary") || lower.includes("now")) {
    return {
      reply: `${scopedAttacks.length} attacks are in the current analysis scope. ${summarizeTypes(scopedAttacks)} ${summarizeTargets(scopedAttacks)} ${summarizeActiveRoute(activeAttack)}`,
    };
  }

  return {
    reply:
      "I can answer from the live visualization. Ask about top attackers, top targets, critical threats, attack types, a target country, or the active route.",
  };
}

function deriveFiltersFromPrompt(lower, filters, availableTargets) {
  const nextFilters = { ...filters };

  if (lower.includes("critical")) nextFilters.severity = "Critical";
  if (lower.includes("medium")) nextFilters.severity = "Medium";
  if (lower.includes("low")) nextFilters.severity = "Low";
  if (lower.includes("ddos")) nextFilters.type = "DDoS";
  if (lower.includes("malware")) nextFilters.type = "Malware";
  if (lower.includes("phishing")) nextFilters.type = "Phishing";
  if (lower.includes("ransomware")) nextFilters.type = "Ransomware";

  const target = findCountry(lower, availableTargets);
  if (target) nextFilters.target = target;

  return nextFilters;
}

function getQuestionScope(lower, allAttacks, visibleAttacks, availableTargets) {
  const country = findCountry(lower, availableTargets);
  const base = visibleAttacks.length ? visibleAttacks : allAttacks;

  if (!country) return base;

  return allAttacks.filter(
    (attack) => attack.target.country === country || attack.source.country === country
  );
}

function findCountry(lower, availableTargets) {
  if (lower.includes("usa") || lower.includes("united states")) return "United States";
  if (lower.includes("uk") || lower.includes("united kingdom")) return "United Kingdom";
  if (lower.includes("uae")) return "UAE";

  return availableTargets.find((country) => lower.includes(country.toLowerCase()));
}

function isFilterCommand(lower) {
  return (
    lower.includes("show") ||
    lower.includes("focus") ||
    lower.includes("filter") ||
    lower.startsWith("target ") ||
    lower.includes("only")
  );
}

function isQuestion(lower) {
  return (
    lower.includes("?") ||
    lower.startsWith("what") ||
    lower.startsWith("who") ||
    lower.startsWith("which") ||
    lower.startsWith("how") ||
    lower.includes("targeting")
  );
}

function asksForTopAttacker(lower) {
  return (
    lower.includes("top attacker") ||
    lower.includes("attacking most") ||
    lower.includes("source") ||
    lower.includes("origin")
  );
}

function asksForTopTarget(lower) {
  return (
    lower.includes("top target") ||
    lower.includes("targeted") ||
    lower.includes("targets") ||
    lower.includes("victim")
  );
}

function topCountries(attacks, side, limit = 3) {
  const counts = attacks.reduce((acc, attack) => {
    const country = attack[side].country;
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function summarizeTypes(attacks) {
  if (!attacks.length) return "There are no attacks matching that scope.";

  const top = countBy(attacks, (attack) => attack.type).slice(0, 3);
  return `The dominant attack vectors are ${formatRanking(top)}.`;
}

function summarizeTargets(attacks) {
  if (!attacks.length) return "";

  const top = topCountries(attacks, "target", 3);
  return `Most affected targets are ${formatRanking(top)}.`;
}

function summarizeCountry(country, attacks) {
  if (!attacks.length) {
    return `${country} has no visible matching activity in the current attack stream.`;
  }

  const incoming = attacks.filter((attack) => attack.target.country === country);
  const outgoing = attacks.filter((attack) => attack.source.country === country);
  const sources = topCountries(incoming, "source", 3);
  const targets = topCountries(outgoing, "target", 3);

  return `${country} appears in ${attacks.length} current events: ${incoming.length} incoming and ${outgoing.length} outgoing. Incoming sources: ${formatRanking(sources)}. Outgoing targets: ${formatRanking(targets)}. ${summarizeTypes(attacks)}`;
}

function summarizeActiveRoute(activeAttack) {
  if (!activeAttack) return "No active route has been emitted yet.";

  return `Active route: ${activeAttack.source.country} to ${activeAttack.target.country}, ${activeAttack.type}, ${activeAttack.severity}, ${activeAttack.volume} events/min, ${activeAttack.confidence}% confidence.`;
}

function countBy(attacks, getKey) {
  const counts = attacks.reduce((acc, attack) => {
    const key = getKey(attack);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function formatRanking(entries) {
  if (!entries.length) return "none";
  return entries.map(([name, count]) => `${name} (${count})`).join(", ");
}

function getLiveSummary(activeAttack, visibleAttacks, allAttacks) {
  if (!activeAttack) return "Waiting for the first attack packet.";

  const topTarget = topCountries(visibleAttacks.length ? visibleAttacks : allAttacks, "target", 1)[0];

  return `${activeAttack.type} from ${activeAttack.source.country} to ${activeAttack.target.country}. Severity is ${activeAttack.severity}. ${visibleAttacks.length} visible attacks; top target is ${topTarget?.[0] || "unknown"}.`;
}
