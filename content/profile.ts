/** Single source of truth for résumé data: page, commands, AI prompt, and PDF. */

export type Role = {
  title: string;
  org: string;
  period: string;
  /** True when held concurrently with another current role. */
  concurrent?: boolean;
  bullets: string[];
};

export type SkillGroup = { label: string; items: string[]; ai?: boolean };
export type Cert = { name: string; year?: string; url?: string };
export type Education = { degree: string; school: string; period: string };

export type Profile = {
  name: string;
  roleLine: string;
  location: string;
  years: number;
  linkedin: string;
  headline: string;
  roles: Role[];
  skills: SkillGroup[];
  certs: Cert[];
  education: Education;
};

export const profile: Profile = {
  name: "Jed Gabriel Seno",
  roleLine: "COBOL Developer · AI Engineer · People Manager",
  location: "Philippines",
  years: 9,
  linkedin: "https://www.linkedin.com/in/jed-gabriel-seno/",
  headline:
    "Engineering leader with 9 years spanning COBOL mainframe development and people management, now driving AI adoption — agentic coding, multi-agent orchestration, and workflow automation.",

  roles: [
    {
      title: "DXC AI Champion",
      org: "DXC Technology — Insurance Philippines Software",
      period: "March 2026 — Present",
      concurrent: true,
      bullets: [
        "Built and shipped multiple MVPs via AI-assisted coding using Claude Code, GitHub Copilot, OpenAI Codex, and Google Antigravity, cutting prototype turnaround time significantly versus traditional development.",
        "Directed multiple Claude agents to build and host a full-stack web application on GCP, distributing tasks across agents to manage context window usage and cost.",
        "Designed and deployed workflow automations in N8N integrating MCPs across Google, ElevenLabs, Firecrawl, and other APIs.",
        "Orchestrated a multi-agent pipeline for CRM (Pipedrive) automation, covering prospect sourcing through meeting scheduling and deal creation.",
        "Hosted a live AI demo for the Insurance Philippines team, presenting to roughly 70 onsite and online attendees.",
      ],
    },
    {
      title: "Associate Manager",
      org: "DXC Technology — Insurance Philippines Software",
      period: "July 2025 — Present",
      concurrent: true,
      bullets: [
        "People manager and member of the DXC Insurance Software Philippines leadership team; lead the Insurance Engagement Committee, planning town halls, client visits, and team-building events.",
        "Managed team performance, resulting in 5 promotions and 7 salary increases, and helped grow organizational headcount by 6 FTE.",
      ],
    },
    {
      title: "Senior COBOL Mainframe Developer",
      org: "DXC Technology — Insurance Client",
      period: "August 2022 — Present",
      concurrent: true,
      bullets: [
        "Senior COBOL mainframe developer for a major American insurance client, covering new product development, enhancements, and production support.",
        "Resolved 10–15 bugs in Riders functionality affecting withdrawal processing for 200–300 insurance policies.",
        "Lead developer for a new regulatory product change and for a CICS field update impacting roughly 200–300 programs and 600–700 transactions.",
        "Lead contributor to AI-mainframe innovation projects, including a Copybook-to-CSV agent and a mainframe PDS/dataset explorer extension for VS Code.",
      ],
    },
    {
      title: "IT Analyst",
      org: "Tata Consultancy Services — Financial Services Client",
      period: "June 2021 — August 2022",
      bullets: [
        "Developed automated solutions that minimized production support toil, saving an average of 60–80 incident tickets and 40 hours weekly.",
        "Analyzed and resolved high-priority job abends, including effort estimation and downstream impact assessment.",
        "Trained new SRE team members, improving onboarding processes.",
      ],
    },
  ],

  skills: [
    {
      label: "AI Development",
      items: ["Anthropic Claude Code", "GitHub Copilot", "OpenAI Codex", "Google Gemini"],
      ai: true,
    },
    {
      label: "AI Orchestration",
      items: ["N8N", "MCP", "Multi-Agent Systems", "ElevenLabs"],
      ai: true,
    },
    {
      label: "Languages",
      items: ["COBOL", "JCL", "DB2", "CICS", "VSAM", "Natural", "Adabas", "REXX", "Easytrieve"],
    },
    {
      label: "Mainframe Tools",
      items: [
        "Endevor",
        "File-Aid",
        "SPUFI",
        "TSO",
        "Expediter",
        "Abend-AID",
        "Control-M",
        "ISPW",
        "XPTR",
      ],
    },
    { label: "Platforms", items: ["Microsoft Azure DevOps", "ServiceNow", "Microsoft Office"] },
    {
      label: "Management",
      items: ["People management", "Talent acquisition", "Team engagement leadership"],
    },
  ],

  certs: [
    {
      name: "Professional Scrum Master",
      year: "2023",
      url: "https://www.scrum.org/certificates/1030868",
    },
    {
      name: "AWS Certified Cloud Practitioner",
      url: "https://www.credly.com/badges/0725f7ea-31c8-492f-9967-24cd8e872ac3",
    },
    {
      name: "Google Project Management Certificate",
      url: "https://www.credly.com/badges/f3210c49-3f4a-43ae-bdf7-24b8bdaa1bc2/linked_in_profile",
    },
    { name: "LOMA 281 — Meeting Customer Needs With Insurance and Annuities" },
    { name: "DXC Leadership Edge — 4-day leadership workshop" },
  ],

  education: {
    degree: "BS Computer Engineering",
    school: "Lyceum of the Philippines University",
    period: "June 2011 — March 2016",
  },
};
