export const ORIGINS = [
  { country: "Russia", code: "RU", coordinates: [37.6173, 55.7558], weight: 15 },
  { country: "China", code: "CN", coordinates: [116.4074, 39.9042], weight: 16 },
  { country: "North Korea", code: "KP", coordinates: [125.7625, 39.0392], weight: 8 },
  { country: "Iran", code: "IR", coordinates: [51.389, 35.6892], weight: 9 },
  { country: "Brazil", code: "BR", coordinates: [-46.6333, -23.5505], weight: 7 },
  { country: "India", code: "IN", coordinates: [77.209, 28.6139], weight: 10 },
  { country: "Vietnam", code: "VN", coordinates: [105.8342, 21.0278], weight: 6 },
  { country: "Netherlands", code: "NL", coordinates: [4.9041, 52.3676], weight: 5 },
  { country: "Turkey", code: "TR", coordinates: [32.8597, 39.9334], weight: 5 },
];

export const TARGETS = [
  { country: "United States", code: "US", coordinates: [-74.006, 40.7128], weight: 18 },
  { country: "Nigeria", code: "NG", coordinates: [3.3792, 6.5244], weight: 9 },
  { country: "United Kingdom", code: "GB", coordinates: [-0.1276, 51.5072], weight: 11 },
  { country: "Germany", code: "DE", coordinates: [13.405, 52.52], weight: 10 },
  { country: "Japan", code: "JP", coordinates: [139.6917, 35.6895], weight: 9 },
  { country: "South Africa", code: "ZA", coordinates: [28.0473, -26.2041], weight: 6 },
  { country: "UAE", code: "AE", coordinates: [55.2708, 25.2048], weight: 6 },
  { country: "Ukraine", code: "UA", coordinates: [30.5234, 50.4501], weight: 8 },
  { country: "Singapore", code: "SG", coordinates: [103.8198, 1.3521], weight: 7 },
];

export const ATTACK_TYPES = ["DDoS", "Malware", "Phishing", "Ransomware"];
export const SEVERITIES = ["Low", "Medium", "Critical"];

export const ATTACK_COLORS = {
  DDoS: [255, 59, 59, 230],
  Malware: [255, 149, 0, 230],
  Phishing: [255, 214, 10, 225],
  Ransomware: [255, 46, 99, 235],
};

const SEVERITY_WEIGHT = {
  Low: 2,
  Medium: 4,
  Critical: 7,
};

const SIGNATURES = {
  DDoS: ["UDP flood", "SYN amplification", "HTTP layer 7 burst"],
  Malware: ["C2 callback", "payload dropper", "credential stealer"],
  Phishing: ["brand spoof", "credential lure", "mail gateway bypass"],
  Ransomware: ["SMB lateral movement", "backup discovery", "file encryption"],
};

function weightedRandom(list) {
  const total = list.reduce((sum, item) => sum + (item.weight || 1), 0);
  let cursor = Math.random() * total;

  for (const item of list) {
    cursor -= item.weight || 1;
    if (cursor <= 0) return item;
  }

  return list[list.length - 1];
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomVolume(severity) {
  const base = SEVERITY_WEIGHT[severity] * 25;
  return base + Math.floor(Math.random() * 120);
}

function makeAttack(timestamp = Date.now(), index = 0) {
  const source = weightedRandom(ORIGINS);
  const target = weightedRandom(TARGETS);
  const type = randomFrom(ATTACK_TYPES);
  const severity = randomFrom(SEVERITIES);

  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${timestamp}-${index}`,
    source,
    target,
    type,
    severity,
    volume: randomVolume(severity),
    timestamp,
    confidence: 72 + Math.floor(Math.random() * 27),
    signature: randomFrom(SIGNATURES[type]),
  };
}

export function seedAttacks(count = 22) {
  const now = Date.now();

  return Array.from({ length: count }, (_, index) =>
    makeAttack(now - index * (9000 + Math.floor(Math.random() * 17000)), index)
  );
}

export function createAttackEvent() {
  return makeAttack();
}

export function formatRelativeTime(timestamp, now) {
  const referenceTime = now || timestamp;
  const seconds = Math.max(1, Math.floor((referenceTime - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}
