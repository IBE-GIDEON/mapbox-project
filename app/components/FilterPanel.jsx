const TYPES = ["All", "DDoS", "Malware", "Phishing", "Ransomware"];
const SEVERITIES = ["All", "Low", "Medium", "Critical"];

function Chip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`control-chip ${
        active
          ? "border-white bg-white text-black font-semibold"
          : "border-white/15 bg-black/40 text-slate-300 hover:border-white/50 hover:text-white hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

export default function FilterPanel({ filters, onChange, availableTargets }) {
  return (
    <div className="glass-panel pointer-events-auto w-full p-4 lg:max-w-[520px]">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        <div>
          <p className="eyebrow">Attack Type</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TYPES.map((type) => (
              <Chip
                key={type}
                label={type}
                active={filters.type === type}
                onClick={() => onChange({ ...filters, type })}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow">Severity</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SEVERITIES.map((severity) => (
              <Chip
                key={severity}
                label={severity}
                active={filters.severity === severity}
                onClick={() => onChange({ ...filters, severity })}
              />
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="target-filter" className="eyebrow">
            Target Country
          </label>
          <select
            id="target-filter"
            value={filters.target}
            onChange={(event) =>
              onChange({ ...filters, target: event.target.value })
            }
            className="mt-2 w-full rounded-lg border border-white/15 bg-black/80 px-3 py-2 text-sm text-slate-100 outline-none backdrop-blur-lg focus:border-white/70"
          >
            <option value="All">All Targets</option>
            {availableTargets.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
