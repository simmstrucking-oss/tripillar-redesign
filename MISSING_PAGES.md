# Missing Pages to Build

These pages exist on the original site but not in our redesign yet.
Build each as a Next.js App Router page matching the existing design system (light theme, Playfair serif headings, Inter body, gold accent, FadeIn animations).

IMPORTANT: Do NOT use em dashes (—) anywhere in the prose. Use commas, periods, colons, or rewrite the sentence.

Use the existing components: FadeIn, Navbar (already in layout), Footer (already in layout).
Use the same Tailwind classes as existing pages (bg-section-alt, text-navy, text-muted, text-gold, card-hover, bg-card-bg, border-card-border, etc).

## 1. /about/ → app/about/page.tsx

Founders Wayne & Jamie Simms. Lost son Jacoby and nephew Ian.
Sections: Our Story, The Core Conviction ("Live and Grieve" - "and" is the operative word, 52 weeks is a statement), What Current Research Says (five stages were for terminally ill patients not bereaved), What This Program Is (52-week, groups of 6-12, facilitator-led, not therapy), Mission & Vision, What We Believe (Compassion/Presence, Safety/Trust, Trauma-Informed Care, Continuing Bonds, Inclusivity, Evidence-Informed, Empowerment), Research Foundation (6 frameworks: Dual Process Model Stroebe/Schut 1999, Tasks of Mourning Worden 2009, Continuing Bonds Klass/Silverman/Nickman 1996, Meaning Reconstruction Neimeyer 2001, Self-Compassion Neff 2011, Companioning Wolfelt 2006).

## 2. /facilitators/ → app/facilitators/page.tsx

Become a Certified Facilitator page.
Two certification tracks: Adult Program ($450/facilitator, $150 annual renewal) and Youth Program (pricing on inquiry).
Adult: Community Track, Professional Track, Ministry Track. Learns trauma-informed facilitation, group dynamics, 6 frameworks, holding space without overstepping, session-by-session guidance.
Youth: Elementary Facilitator, Middle-High Facilitator, Combined. Learns developmental considerations, age-appropriate facilitation, mandated reporter obligations, caregiver communication, boundaries.
Training: 2-day events, organizational cohort training available. Next event: Spring 2026.

## 3. /memorial-wall/ → app/memorial-wall/page.tsx

Emotional memorial page. Names: Jacoby Gray, Ian Hornagold, Nan Simms, Pamela Jo Haycraft. "In whose memory Live and Grieve was built."
Contributions of $50+ can add a name + optional photo. Contact wayne@tripillarstudio.com.
Link to /support/ page.

## 4. /support/ → app/support/page.tsx

Support the Mission / donate page.
What support funds: Facilitator Training Scholarships, Pilot Program Expansion, Youth Program Development, Program Access.
How to support: Any amount (name on Memorial Wall), $50+ (name + photo on wall).
Stripe link: https://buy.stripe.com/00w4gy9qD4RI5Hu5zZgYU00
Note: Tri-Pillars LLC is NOT a 501(c)(3), contributions are not tax-deductible.

## 5. /program/ → app/program/page.tsx

Program overview landing. Links to /program/adult/ and /program/youth/.
Adult: 52 weeks, 4 workbooks, 60 sessions, 6 frameworks, 3 cert tracks.
Youth: 13 sessions, 2 tracks (Elementary, Middle-High), caregiver support.
"More programs coming" section.

## 6. /content/ → app/content/page.tsx

Content hub landing. Three sections linking to:
- News (/content/news/) - program updates, milestones
- Blog (/content/blog/) - Wayne and Jamie writing about grief and research
- Resources (/content/resources/) - curated library

## 7. /content/blog/ → app/content/blog/page.tsx

Blog listing page. Currently has one post:
"Why We Stopped Believing in the Five Stages of Grief, And What We Built Instead" by Wayne and Jamie Simms, March 2026.
Long-form post about Kubler-Ross model origins (1969, On Death and Dying, terminally ill patients not bereaved), what research shows (DPM, Worden's Tasks, Continuing Bonds), and what they built instead.

## 8. /content/news/ → app/content/news/page.tsx

News listing. Current items:
- March 2026: New Best Practices Guide for School-Based Grief Support (NACG + Coalition to Support Grieving Students, 30-page guide)
- March 2026: KDP Publishing Underway (16 titles through Amazon KDP, March-April 2026)
- May 2026: Hampshire County Pilot Launch (first pilot, Hampshire County Community Action Center, WV)
- Spring 2026: Facilitator Certification Training (last week of April 2026)

## 9. /content/resources/ → app/content/resources/page.tsx

Resources page. Sections:
- Video Library: YouTube channel @liveandgrieve_3, 60 lessons across 6 modules
- Research Frameworks: 6 citations (Stroebe/Schut 1999, Worden 2009, Klass/Silverman/Nickman 1996, Neimeyer 2001, Neff 2011, Wolfelt 2006)
- For Caregivers: link to youth program
- Crisis Resources: 988 Lifeline, Crisis Text Line (HOME to 741741), 911

## Landing pages (skip for now)
/landing-pages-utility/for-institutions/
/landing-pages-utility/become-facilitator/
/landing-pages-utility/join-waitlist/
/landing-pages-utility/free-guide/
These are marketing funnel variants, build later if needed.
