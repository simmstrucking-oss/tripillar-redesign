/**
 * PublicMetricsSection — async server component
 * Fetches /api/reports/public at render time (SSR) so numbers are in HTML for SEO.
 * Passes hydrated data to ImpactCounters (client component) for count-up animation.
 *
 * Usage:
 *   import PublicMetricsSection from '@/components/PublicMetricsSection';
 *   <PublicMetricsSection />
 */
import ImpactCounters, { type PublicMetrics } from './ImpactCounters';

async function fetchPublicMetrics(): Promise<PublicMetrics> {
  const empty: PublicMetrics = {
    participants_served: 0, cohorts_completed: 0,
    facilitators_certified: 0, organizations_licensed: 0,
  };

  try {
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const res = await fetch(`${base}/api/reports/public`, {
      next: { revalidate: 3600 }, // ISR — revalidate every hour
    });

    if (!res.ok) return empty;
    const data = await res.json();
    return {
      participants_served:    Number(data.participants_served    ?? 0),
      cohorts_completed:      Number(data.cohorts_completed      ?? 0),
      facilitators_certified: Number(data.facilitators_certified ?? 0),
      organizations_licensed: Number(data.organizations_licensed ?? 0),
    };
  } catch {
    return empty;
  }
}

export default async function PublicMetricsSection() {
  const metrics = await fetchPublicMetrics();

  const total =
    metrics.participants_served +
    metrics.cohorts_completed +
    metrics.facilitators_certified +
    metrics.organizations_licensed;

  return (
    <section className="py-20 bg-section-alt">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header — always visible */}
        <div className="text-center mb-10">
          <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">
            Program Reach
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-navy">
            Grief supported. Everywhere.
          </h2>
          {total > 0 && (
            <p className="text-muted mt-3 text-sm max-w-md mx-auto">
              Real numbers from active Live and Grieve™ programs.
            </p>
          )}
        </div>

        {/* Divider rule */}
        <div
          style={{
            borderTop: '1px solid rgba(184,148,47,0.2)',
            marginBottom: '2.5rem',
          }}
        />

        {/* SEO-visible numbers (rendered server-side) */}
        {total > 0 && (
          <noscript>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '2rem',
                textAlign: 'center',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <div><strong>{metrics.participants_served}</strong><br />People Served</div>
              <div><strong>{metrics.cohorts_completed}</strong><br />Cohorts Completed</div>
              <div><strong>{metrics.facilitators_certified}</strong><br />Facilitators Certified</div>
              <div><strong>{metrics.organizations_licensed}</strong><br />Organizations Licensed</div>
            </div>
          </noscript>
        )}

        {/* Animated client component */}
        <ImpactCounters metrics={metrics} />
      </div>
    </section>
  );
}
