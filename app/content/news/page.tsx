import FadeIn from "@/components/FadeIn";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News | Tri-Pillars™",
  description:
    "Program updates, pilot launches, publishing milestones, and training announcements from Tri-Pillars.",
};

const news = [
  {
    date: "May 2026",
    title: "Hampshire County Pilot Launch",
    desc: "The first Live and Grieve pilot program launches at the Hampshire County Community Action Center in West Virginia. This is the first community to run the full 52-week adult program from start to finish.",
  },
  {
    date: "Spring 2026",
    title: "Facilitator Certification Training",
    desc: "Our next 2-day facilitator certification event is scheduled for the last week of April 2026. Organizational cohort training is also available for institutions that want to certify multiple facilitators at once.",
  },
  {
    date: "March 2026",
    title: "KDP Publishing Underway",
    desc: "All 16 Live and Grieve titles are being published through Amazon KDP between March and April 2026. This includes the 4 quarterly adult workbooks, the youth program materials, and the facilitator guides.",
  },
  {
    date: "March 2026",
    title: "New Best Practices Guide for School-Based Grief Support",
    desc: "The National Alliance for Children's Grief (NACG) and the Coalition to Support Grieving Students have released a 30-page guide on best practices for school-based grief support. This aligns closely with the Live and Grieve Youth approach.",
  },
];

export default function NewsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-end pb-16 pt-32 overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 60% 30%, rgba(201,168,76,0.07) 0%, transparent 60%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-gold text-xs uppercase tracking-widest mb-4 font-medium">
            News
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            What&apos;s happening{" "}
            <span className="gold-text">at Tri-Pillars.</span>
          </h1>
        </div>
      </section>

      {/* News items */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="space-y-8">
          {news.map((item, i) => (
            <FadeIn key={i} delay={i * 80}>
              <div className="bg-card-bg border border-card-border shadow-sm rounded-xl p-8">
                <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">
                  {item.date}
                </p>
                <h2 className="font-serif text-2xl text-navy mb-4">
                  {item.title}
                </h2>
                <p className="text-muted leading-relaxed text-sm">
                  {item.desc}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>
    </>
  );
}
