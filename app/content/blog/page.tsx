import FadeIn from "@/components/FadeIn";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog | Tri-Pillars™",
  description:
    "Wayne and Jamie Simms write about grief, research, and what they are building at Tri-Pillars™ LLC.",
  openGraph: {
    title: "Blog | Tri-Pillars™",
    description:
      "Wayne and Jamie Simms write about grief, research, and what they are building at Tri-Pillars™ LLC.",
    url: "https://www.tripillarstudio.com/content/blog",
    siteName: "Tri-Pillars™",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Blog | Tri-Pillars™" }],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | Tri-Pillars™",
    description:
      "Wayne and Jamie Simms write about grief, research, and what they are building at Tri-Pillars™ LLC.",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://www.tripillarstudio.com/content/blog" },
};

export default function BlogPage() {
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
            Blog
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold text-navy leading-tight mb-6">
            Writing from{" "}
            <span className="gold-text">the founders.</span>
          </h1>
        </div>
      </section>

      {/* Blog posts */}
      <section className="py-24 max-w-3xl mx-auto px-4 sm:px-6 space-y-24">

        {/* Post 2 */}
        <FadeIn>
          <article>
            <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">
              March 2026
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6 leading-snug">
              What Grief Actually Feels Like in the Body
            </h2>
            <div className="prose prose-lg max-w-none text-muted space-y-5 leading-relaxed">
              <p>You went to the doctor because something felt wrong. Maybe it was the tightness in your chest that wouldn&apos;t go away. Maybe it was the exhaustion that sleep couldn&apos;t touch. Maybe your hands wouldn&apos;t stop trembling, or you kept forgetting words mid-sentence, or your stomach had turned into a permanent knot.</p>
              <p>The tests came back normal. Your heart is fine. Your bloodwork is fine. Everything is fine.</p>
              <p>But nothing feels fine.</p>
              <p>If you&apos;re grieving, there&apos;s something important we want you to understand: your body is not malfunctioning. It&apos;s responding. Grief isn&apos;t just an emotional experience that lives in your heart or your mind—it takes up residence in your entire physical being. That heaviness in your limbs, the ache behind your eyes, the way your whole system seems to have slowed down or sped up without your permission—this is grief moving through your body. And it&apos;s far more common than most people realize.</p>
              <h4>The Physical Reality No One Warned You About</h4>
              <p>Our culture tends to treat grief as an emotional event. We expect tears, sadness, maybe some difficulty concentrating. What we don&apos;t expect is to suddenly feel like we&apos;re living in a stranger&apos;s body—one that doesn&apos;t respond the way it used to, doesn&apos;t have the energy it used to, doesn&apos;t feel safe or familiar anymore.</p>
              <p>But the research is clear: grief is a whole-body experience. It affects your nervous system, your immune function, your sleep architecture, your digestion, your muscle tension, your cognitive processing. This isn&apos;t metaphor. This is physiology.</p>
              <p>Dr. Mary-Frances O&apos;Connor, a grief researcher and author of <em>The Grieving Brain</em>, has spent years studying what happens in the body and brain during bereavement. Her research shows that grief activates the same neural pathways as physical pain. When you say your heart hurts, your brain is processing that statement more literally than you might think. The anterior cingulate cortex and the insula—regions involved in processing physical pain—light up during grief. Your body isn&apos;t being dramatic. It&apos;s being accurate.</p>
              <p>This is why so many grieving people find themselves in doctors&apos; offices, urgent care centers, even emergency rooms. The symptoms feel medical because, in many ways, they are. Grief researcher Dr. George Bonanno has documented that bereaved individuals show measurable changes in cortisol levels, inflammatory markers, and cardiovascular function. Your body is in a state of stress that doesn&apos;t have an off switch—at least not yet.</p>
              <h4>What You Might Be Experiencing</h4>
              <p>If you&apos;re grieving, some of these might sound familiar:</p>
              <p><strong>Exhaustion that doesn&apos;t respond to rest.</strong> You slept eight hours but woke up feeling like you ran a marathon. This is real. Grief taxes your system in ways that normal rest can&apos;t fully repair. Your body is doing enormous invisible work—processing, adapting, trying to make sense of a world that has fundamentally changed.</p>
              <p><strong>Chest tightness or heart palpitations.</strong> The connection between grief and heart health is so well-documented that researchers have a name for it: broken heart syndrome, or Takotsubo cardiomyopathy. This is a real cardiac event that mimics a heart attack and is often triggered by intense emotional stress. Not everyone experiences this, but many grieving people report chest sensations that feel alarming. If you&apos;re concerned, always get checked. But also know that chest tightness is one of the most commonly reported physical symptoms of grief.</p>
              <p><strong>Digestive issues.</strong> Your gut and your brain are in constant communication through what researchers call the gut-brain axis. Stress and grief can show up as nausea, loss of appetite, stomach pain, or changes in digestion. If food has lost its appeal or your stomach is in constant turmoil, grief may be the driver.</p>
              <p><strong>Muscle tension and pain.</strong> Grief often settles into the body as chronic tension—particularly in the shoulders, neck, back, and jaw. You may be clenching without realizing it. You may be bracing against the weight of what you&apos;re carrying. The body holds what the mind can&apos;t always process.</p>
              <p><strong>Cognitive fog.</strong> Forgetting appointments. Losing your keys constantly. Walking into a room and having no idea why you&apos;re there. This isn&apos;t early dementia (though many grieving people worry about exactly that). Dr. O&apos;Connor&apos;s research shows that grief temporarily affects working memory and executive function. Your brain is allocating its resources toward survival and meaning-making, which means the everyday logistics of life get less attention.</p>
              <p><strong>Sleep disruption.</strong> Maybe you can&apos;t fall asleep. Maybe you can&apos;t stay asleep. Maybe you&apos;re sleeping constantly but never feel rested. Sleep disturbance is one of the most consistent findings in grief research. Your nervous system is dysregulated, and sleep is often the first casualty.</p>
              <p><strong>Heightened startle response.</strong> Jumping at small sounds. Feeling on edge for no apparent reason. This is your nervous system stuck in a protective mode it can&apos;t seem to exit. When you&apos;ve experienced a significant loss, your brain often interprets the world as less safe than it did before.</p>
              <h4>Why This Matters</h4>
              <p>Understanding that grief is physical isn&apos;t just interesting information. It&apos;s permission.</p>
              <p>Permission to stop wondering what&apos;s wrong with you. Permission to stop pushing through as if your body isn&apos;t trying to tell you something. Permission to take symptoms seriously while also understanding their source.</p>
              <p>So many grieving people describe feeling like they&apos;re going crazy, falling apart, or failing at basic functioning. What they&apos;re actually experiencing is a normal physiological response to an abnormal amount of stress. Dr. Colin Murray Parkes, one of the pioneering researchers in bereavement, wrote extensively about grief as a psychosomatic process—one that affects mind and body together, inseparably.</p>
              <p>When you understand that your body is grieving too, you can start responding to it with compassion instead of frustration. You can stop berating yourself for not having enough energy. You can stop panicking that something is seriously wrong. You can start giving your body the care it&apos;s asking for.</p>
              <h4>What Helps</h4>
              <p>We want to be clear: we&apos;re not offering medical advice, and we&apos;re not suggesting that grief education replaces appropriate medical care. If you&apos;re experiencing physical symptoms, get them checked out. Rule out other causes. Take your body seriously.</p>
              <p>But alongside that, here are some things that research and lived experience suggest can help the grieving body:</p>
              <p><strong>Move gently.</strong> Not intense exercise that depletes you further, but gentle movement that reminds your body it&apos;s still here and still capable. Walking, stretching, slow yoga—anything that brings you back into your body without demanding too much of it.</p>
              <p><strong>Rest without guilt.</strong> Your body is doing hard work. It needs recovery time. Rest isn&apos;t laziness; it&apos;s necessity.</p>
              <p><strong>Eat as you can.</strong> Appetite often disappears in grief, or it becomes erratic. Eating small amounts frequently, even when nothing sounds appealing, can help stabilize your system.</p>
              <p><strong>Breathe intentionally.</strong> Your nervous system can be calmed through deliberate slow breathing. This isn&apos;t a cure, but it&apos;s a tool. Even a few minutes of slow, deep breaths can signal to your body that it&apos;s safe to rest.</p>
              <p><strong>Name what&apos;s happening.</strong> There&apos;s research supporting the power of naming your experience—what some researchers call &ldquo;affect labeling.&rdquo; When you can say, &ldquo;This is grief in my body,&rdquo; you create a small but meaningful distance between yourself and the sensation. It becomes something you&apos;re experiencing rather than something that&apos;s consuming you.</p>
              <h4>Your Body Is Telling the Truth</h4>
              <p>We live in a culture that separates mind from body, as if they operate independently. Grief makes a mockery of that division. It proves, in ways you feel with every cell, that your emotional reality and your physical reality are one and the same.</p>
              <p>Your aching body is not betraying you. It&apos;s telling the truth about what you&apos;ve been through. It&apos;s carrying a loss that has no adequate language—so it speaks in the language it has. Tension. Exhaustion. Pain. Disruption.</p>
              <p>The invitation isn&apos;t to silence those symptoms or rush past them. It&apos;s to listen to them with the same compassion you&apos;d offer someone you love. Your body is grieving. It deserves tenderness, patience, and time.</p>
              <p>You are not broken. You are not failing. You are not losing your mind.</p>
              <p>You are grieving—and your whole body is part of that process.</p>
              <p className="text-navy font-medium">Wayne and Jamie Simms are the founders of Tri-Pillars™ LLC and creators of the Live and Grieve™ program.</p>
            </div>
          </article>
        </FadeIn>

        {/* Post 1 */}
        <FadeIn>
          <article>
            <p className="text-gold text-xs uppercase tracking-widest mb-3 font-medium">
              March 2026
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl text-navy mb-6 leading-snug">
              Why We Stopped Believing in the Five Stages of Grief, and What
              We Built Instead
            </h2>
            <div className="prose prose-lg max-w-none text-muted space-y-5 leading-relaxed">
              <p>
                In 1969, Elisabeth Kübler-Ross published <em>On Death and
                Dying</em>. She described five emotional responses she observed
                in terminally ill patients: denial, anger, bargaining,
                depression, and acceptance. The book was groundbreaking. It gave
                language to something that had been unspeakable.
              </p>
              <p>
                But it was never about bereavement. It was about the
                experience of dying, not the experience of being left behind.
              </p>
              <p>
                Somewhere along the way, those five stages migrated. They became
                the dominant model for understanding grief in popular culture,
                in hospitals, in churches, and in therapist offices. People were
                told they would move through stages in order, arrive at
                acceptance, and be healed.
              </p>
              <p>
                That is not what the research shows.
              </p>
              <p>
                In the decades since, grief researchers like Margaret Stroebe
                and Henk Schut developed the Dual Process Model, which
                describes grief as an oscillation between confronting loss and
                rebuilding daily life. William Worden reframed grief as active
                work, not passive stages. Dennis Klass, Phyllis Silverman, and
                Steven Nickman demonstrated that maintaining a continuing bond
                with the deceased is healthy and normal.
              </p>
              <p>
                None of this is fringe science. These are the models taught in
                graduate programs and cited in peer-reviewed journals. But they
                have not reached the communities that need them most.
              </p>
              <p>
                That is what Live and Grieve is for. We took the best of what
                contemporary research says and built a 52-week, facilitator-led,
                community-based program that meets people where they are. Not
                with a checklist. Not with a timeline. With presence, structure,
                and the conviction that grief deserves better than what most
                people are getting.
              </p>
              <p className="text-navy font-medium">
                Wayne and Jamie Simms are the founders of Tri-Pillars™ LLC
                and creators of the Live and Grieve™ program.
              </p>
            </div>
          </article>
        </FadeIn>

      </section>
    </>
  );
}
