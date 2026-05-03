export interface PitchContent {
  headline: string;
  intro: string;
  points: { title: string; body: string }[];
  cta: string;
}

export const PITCH_CONTENT: Record<string, PitchContent> = {
  "Nonprofit / Community Organization": {
    headline: "Support your community through grief — with a proven framework.",
    intro: "Live and Grieve™ gives nonprofits and community organizations a structured, facilitator-led grief education program that goes beyond crisis support. Built on peer-reviewed research, it equips your organization to walk alongside grieving community members with confidence and consistency.",
    points: [
      {
        title: "Fill the gap between crisis support and long-term healing",
        body: "Most grief resources stop at crisis intervention. Live and Grieve™ gives your participants a 13-week structured journey through loss — from understanding grief's biology to rebuilding meaning and continuing bonds."
      },
      {
        title: "No clinical credentials required",
        body: "Your staff and volunteers don't need to be therapists. Live and Grieve™ trains facilitators to serve as compassionate companions — not fixers. The curriculum does the heavy lifting."
      },
      {
        title: "Serve more people, more consistently",
        body: "With a standardized curriculum, facilitator certification, and ready-to-use participant workbooks, your organization can run multiple groups simultaneously with consistent quality."
      },
      {
        title: "Outcomes you can report",
        body: "Built-in pre/post assessments and cohort data collection give your organization measurable outcomes to share with funders, boards, and stakeholders."
      },
      {
        title: "Affordable institutional licensing",
        body: "One institutional license covers unlimited cohorts run by your certified facilitators. No per-participant fees. No royalties."
      }
    ],
    cta: "Bring structured grief support to the people who count on you."
  },

  "Hospital / Hospice": {
    headline: "Structured grief education for the patients and families you serve.",
    intro: "Live and Grieve™ partners with hospitals, hospices, and palliative care programs to extend bereavement support beyond the clinical encounter. Our facilitator-led curriculum gives grief educators and social workers a structured, evidence-informed framework for group bereavement care.",
    points: [
      {
        title: "Designed for the clinical-adjacent setting",
        body: "Live and Grieve™ is structured grief education — not therapy. It complements clinical bereavement services without creating scope-of-practice conflicts. Your social workers, chaplains, and grief specialists can facilitate with confidence."
      },
      {
        title: "13-week structured curriculum",
        body: "Six modules cover the biology of grief, emotional processing, relationships, finding meaning, continuing bonds, and living forward. Participant workbooks guide each session. Facilitators receive complete session guides."
      },
      {
        title: "Supports CAHPS and bereavement quality metrics",
        body: "Structured, documented bereavement programming supports compliance with CMS bereavement requirements and strengthens quality reporting for hospice and palliative care accreditation."
      },
      {
        title: "Train your staff, not just one person",
        body: "Your institutional license covers certification for multiple facilitators. Build internal capacity that outlasts any single staff member."
      },
      {
        title: "Participant-centered, not provider-dependent",
        body: "The workbook-based design puts tools in participants' hands between sessions — extending the therapeutic value beyond the group setting."
      }
    ],
    cta: "Extend your bereavement care with a curriculum built for the communities you serve."
  },

  "Church / Faith Community": {
    headline: "Walk with your congregation through grief — with confidence.",
    intro: "Live and Grieve™ equips faith communities to provide structured, compassionate grief support to their members. Built on a companioning model that aligns naturally with pastoral care values, it gives your ministry team a complete framework for running a grief group — no clinical training required.",
    points: [
      {
        title: "Rooted in companioning, not counseling",
        body: "The Live and Grieve™ model is built on Alan Wolfelt's companioning philosophy — being present with grieving people rather than trying to fix or rush their grief. This aligns naturally with pastoral care and ministry."
      },
      {
        title: "Theologically neutral — you bring the faith",
        body: "The curriculum is designed to be used in faith communities of all traditions. The framework provides structure; your ministry team provides the spiritual context that fits your congregation."
      },
      {
        title: "Equip your lay leaders",
        body: "Your deacons, Stephen Ministers, grief ministry volunteers, or pastoral care team can become certified facilitators. No counseling degree required — just a heart for walking with people in pain."
      },
      {
        title: "Complete, ready-to-use program",
        body: "Facilitator training, session guides, participant workbooks, and a 13-week curriculum structure. Your team focuses on presence — the program handles the framework."
      },
      {
        title: "Serve your community beyond your congregation",
        body: "Many faith communities open their grief groups to the broader community. Your institutional license supports this — no per-participant fees, no limits on group size within your licensed program."
      }
    ],
    cta: "Give your congregation the grief support ministry they deserve."
  },

  "Corporate / EAP": {
    headline: "Structured grief support for your workforce — because loss doesn't stay home.",
    intro: "Live and Grieve™ gives HR teams, EAP providers, and corporate wellness programs a structured, facilitator-led grief education curriculum that supports employees through loss — reducing presenteeism, absenteeism, and the hidden costs of unaddressed grief in the workplace.",
    points: [
      {
        title: "Address the productivity impact of grief",
        body: "Research consistently shows that unaddressed grief costs U.S. employers over $75 billion annually in lost productivity. Structured grief support is not just a wellness benefit — it is a business investment."
      },
      {
        title: "Beyond the EAP referral",
        body: "Most EAP grief support ends at 3–6 sessions. Live and Grieve™ provides a 13-week structured journey that gives employees real tools — not just a referral and a hotline number."
      },
      {
        title: "No clinical credentialing required for your team",
        body: "HR generalists, wellness coordinators, and EAP counselors can become certified Live and Grieve™ facilitators. The curriculum provides structure; your team provides presence."
      },
      {
        title: "Confidential, structured, and evidence-informed",
        body: "The group format provides peer connection and shared experience. The structured curriculum ensures consistent quality. Pre/post assessments provide measurable outcomes for wellness reporting."
      },
      {
        title: "Scalable institutional licensing",
        body: "One license covers your entire organization. Run groups for employees across locations, departments, or divisions — no per-employee fees."
      }
    ],
    cta: "Support your employees through loss — and protect your organization's most valuable asset."
  },

  "Independent Facilitator": {
    headline: "Run your own Live and Grieve™ grief group — independently.",
    intro: "Live and Grieve™ offers a Group Use License for individual certified facilitators who want to run a community grief group independently — outside of an institutional setting.",
    points: [
      {
        title: "What the Group Use License includes",
        body: "The right to facilitate Live and Grieve™ groups in a community setting. Access to all facilitator materials, session guides, and participant workbook ordering. Ongoing support from the Tri-Pillars™ LLC network."
      },
      {
        title: "What it costs",
        body: "Group Use License fees are outlined in Schedule A, available upon request. Pricing is structured to be accessible for independent practitioners and community facilitators."
      },
      {
        title: "How to get certified",
        body: "Complete the Live and Grieve™ Facilitator Certification Training — available in community, professional, and ministry tracks. Training is offered as a cohort-based experience. Contact Wayne to discuss the next available cohort."
      }
    ],
    cta: "Ready to bring Live and Grieve™ to your community? Let's talk."
  }
};

export const PROGRAM_INTRO = {
  headline: "Structured grief support for the communities you serve.",
  p1: "Live and Grieve™ is a structured grief education program built on peer-reviewed research and real-world experience. Created by Wayne and Jamie Simms following the loss of their son Jacoby and nephew Ian, it gives organizations a complete, facilitator-led framework for walking alongside people through grief.",
  p2: "The program spans 13 weeks across six modules — from understanding grief's biology and emotional landscape, through relationships and meaning-making, to continuing bonds and living forward. It is designed for facilitators who want to be compassionate companions, not clinical experts.",
};
