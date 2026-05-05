'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const STEPS = [
  { num: '01', title: 'Next.js Setup',     desc: 'App router, Tailwind, base config'         },
  { num: '02', title: 'Mapbox Init',       desc: 'Token, dark basemap, fullscreen canvas'     },
  { num: '03', title: 'deck.gl ArcLayer',  desc: 'Install, configure, first static arc'       },
  { num: '04', title: 'Attack Dataset',    desc: 'Seed 200 records from AbuseIPDB'            },
  { num: '05', title: 'Simulation Engine', desc: 'Fire arcs every 2.5s from dataset'          },
  { num: '06', title: 'Stats Bar',         desc: 'Live counters, top attackers, targets'      },
  { num: '07', title: 'Filter Panel',      desc: 'By type, severity, country toggle'          },
  { num: '08', title: 'Deploy',            desc: 'Push to Vercel, env vars, done'             },
]

const NODE_POSITIONS = [0, 0.1, 0.28, 0.38, 0.54, 0.67, 0.82, 0.93]

const SVG_NODES = [
  { cx: 400, cy: 60,  side: 'right' },
  { cx: 600, cy: 130, side: 'right' },
  { cx: 500, cy: 290, side: 'right' },
  { cx: 200, cy: 360, side: 'left'  },
  { cx: 300, cy: 520, side: 'left'  },
  { cx: 600, cy: 590, side: 'right' },
  { cx: 480, cy: 750, side: 'right' },
  { cx: 220, cy: 820, side: 'left'  },
]

const PATH_D = `
  M 400 60
  C 400 60, 550 60, 600 130
  C 650 200, 600 270, 500 290
  C 400 310, 250 290, 200 360
  C 150 430, 200 500, 300 520
  C 400 540, 560 520, 600 590
  C 640 660, 580 730, 480 750
  C 380 770, 250 750, 220 820
  C 200 860, 250 900, 300 900
`

const TOTAL_LENGTH = 1950

export default function LandingPage() {
  const router = useRouter()
  const roadmapRef    = useRef(null)
  const svgRef        = useRef(null)
  const containerRef  = useRef(null)
  const activePathRef = useRef(null)

  const [scrolled,        setScrolled]        = useState(false)
  const [progress,        setProgress]        = useState(0)
  const [labelPositions,  setLabelPositions]  = useState([])

  /* ─── Cursor ─── */
  useEffect(() => {
    const cursor = document.getElementById('cm-cursor')
    const ring   = document.getElementById('cm-ring')
    if (!cursor || !ring) return
    let mx = 0, my = 0, rx = 0, ry = 0, raf
    const onMove = (e) => { mx = e.clientX; my = e.clientY }
    document.addEventListener('mousemove', onMove)
    const animate = () => {
      cursor.style.left = mx + 'px'
      cursor.style.top  = my + 'px'
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      ring.style.left = rx + 'px'
      ring.style.top  = ry + 'px'
      raf = requestAnimationFrame(animate)
    }
    animate()
    return () => { document.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [])

  /* ─── Label positions ─── */
  const computeLabels = () => {
    if (!svgRef.current || !containerRef.current) return
    const svgRect  = svgRef.current.getBoundingClientRect()
    const conRect  = containerRef.current.getBoundingClientRect()
    const sx = svgRect.width  / 800
    const sy = svgRect.height / 900
    setLabelPositions(SVG_NODES.map((n) => ({
      px:   n.cx * sx + (svgRect.left - conRect.left),
      py:   n.cy * sy + (svgRect.top  - conRect.top),
      side: n.side,
      cw:   conRect.width,
    })))
  }

  useEffect(() => {
    computeLabels()
    window.addEventListener('resize', computeLabels)
    return () => window.removeEventListener('resize', computeLabels)
  }, [])

  /* ─── Scroll ─── */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)

      if (roadmapRef.current) {
        const rect    = roadmapRef.current.getBoundingClientRect()
        const sectionH = roadmapRef.current.offsetHeight
        const p = Math.min(1, Math.max(0, -rect.top) / (sectionH - window.innerHeight * 0.5))
        setProgress(p)
        if (activePathRef.current) {
          activePathRef.current.style.strokeDashoffset = TOTAL_LENGTH * (1 - p)
        }
      }

      document.querySelectorAll('[data-fade]').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.88)
          el.classList.add('visible')
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const nodeState = (i) => {
    const t = NODE_POSITIONS[i]
    if (progress >= t + 0.03) return 'done'
    if (progress >= t - 0.01) return 'active'
    return 'idle'
  }

  /* ─── Shared style helpers ─── */
  const W = '#f5f5f0'
  const MUTED = 'rgba(255,255,255,0.25)'
  const BORDER = 'rgba(255,255,255,0.06)'
  const mono = "'JetBrains Mono', monospace"
  const sans = "'Space Grotesk', sans-serif"

  return (
    <>
      {/* Cursor */}
      <div id="cm-cursor" style={{
        width:8, height:8, background:W, borderRadius:'50%',
        position:'fixed', pointerEvents:'none', zIndex:9999,
        transform:'translate(-50%,-50%)', mixBlendMode:'difference',
      }}/>
      <div id="cm-ring" style={{
        width:32, height:32, border:`1px solid rgba(255,255,255,0.3)`,
        borderRadius:'50%', position:'fixed', pointerEvents:'none',
        zIndex:9998, transform:'translate(-50%,-50%)', transition:'all 0.15s ease',
      }}/>

      {/* ── NAV ── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        padding:'1.5rem 3rem', display:'flex',
        justifyContent:'space-between', alignItems:'center',
        borderBottom: scrolled ? `1px solid ${BORDER}` : '1px solid transparent',
        background: scrolled ? 'rgba(8,8,8,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition:'all 0.3s',
      }}>
        <span style={{ fontFamily:mono, fontSize:13, fontWeight:500, letterSpacing:'0.1em', color:W }}>
          CYBERMAP
        </span>
        <ul style={{ display:'flex', gap:'2.5rem', listStyle:'none', margin:0, padding:0 }}>
          {[['Roadmap','#roadmap'],['Stats','#stats'],['Launch','#launch']].map(([label, href]) => (
            <li key={label}>
              <a href={href} style={{
                fontSize:12, color:MUTED, textDecoration:'none',
                letterSpacing:'0.08em', fontWeight:400, transition:'color 0.2s',
              }}
                onMouseEnter={e => e.target.style.color = W}
                onMouseLeave={e => e.target.style.color = MUTED}
              >{label}</a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight:'100vh', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        textAlign:'center', padding:'0 2rem',
        position:'relative', overflow:'hidden',
      }}>
        {/* grid */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:`linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize:'60px 60px',
          WebkitMaskImage:'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          maskImage:'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        }}/>

        <div data-fade style={{ position:'relative' }}>
          {/* eyebrow */}
          <div style={{
            fontFamily:mono, fontSize:11, fontWeight:300,
            letterSpacing:'0.2em', color:MUTED, textTransform:'uppercase',
            marginBottom:'2rem', display:'flex', alignItems:'center', gap:12,
          }}>
            <span style={{ display:'block', width:40, height:1, background:BORDER }}/>
            Global Threat Intelligence Platform
            <span style={{ display:'block', width:40, height:1, background:BORDER }}/>
          </div>

          <h1 style={{
            fontSize:'clamp(3rem,8vw,7rem)', fontWeight:700,
            lineHeight:0.95, letterSpacing:'-0.03em', color:W, marginBottom:'2rem',
          }}>
            See every
            <span style={{
              display:'block', color:'transparent',
              WebkitTextStroke:'1px rgba(255,255,255,0.2)',
            }}>attack.</span>
          </h1>

          <p style={{
            fontSize:15, fontWeight:300, color:MUTED,
            maxWidth:420, lineHeight:1.7, margin:'0 auto 3rem',
          }}>
            Real-time cyberattack visualization across 190 countries.
            Built on public threat intelligence — rendered live.
          </p>

          <div style={{ display:'flex', gap:16, justifyContent:'center' }}>
            <button onClick={() => router.push('/dashboard')} style={{
              background:W, color:'#080808', border:'none',
              padding:'14px 32px', fontFamily:sans,
              fontSize:13, fontWeight:500, letterSpacing:'0.05em',
              cursor:'none', transition:'opacity 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity='1'}
            >Enter App</button>

            <button style={{
              background:'none', color:MUTED,
              border:`1px solid ${BORDER}`,
              padding:'14px 32px', fontFamily:sans,
              fontSize:13, fontWeight:400, cursor:'none', transition:'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color=W; e.currentTarget.style.borderColor='rgba(255,255,255,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.color=MUTED; e.currentTarget.style.borderColor=BORDER }}
            >Read Docs</button>
          </div>
        </div>

        {/* scroll hint */}
        <div style={{
          position:'absolute', bottom:'2.5rem', left:'50%', transform:'translateX(-50%)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:8,
          fontFamily:mono, fontSize:10, letterSpacing:'0.15em',
          color:'rgba(255,255,255,0.15)', textTransform:'uppercase',
        }}>
          <div style={{
            width:1, height:40,
            background:'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)',
            animation:'scrollPulse 2s ease-in-out infinite',
          }}/>
          Scroll
        </div>
      </section>

      {/* ── ROADMAP ── */}
      <section id="roadmap" ref={roadmapRef} style={{ minHeight:'100vh', position:'relative' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'8rem 2rem', position:'relative' }}>

          <div data-fade style={{ textAlign:'center', marginBottom:'6rem' }}>
            <h2 style={{
              fontSize:'clamp(2rem,5vw,4rem)', fontWeight:700,
              letterSpacing:'-0.03em', lineHeight:1, marginBottom:'1rem', color:W,
            }}>Build Roadmap</h2>
            <p style={{ fontSize:14, color:MUTED, fontFamily:mono, fontWeight:300, letterSpacing:'0.05em' }}>
              {"// 8 steps from zero to deployed"}
            </p>
          </div>

          <div ref={containerRef} style={{ position:'relative', width:'100%' }}>
            <svg ref={svgRef} viewBox="0 0 800 900" xmlns="http://www.w3.org/2000/svg"
              style={{ width:'100%', height:'auto', display:'block' }}>

              {/* bg dashed */}
              <path d={PATH_D} fill="none" stroke="rgba(255,255,255,0.08)"
                strokeWidth="1" strokeDasharray="4 6"/>

              {/* active path */}
              <path ref={activePathRef} d={PATH_D} fill="none"
                stroke="rgba(255,255,255,0.5)" strokeWidth="1.5"
                strokeDasharray={TOTAL_LENGTH} strokeDashoffset={TOTAL_LENGTH}
                style={{ transition:'stroke-dashoffset 0.05s linear' }}/>

              {/* nodes */}
              {SVG_NODES.map((n, i) => {
                const s = nodeState(i)
                return (
                  <g key={i}>
                    <circle cx={n.cx} cy={n.cy} r={22} fill="none"
                      stroke={s==='active' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.12)'}
                      strokeWidth="1" style={{ transition:'stroke 0.3s' }}/>
                    <circle cx={n.cx} cy={n.cy} r={14}
                      fill={s==='active' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}
                      style={{ transition:'fill 0.3s' }}/>
                    <circle cx={n.cx} cy={n.cy} r={s==='active' ? 5 : 3.5}
                      fill={W} style={{ transition:'all 0.3s' }}/>
                  </g>
                )
              })}
            </svg>

            {/* labels */}
            <div style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none' }}>
              {labelPositions.map((pos, i) => {
                const s    = nodeState(i)
                const step = STEPS[i]
                return (
                  <div key={i} style={{
                    position:'absolute',
                    top:  pos.py - 16,
                    left: pos.side === 'right' ? pos.px + 32 : undefined,
                    right: pos.side === 'left'  ? pos.cw - pos.px + 32 : undefined,
                  }}>
                    <div style={{
                      fontFamily:mono, fontSize:10, fontWeight:300, letterSpacing:'0.1em',
                      color: s==='active' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)',
                      marginBottom:4, transition:'color 0.4s',
                    }}>{step.num}</div>
                    <div style={{
                      fontSize:14, fontWeight:500, lineHeight:1.3, maxWidth:160,
                      color: s==='active' ? W : s==='done' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.4)',
                      transition:'color 0.4s',
                    }}>{step.title}</div>
                    <div style={{
                      fontSize:11, fontWeight:300, lineHeight:1.5, maxWidth:150, marginTop:4,
                      color: s==='active' ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.15)',
                      transition:'color 0.4s',
                    }}>{step.desc}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section id="stats" style={{
        borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}`,
        padding:'5rem 2rem',
      }}>
        <div style={{
          maxWidth:900, margin:'0 auto',
          display:'grid', gridTemplateColumns:'repeat(3,1fr)',
        }}>
          {[
            { num:'190+', label:'Countries tracked'    },
            { num:'2.4M', label:'Attacks per day'      },
            { num:'4',    label:'Attack types mapped'  },
          ].map((s, i) => (
            <div key={i} data-fade style={{
              padding:'2rem', textAlign:'center',
              borderRight: i<2 ? `1px solid ${BORDER}` : 'none',
              transitionDelay:`${i*0.15}s`,
            }}>
              <div style={{
                fontSize:'clamp(2.5rem,5vw,4rem)', fontWeight:700,
                letterSpacing:'-0.04em', lineHeight:1, marginBottom:'0.5rem',
                fontFamily:mono, color:W,
              }}>{s.num}</div>
              <div style={{
                fontSize:12, color:MUTED, letterSpacing:'0.1em',
                textTransform:'uppercase', fontWeight:300,
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="launch" style={{
        minHeight:'80vh', display:'flex', alignItems:'center',
        justifyContent:'center', textAlign:'center',
        padding:'8rem 2rem', position:'relative', overflow:'hidden',
      }}>
        <div style={{
          position:'absolute', width:600, height:600,
          background:'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
          top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        }}/>
        <div data-fade style={{ position:'relative' }}>
          <h2 style={{
            fontSize:'clamp(2.5rem,6vw,5.5rem)', fontWeight:700,
            letterSpacing:'-0.04em', lineHeight:0.95, marginBottom:'2rem', color:W,
          }}>
            Threats don&apos;t<br/>
            <span style={{ color:'transparent', WebkitTextStroke:'1px rgba(255,255,255,0.25)' }}>
              wait.
            </span>
          </h2>
          <button onClick={() => router.push('/dashboard')} style={{
            background:W, color:'#080808', border:'none',
            padding:'16px 40px', fontFamily:sans,
            fontSize:14, fontWeight:500, letterSpacing:'0.05em',
            cursor:'none', transition:'opacity 0.2s', marginTop:'0.5rem',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity='0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity='1'}
          >Enter App</button>
        </div>
      </section>

      {/* ── GLOBAL STYLES ── */}
      <style jsx global>{`
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        html { scroll-behavior:smooth; }
        body {
          background:#080808;
          color:#f5f5f0;
          font-family:'Space Grotesk', sans-serif;
          overflow-x:hidden;
          cursor:none;
        }
        a, button { cursor:none; }
        [data-fade] {
          opacity:0;
          transform:translateY(24px);
          transition:opacity 0.7s ease, transform 0.7s ease;
        }
        [data-fade].visible { opacity:1; transform:translateY(0); }
        @keyframes scrollPulse {
          0%, 100% { opacity:0.3; }
          50%       { opacity:1;   }
        }
        @media (max-width:640px) {
          nav { padding:1.2rem 1.5rem; }
        }
      `}</style>
    </>
  )
}
