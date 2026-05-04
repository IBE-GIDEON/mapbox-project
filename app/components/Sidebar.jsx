import { formatRelativeTime } from "../data/attacks";

function topCountries(attacks, side) {
  const counts = attacks.reduce((acc, attack) => {
    const country = attack[side].country;
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

function typeColor(type) {
  if (type === "DDoS") return "text-red-300";
  if (type === "Malware") return "text-orange-300";
  if (type === "Phishing") return "text-yellow-200";
  return "text-pink-300";
}

function countryFlag(code) {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(char.charCodeAt(0) + 127397));
}

export default function Sidebar({ attacks, now }) {
  const liveFeed = [...attacks].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
  const topAttackers = topCountries(attacks, "source");
  const topTargets = topCountries(attacks, "target");

  return (
    <aside className="glass-panel pointer-events-auto min-h-0 w-full p-4 lg:max-w-[420px]">
      <section>
        <div className="flex items-center justify-between">
          <h2 className="eyebrow">Live Feed</h2>
          <span className="live-dot">listening</span>
        </div>
        <div className="mt-3 max-h-[34dvh] space-y-1 overflow-y-auto pr-1 lg:max-h-72">
          {liveFeed.map((attack) => (
            <div key={attack.id} className="feed-row">
              <p className="text-sm text-slate-100">
                <span className="mr-1">{countryFlag(attack.source.code)}</span>
                {attack.source.country} /{" "}
                <span className="mr-1">{countryFlag(attack.target.code)}</span>
                {attack.target.country}
              </p>
              <p className={`text-xs ${typeColor(attack.type)}`}>
                {attack.type} | {attack.severity} | {attack.signature} |{" "}
                {formatRelativeTime(attack.timestamp, now)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
        <div>
          <h3 className="eyebrow">Top Attackers</h3>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-200/80">
            {topAttackers.map(([country, count]) => (
              <li key={country} className="flex items-center justify-between gap-2">
                <span className="truncate">{country}</span>
                <span className="text-white/80">{count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="eyebrow">Top Targets</h3>
          <ul className="mt-2 space-y-1.5 text-xs text-slate-200/80">
            {topTargets.map(([country, count]) => (
              <li key={country} className="flex items-center justify-between gap-2">
                <span className="truncate">{country}</span>
                <span className="text-white/80">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </aside>
  );
}
