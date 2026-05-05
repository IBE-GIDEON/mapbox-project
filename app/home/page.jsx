'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  { num: '01', title: 'Next.js setup', desc: 'App Router, Tailwind, base config' },
  { num: '02', title: 'Mapbox init', desc: 'Token, dark basemap, fullscreen canvas' },
  { num: '03', title: 'deck.gl layer', desc: 'Configure ArcLayer and map overlay' },
  { num: '04', title: 'Threat dataset', desc: 'Normalize public intelligence records' },
  { num: '05', title: 'Simulation', desc: 'Emit new events from the seed stream' },
  { num: '06', title: 'Live metrics', desc: 'Counters, leaders, and active routes' },
  { num: '07', title: 'Controls', desc: 'Filter by vector, severity, and region' },
  { num: '08', title: 'Deploy', desc: 'Ship with production environment variables' },
]

const NODE_POSITIONS = [0, 0.12, 0.26, 0.4, 0.53, 0.66, 0.81, 0.94]

const SVG_NODES = [
  { cx: 380, cy: 70, side: 'right' },
  { cx: 610, cy: 150, side: 'right' },
  { cx: 500, cy: 280, side: 'right' },
  { cx: 210, cy: 390, side: 'left' },
  { cx: 315, cy: 520, side: 'left' },
  { cx: 620, cy: 620, side: 'right' },
  { cx: 470, cy: 760, side: 'right' },
  { cx: 230, cy: 850, side: 'left' },
]

const ROADMAP_PATH_D = `
  M 380 70
  L 610 70
  L 610 150
  L 500 150
  L 500 280
  L 210 280
  L 210 390
  L 315 390
  L 315 520
  L 620 520
  L 620 620
  L 470 620
  L 470 760
  L 230 760
  L 230 850
  L 315 850
`

const TOTAL_LENGTH = 2060

const HERO_TRACKS = [
  '1060,160 1210,160 1210,245 1332,245 1332,335 1190,335 1190,452 1370,452 1370,575 1260,575 1260,710 1410,710',
  '880,220 1018,220 1018,310 958,310 958,405 1090,405 1090,520 1010,520 1010,650 1138,650 1138,820',
  '1218,92 1218,205 1134,205 1134,298 1268,298 1268,410 1166,410 1166,552 1298,552 1298,818',
  '1440,190 1345,190 1345,280 1458,280 1458,372 1350,372 1350,485 1490,485 1490,648 1380,648 1380,842',
  '760,310 890,310 890,430 805,430 805,552 930,552 930,688 850,688 850,845',
  '980,760 1088,760 1088,675 1208,675 1208,590 1320,590 1320,505 1438,505',
]

const HERO_ROUTE = '820,755 820,635 950,635 950,505 1078,505 1078,392 1218,392 1218,270 1390,270'

const HERO_NODES = [
  [820, 755, 11], [950, 635, 8], [1078, 505, 10], [1218, 392, 12],
  [1390, 270, 10], [1018, 310, 7], [1268, 298, 8], [1458, 372, 7],
  [930, 688, 8], [1320, 590, 9], [1166, 552, 7], [1380, 842, 8],
]

const THEMES = {
  dark: {
    name: 'Dark',
    bg: '#030303',
    panel: '#070707',
    panelSoft: '#0b0b0b',
    text: '#f3f0e8',
    muted: 'rgba(243, 240, 232, 0.52)',
    faint: 'rgba(243, 240, 232, 0.18)',
    border: 'rgba(243, 240, 232, 0.1)',
    strongBorder: 'rgba(243, 240, 232, 0.22)',
    inverse: '#030303',
    button: '#f3f0e8',
    mapLine: 'rgba(243, 240, 232, 0.12)',
    activeLine: '#f3f0e8',
  },
  light: {
    name: 'Light',
    bg: '#ede5d7',
    panel: '#e7ddcd',
    panelSoft: '#dfd3c1',
    text: '#1c1711',
    muted: 'rgba(28, 23, 17, 0.58)',
    faint: 'rgba(28, 23, 17, 0.2)',
    border: 'rgba(76, 58, 38, 0.16)',
    strongBorder: 'rgba(76, 58, 38, 0.3)',
    inverse: '#ede5d7',
    button: '#1c1711',
    mapLine: 'rgba(28, 23, 17, 0.16)',
    activeLine: '#1c1711',
  },
}

export default function LandingPage() {
  const router = useRouter()
  const roadmapRef = useRef(null)
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const activePathRef = useRef(null)

  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [labelPositions, setLabelPositions] = useState([])
  const [isLightMode, setIsLightMode] = useState(false)

  const theme = isLightMode ? THEMES.light : THEMES.dark

  const computeLabels = () => {
    if (!svgRef.current || !containerRef.current) return
    const svgRect = svgRef.current.getBoundingClientRect()
    const conRect = containerRef.current.getBoundingClientRect()
    const sx = svgRect.width / 800
    const sy = svgRect.height / 920

    setLabelPositions(SVG_NODES.map((node) => ({
      px: node.cx * sx + (svgRect.left - conRect.left),
      py: node.cy * sy + (svgRect.top - conRect.top),
      side: node.side,
      cw: conRect.width,
    })))
  }

  useEffect(() => {
    computeLabels()
    window.addEventListener('resize', computeLabels)
    return () => window.removeEventListener('resize', computeLabels)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)

      if (roadmapRef.current) {
        const rect = roadmapRef.current.getBoundingClientRect()
        const sectionHeight = roadmapRef.current.offsetHeight
        const nextProgress = Math.min(
          1,
          Math.max(0, -rect.top / (sectionHeight - window.innerHeight * 0.5))
        )

        setProgress(nextProgress)
        if (activePathRef.current) {
          activePathRef.current.style.strokeDashoffset = TOTAL_LENGTH * (1 - nextProgress)
        }
      }

      document.querySelectorAll('[data-fade]').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.88) {
          el.classList.add('visible')
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const nodeState = (index) => {
    const t = NODE_POSITIONS[index]
    if (progress >= t + 0.03) return 'done'
    if (progress >= t - 0.01) return 'active'
    return 'idle'
  }

  return (
    <main
      className={`landing-page ${isLightMode ? 'light' : 'dark'}`}
      style={{
        '--page-bg': theme.bg,
        '--panel': theme.panel,
        '--panel-soft': theme.panelSoft,
        '--text': theme.text,
        '--muted': theme.muted,
        '--faint': theme.faint,
        '--border': theme.border,
        '--strong-border': theme.strongBorder,
        '--inverse': theme.inverse,
        '--button': theme.button,
        '--map-line': theme.mapLine,
        '--active-line': theme.activeLine,
      }}
    >
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <button type="button" className="brand-mark" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          CYBERMAP
        </button>

        <div className="nav-actions">
          <a href="#roadmap">Roadmap</a>
          <a href="#stats">Stats</a>
          <a href="#launch">Launch</a>
          <button
            type="button"
            className="theme-switch"
            aria-pressed={isLightMode}
            onClick={() => setIsLightMode((current) => !current)}
          >
            <span className="switch-track">
              <span className="switch-thumb" />
            </span>
            <span>{theme.name}</span>
          </button>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="gps-map" aria-hidden="true">
          <svg viewBox="0 0 1600 980" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <g className="gps-grid">
              {HERO_TRACKS.map((points) => (
                <polyline key={points} points={points} />
              ))}
              <polyline points="760,210 920,210 920,118 1112,118 1112,218 1318,218 1318,126 1490,126" />
              <polyline points="690,842 690,725 790,725 790,602 660,602 660,480 780,480 780,350" />
              <polyline points="1460,818 1460,710 1338,710 1338,610 1442,610 1442,508" />
            </g>

            <g className="gps-route">
              <polyline points={HERO_ROUTE} />
              <circle r="9">
                <animateMotion dur="8s" repeatCount="indefinite" path={`M ${HERO_ROUTE.replaceAll(',', ' ')}`} />
              </circle>
            </g>

            <g className="gps-nodes">
              {HERO_NODES.map(([cx, cy, r], index) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} style={{ animationDelay: `${index * 0.18}s` }} />
              ))}
            </g>

            <g className="gps-compass">
              <polyline points="830,210 1430,210 1430,790 830,790 830,210" />
              <polyline points="1130,210 1130,390 1240,390 1240,500 1130,500 1130,790" />
              <polyline points="830,500 1010,500 1010,610 1130,610 1130,500 1430,500" />
            </g>
          </svg>
        </div>

        <div className="hero-content visible" data-fade>
          <p className="section-kicker">Global threat intelligence platform</p>
          <h1>
            See cyber
            <span>attacks.</span>
          </h1>
          <p className="hero-copy">
            A quiet, real-time-style command surface for reading hostile traffic,
            active routes, and country-level pressure from one global map.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-action" onClick={() => router.push('/dashboard')}>
              Enter App
            </button>
            <button
              type="button"
              className="secondary-action"
              onClick={() => document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Build
            </button>
          </div>
        </div>

        <div className="scroll-hint" aria-hidden="true">
          <span />
          Scroll
        </div>
      </section>

      <section id="roadmap" ref={roadmapRef} className="roadmap-section">
        <div className="section-heading" data-fade>
          <p className="section-kicker">Implementation route</p>
          <h2>Build roadmap</h2>
          <p>The route is angular by design: each turn breaks cleanly like a GPS trace.</p>
        </div>

        <div ref={containerRef} className="roadmap-map">
          <svg ref={svgRef} viewBox="0 0 800 920" xmlns="http://www.w3.org/2000/svg">
            <path className="road-base" d={ROADMAP_PATH_D} />
            <path
              ref={activePathRef}
              className="road-active"
              d={ROADMAP_PATH_D}
              strokeDasharray={TOTAL_LENGTH}
              strokeDashoffset={TOTAL_LENGTH}
            />
            <circle className="road-puck" r="8">
              <animateMotion dur="9s" repeatCount="indefinite" path={ROADMAP_PATH_D} />
            </circle>

            {SVG_NODES.map((node, index) => {
              const state = nodeState(index)
              return (
                <g key={node.cx} className={`road-node ${state}`}>
                  <circle cx={node.cx} cy={node.cy} r="22" />
                  <circle cx={node.cx} cy={node.cy} r="5" />
                </g>
              )
            })}
          </svg>

          <div className="road-labels">
            {labelPositions.map((position, index) => {
              const state = nodeState(index)
              const step = STEPS[index]
              return (
                <div
                  key={step.num}
                  className={`road-label ${state}`}
                  style={{
                    top: position.py - 16,
                    left: position.side === 'right' ? position.px + 34 : undefined,
                    right: position.side === 'left' ? position.cw - position.px + 34 : undefined,
                  }}
                >
                  <span>{step.num}</span>
                  <strong>{step.title}</strong>
                  <p>{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="stats" className="stats-section">
        {[
          { num: '190+', label: 'Countries tracked' },
          { num: '2.4M', label: 'Attacks per day' },
          { num: '4', label: 'Vectors mapped' },
        ].map((stat, index) => (
          <div key={stat.label} className="stat-card" data-fade style={{ transitionDelay: `${index * 0.12}s` }}>
            <strong>{stat.num}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section id="launch" className="launch-section">
        <div data-fade>
          <p className="section-kicker">Production surface</p>
          <h2>
            Threats do not
            <span>wait.</span>
          </h2>
          <button type="button" className="primary-action" onClick={() => router.push('/dashboard')}>
            Enter App
          </button>
        </div>
      </section>

      <style jsx global>{`
        .landing-page {
          min-height: 100vh;
          overflow-x: hidden;
          background: var(--page-bg);
          color: var(--text);
          font-family: var(--font-space), Arial, Helvetica, sans-serif;
          transition: background 260ms ease, color 260ms ease;
        }

        .landing-page * {
          box-sizing: border-box;
        }

        .landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          padding: 1.3rem clamp(1.25rem, 4vw, 3rem);
          border-bottom: 1px solid transparent;
          background: transparent;
          transition: background 220ms ease, border-color 220ms ease;
        }

        .landing-nav.scrolled {
          border-color: var(--border);
          background: color-mix(in srgb, var(--page-bg) 88%, transparent);
          backdrop-filter: blur(16px);
        }

        .brand-mark,
        .landing-nav a,
        .theme-switch,
        .primary-action,
        .secondary-action {
          border-radius: 999px;
          font: inherit;
          cursor: pointer;
        }

        .brand-mark {
          border: 0;
          background: transparent;
          color: var(--text);
          font-family: var(--font-mono), monospace;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.14em;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 1.35rem;
        }

        .landing-nav a {
          color: var(--muted);
          font-size: 0.78rem;
          text-decoration: none;
          transition: color 160ms ease;
        }

        .landing-nav a:hover {
          color: var(--text);
        }

        .theme-switch {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          border: 1px solid var(--strong-border);
          background: transparent;
          color: var(--text);
          padding: 0.35rem 0.65rem;
          font-size: 0.76rem;
        }

        .switch-track {
          position: relative;
          width: 34px;
          height: 18px;
          border: 1px solid var(--strong-border);
          border-radius: 999px;
          background: var(--panel-soft);
        }

        .switch-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--text);
          transition: transform 180ms ease;
        }

        .landing-page.light .switch-thumb {
          transform: translateX(16px);
        }

        .landing-hero,
        .roadmap-section,
        .launch-section {
          position: relative;
          overflow: hidden;
          background: var(--page-bg);
        }

        .landing-hero {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 8rem 1.5rem 5rem;
          text-align: center;
          isolation: isolate;
        }

        .landing-hero::after {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            linear-gradient(90deg, var(--page-bg) 0%, color-mix(in srgb, var(--page-bg) 76%, transparent) 32%, color-mix(in srgb, var(--page-bg) 58%, transparent) 100%),
            radial-gradient(circle at 50% 48%, transparent 0%, color-mix(in srgb, var(--page-bg) 18%, transparent) 45%, var(--page-bg) 100%);
          content: "";
        }

        .gps-map {
          position: absolute;
          inset: -7%;
          z-index: 0;
          opacity: 0.76;
          animation: gpsRotate 44s linear infinite;
          transform-origin: 70% 52%;
        }

        .gps-map svg {
          width: 100%;
          height: 100%;
        }

        .gps-grid polyline {
          fill: none;
          stroke: var(--map-line);
          stroke-width: 2;
          stroke-linecap: square;
          stroke-linejoin: miter;
        }

        .gps-route polyline {
          fill: none;
          stroke: var(--active-line);
          stroke-width: 2.6;
          stroke-linecap: square;
          stroke-linejoin: miter;
          stroke-dasharray: 15 10;
          animation: routeMarch 1.8s linear infinite;
        }

        .gps-route circle {
          fill: var(--active-line);
        }

        .gps-nodes circle {
          fill: var(--active-line);
          opacity: 0.22;
          animation: nodeBlink 5s ease-in-out infinite;
        }

        .gps-compass {
          animation: compassTurn 18s linear infinite;
          transform-origin: 1130px 500px;
        }

        .gps-compass polyline {
          fill: none;
          stroke: var(--faint);
          stroke-width: 1;
          stroke-linecap: square;
          stroke-linejoin: miter;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          width: min(980px, 100%);
        }

        .section-kicker {
          margin: 0 0 1.6rem;
          color: var(--muted);
          font-family: var(--font-mono), monospace;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .hero-content h1 {
          margin: 0;
          color: var(--text);
          font-size: clamp(3.5rem, 9vw, 8rem);
          font-weight: 700;
          letter-spacing: -0.055em;
          line-height: 0.88;
          text-transform: uppercase;
        }

        .hero-content h1 span {
          display: block;
        }

        .hero-copy {
          width: min(580px, 100%);
          margin: 2rem auto 0;
          color: var(--muted);
          font-size: 1rem;
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.9rem;
          margin-top: 2.5rem;
        }

        .primary-action,
        .secondary-action {
          min-width: 148px;
          border: 1px solid var(--strong-border);
          padding: 0.9rem 1.65rem;
          font-size: 0.82rem;
          font-weight: 600;
          transition: transform 160ms ease, background 160ms ease, color 160ms ease, border-color 160ms ease;
        }

        .primary-action {
          background: var(--button);
          color: var(--inverse);
          border-color: var(--button);
        }

        .secondary-action {
          background: transparent;
          color: var(--text);
        }

        .primary-action:hover,
        .secondary-action:hover {
          transform: translateY(-1px);
        }

        .scroll-hint {
          position: absolute;
          left: 50%;
          bottom: 2rem;
          z-index: 2;
          display: grid;
          justify-items: center;
          gap: 0.55rem;
          transform: translateX(-50%);
          color: var(--faint);
          font-family: var(--font-mono), monospace;
          font-size: 0.62rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .scroll-hint span {
          width: 1px;
          height: 38px;
          background: linear-gradient(to bottom, var(--muted), transparent);
          animation: scrollPulse 2s ease-in-out infinite;
        }

        .roadmap-section {
          min-height: 100vh;
          padding: 8rem 1.5rem 6rem;
        }

        .section-heading {
          width: min(760px, 100%);
          margin: 0 auto 5rem;
          text-align: center;
        }

        .section-heading h2,
        .launch-section h2 {
          margin: 0;
          color: var(--text);
          font-size: clamp(2.5rem, 5vw, 4.8rem);
          font-weight: 700;
          letter-spacing: -0.045em;
          line-height: 0.95;
        }

        .section-heading > p:not(.section-kicker) {
          width: min(520px, 100%);
          margin: 1.2rem auto 0;
          color: var(--muted);
          line-height: 1.7;
        }

        .roadmap-map {
          position: relative;
          width: min(900px, 100%);
          margin: 0 auto;
        }

        .roadmap-map svg {
          display: block;
          width: 100%;
          height: auto;
        }

        .road-base,
        .road-active {
          fill: none;
          stroke-linecap: square;
          stroke-linejoin: miter;
        }

        .road-base {
          stroke: var(--faint);
          stroke-width: 1.2;
          stroke-dasharray: 9 11;
        }

        .road-active {
          stroke: var(--active-line);
          stroke-width: 1.7;
          transition: stroke-dashoffset 0.05s linear;
        }

        .road-puck {
          fill: var(--active-line);
        }

        .road-node circle:first-child {
          fill: var(--panel);
          stroke: var(--border);
          stroke-width: 1;
        }

        .road-node circle:last-child {
          fill: var(--text);
          opacity: 0.45;
        }

        .road-node.active circle:first-child {
          stroke: var(--strong-border);
        }

        .road-node.active circle:last-child {
          opacity: 1;
        }

        .road-labels {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .road-label {
          position: absolute;
          max-width: 170px;
          color: var(--muted);
          transition: color 180ms ease;
        }

        .road-label span {
          display: block;
          margin-bottom: 0.35rem;
          color: var(--faint);
          font-family: var(--font-mono), monospace;
          font-size: 0.68rem;
          letter-spacing: 0.12em;
        }

        .road-label strong {
          display: block;
          color: var(--text);
          font-size: 0.92rem;
          font-weight: 600;
          line-height: 1.25;
        }

        .road-label p {
          margin: 0.28rem 0 0;
          font-size: 0.72rem;
          line-height: 1.45;
        }

        .road-label.idle {
          opacity: 0.48;
        }

        .road-label.active {
          opacity: 1;
        }

        .stats-section {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          width: min(980px, calc(100% - 3rem));
          margin: 0 auto;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: var(--page-bg);
        }

        .stat-card {
          padding: 3.2rem 2rem;
          text-align: center;
          border-right: 1px solid var(--border);
        }

        .stat-card:last-child {
          border-right: 0;
        }

        .stat-card strong {
          display: block;
          color: var(--text);
          font-family: var(--font-mono), monospace;
          font-size: clamp(2.4rem, 5vw, 4rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .stat-card span {
          display: block;
          margin-top: 0.9rem;
          color: var(--muted);
          font-size: 0.74rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .launch-section {
          min-height: 82vh;
          display: grid;
          place-items: center;
          padding: 7rem 1.5rem;
          text-align: center;
        }

        .launch-section h2 span {
          display: block;
          color: transparent;
          -webkit-text-stroke: 1px var(--muted);
        }

        .launch-section .primary-action {
          margin-top: 2.2rem;
        }

        [data-fade] {
          opacity: 0;
          transform: translateY(22px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        [data-fade].visible {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes gpsRotate {
          from { transform: rotate(0deg) scale(1.06); }
          to { transform: rotate(360deg) scale(1.06); }
        }

        @keyframes compassTurn {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }

        @keyframes routeMarch {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -25; }
        }

        @keyframes nodeBlink {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.48; }
        }

        @keyframes scrollPulse {
          0%, 100% { opacity: 0.28; }
          50% { opacity: 0.85; }
        }

        @media (max-width: 820px) {
          .landing-nav {
            align-items: flex-start;
            flex-direction: column;
          }

          .nav-actions {
            width: 100%;
            flex-wrap: wrap;
            gap: 0.9rem;
          }

          .theme-switch {
            margin-left: auto;
          }

          .road-labels {
            position: static;
            display: grid;
            gap: 1rem;
            margin-top: 2rem;
          }

          .road-label {
            position: static;
            max-width: none;
            padding: 1rem 0;
            border-top: 1px solid var(--border);
          }

          .stats-section {
            grid-template-columns: 1fr;
          }

          .stat-card {
            border-right: 0;
            border-bottom: 1px solid var(--border);
          }

          .stat-card:last-child {
            border-bottom: 0;
          }
        }

        @media (max-width: 560px) {
          .landing-hero {
            padding-top: 10rem;
          }

          .landing-nav a {
            font-size: 0.72rem;
          }

          .hero-content h1 {
            font-size: clamp(3.1rem, 17vw, 4.6rem);
          }
        }
      `}</style>
    </main>
  )
}
