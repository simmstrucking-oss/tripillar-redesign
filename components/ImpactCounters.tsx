'use client';
/**
 * ImpactCounters — client component
 * Receives SSR-fetched numbers as props. Animates count-up on mount.
 * If all four are zero, shows a "Launching" placeholder instead.
 */
import { useEffect, useRef, useState } from 'react';

export interface PublicMetrics {
  participants_served:    number;
  cohorts_completed:      number;
  facilitators_certified: number;
  organizations_licensed: number;
}

function useCountUp(target: number, duration = 1400, startDelay = 0) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (target === 0) return;
    const timeout = setTimeout(() => {
      const start = performance.now();
      function tick(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) raf.current = requestAnimationFrame(tick);
      }
      raf.current = requestAnimationFrame(tick);
    }, startDelay);
    return () => {
      clearTimeout(timeout);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration, startDelay]);

  return target === 0 ? 0 : count;
}

function Tile({
  value, label, suffix = '', icon, delay = 0,
}: {
  value: number; label: string; suffix?: string; icon: string; delay?: number;
}) {
  const count = useCountUp(value, 1600, delay);

  return (
    <div style={{
      textAlign: 'center',
      padding: '1.5rem 1rem',
      flex: '1 1 160px',
    }}>
      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div
        style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 700,
          color: '#B8942F',
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        {count.toLocaleString()}{suffix}
      </div>
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#2D3142',
          marginTop: '0.4rem',
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default function ImpactCounters({ metrics }: { metrics: PublicMetrics }) {
  const total =
    metrics.participants_served +
    metrics.cohorts_completed +
    metrics.facilitators_certified +
    metrics.organizations_licensed;

  // All zeros — show placeholder copy
  if (total === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '2.5rem 1.5rem',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <p
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: '1.25rem',
            color: '#B8942F',
            fontStyle: 'italic',
            margin: 0,
          }}
        >
          Launching May 2026
        </p>
        <p
          style={{
            fontSize: '0.85rem',
            color: '#7A7264',
            marginTop: '0.5rem',
          }}
        >
          Program metrics will appear here as cohorts complete.
        </p>
      </div>
    );
  }

  const tiles = [
    { value: metrics.participants_served,    label: 'People Served',           icon: '👥', suffix: '+' },
    { value: metrics.cohorts_completed,      label: 'Cohorts Completed',       icon: '✅', suffix: ''  },
    { value: metrics.facilitators_certified, label: 'Facilitators Certified',  icon: '🎓', suffix: ''  },
    { value: metrics.organizations_licensed, label: 'Organizations Licensed',  icon: '🏛', suffix: ''  },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0.25rem',
        margin: '0 auto',
        maxWidth: 840,
      }}
    >
      {tiles.map((t, i) => (
        <Tile key={t.label} {...t} delay={i * 150} />
      ))}
    </div>
  );
}
