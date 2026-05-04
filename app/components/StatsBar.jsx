function getMostFrequent(attacks, keyFn) {
  if (!attacks.length) return "-";

  const counts = attacks.reduce((acc, attack) => {
    const key = keyFn(attack);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export default function StatsBar({ attacks, now, totalAttacks = attacks.length }) {
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const attacks24h = attacks.filter((attack) => attack.timestamp >= oneDayAgo);
  const recentMinute = attacks.filter(
    (attack) => attack.timestamp >= now - 60 * 1000
  );

  const cards = [
    { label: "Total Tracked", value: totalAttacks.toLocaleString() },
    { label: "Last 24h", value: attacks24h.length.toLocaleString() },
    {
      label: "Top Attacker",
      value: getMostFrequent(attacks24h, (attack) => attack.source.country),
    },
    {
      label: "Top Target",
      value: getMostFrequent(attacks24h, (attack) => attack.target.country),
    },
    { label: "Attacks / Min", value: recentMinute.length.toLocaleString() },
  ];

  return (
    <div className="pointer-events-auto grid w-full grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="glass-panel px-3 py-2.5 lg:px-4 lg:py-3">
          <p className="eyebrow">{card.label}</p>
          <p className="mt-1 truncate text-base font-semibold text-white lg:text-lg">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
