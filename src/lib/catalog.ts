// The catalog: three directions, each with a few professions to test-drive.
// Every profession opens its own mentor session. `practice` decides which
// practice widget the mentor hands out: a code runner or a written task.

import { PAY, type RolePay } from "./pay";

export type DirectionId = "programming" | "design" | "management";
export type PracticeKind = "python" | "javascript" | "written";

export interface RoleBrief {
  summary: string;
  responsibilities: string[];
  qualifications: string[];
  skills: string[];
}

export interface Profession {
  slug: string;
  name: string;
  direction: DirectionId;
  practice: PracticeKind;
  brief: RoleBrief;
  pay: RolePay | null;
}

export interface Direction {
  id: DirectionId;
  name: string;
  blurb: string;
}

export const DIRECTIONS: Direction[] = [
  {
    id: "programming",
    name: "Programming",
    blurb: "Write real code in your first session. It runs right in the browser.",
  },
  {
    id: "design",
    name: "Design & marketing",
    blurb: "Design screens, write campaigns, and explain your choices.",
  },
  {
    id: "management",
    name: "Management",
    blurb: "Close deals, run projects, decide what a product does next.",
  },
];

type ProfessionSeed = Omit<Profession, "pay">;

const SEEDS: ProfessionSeed[] = [
  {
    slug: "backend-engineer",
    name: "Backend engineer",
    direction: "programming",
    practice: "python",
    brief: {
      summary: "Builds the server side of apps: the data, the business rules and the APIs that web and mobile screens talk to.",
      responsibilities: [
        "Build and maintain APIs that apps call",
        "Design database tables and write queries",
        "Fix bugs reported by users and other engineers",
        "Write automated tests and review teammates' code",
      ],
      qualifications: [
        "Comfortable with one backend language (Python, JavaScript, Go or Java)",
        "Basic SQL and how HTTP requests work",
        "A portfolio of 2-3 small projects on GitHub; a CS degree is common but not required",
      ],
      skills: ["Python", "SQL", "REST APIs", "Git", "Testing", "Debugging"],
    },
  },
  {
    slug: "frontend-developer",
    name: "Frontend developer",
    direction: "programming",
    practice: "javascript",
    brief: {
      summary: "Builds what users see and click in the browser, turning designs into fast, accessible pages.",
      responsibilities: [
        "Turn designs into working pages and components",
        "Connect pages to backend APIs",
        "Make pages fast, accessible and mobile-friendly",
        "Fix layout and interaction bugs across browsers",
      ],
      qualifications: [
        "HTML, CSS and modern JavaScript",
        "Experience with one framework, usually React",
        "A portfolio of live sites you built",
      ],
      skills: ["JavaScript", "React", "CSS", "Accessibility", "Git", "APIs"],
    },
  },
  {
    slug: "data-analyst",
    name: "Data analyst",
    direction: "programming",
    practice: "python",
    brief: {
      summary: "Answers business questions with data: pulls numbers, finds the pattern, and explains what to do about it.",
      responsibilities: [
        "Pull and clean data from databases and spreadsheets",
        "Build dashboards and weekly reports",
        "Analyze why a metric moved and present findings",
        "Help teams design and read A/B tests",
      ],
      qualifications: [
        "Strong Excel; SQL; basic Python or R",
        "Comfort with statistics fundamentals",
        "Accounting and finance backgrounds transfer well",
      ],
      skills: ["SQL", "Python", "Excel", "Dashboards", "Statistics", "Storytelling"],
    },
  },
  {
    slug: "product-designer",
    name: "Product designer",
    direction: "design",
    practice: "written",
    brief: {
      summary: "Decides how a product works and looks, from the user's problem to the final screen, and tests it with real people.",
      responsibilities: [
        "Map user problems and flows before drawing screens",
        "Design wireframes and high-fidelity screens in Figma",
        "Run quick usability tests and iterate",
        "Present and defend design decisions to the team",
      ],
      qualifications: [
        "A portfolio with 2-3 case studies showing your process",
        "Figma, basic UX research methods",
        "Clear written and spoken communication",
      ],
      skills: ["Figma", "User flows", "Usability testing", "Visual design", "Prototyping"],
    },
  },
  {
    slug: "marketing-specialist",
    name: "Marketing specialist",
    direction: "design",
    practice: "written",
    brief: {
      summary: "Finds the right customers and gets them to try the product, through ads, email, content and experiments.",
      responsibilities: [
        "Plan and launch campaigns across ads, email and social",
        "Write copy and brief designers on creative",
        "Track cost per customer and campaign results",
        "Run experiments to improve conversion",
      ],
      qualifications: [
        "Strong writing; comfort with numbers and spreadsheets",
        "Experience with ad platforms or email tools helps",
        "A portfolio of campaigns, even small or personal ones",
      ],
      skills: ["Copywriting", "Paid ads", "Email", "Analytics", "A/B testing"],
    },
  },
  {
    slug: "graphic-designer",
    name: "Graphic designer",
    direction: "design",
    practice: "written",
    brief: {
      summary: "Creates the visuals of a brand: logos, ads, social posts, presentations and packaging.",
      responsibilities: [
        "Design social, ad and print visuals to a brief",
        "Keep work consistent with brand guidelines",
        "Prepare files for print and web",
        "Take feedback and iterate quickly",
      ],
      qualifications: [
        "A strong portfolio matters more than a degree",
        "Figma or Adobe tools",
        "Typography, color and layout fundamentals",
      ],
      skills: ["Typography", "Layout", "Color", "Figma", "Adobe", "Branding"],
    },
  },
  {
    slug: "business-development-manager",
    name: "Business development manager",
    direction: "management",
    practice: "written",
    brief: {
      summary: "Finds new customers and partners, starts the conversation, and turns interest into signed deals.",
      responsibilities: [
        "Research target companies and decision makers",
        "Write outreach and book discovery calls",
        "Run calls, handle objections, send proposals",
        "Keep the pipeline up to date in a CRM",
      ],
      qualifications: [
        "Clear writing and confident conversation",
        "Experience in any customer-facing role transfers well",
        "Comfort with targets and rejection",
      ],
      skills: ["Prospecting", "Cold email", "Discovery calls", "Negotiation", "CRM"],
    },
  },
  {
    slug: "product-manager",
    name: "Product manager",
    direction: "management",
    practice: "written",
    brief: {
      summary: "Decides what the team builds next and why, balancing what users need with what the business needs.",
      responsibilities: [
        "Talk to users and turn problems into priorities",
        "Write clear specs and success metrics",
        "Work daily with engineers and designers",
        "Decide trade-offs and explain them to leadership",
      ],
      qualifications: [
        "Experience in any role close to customers or data",
        "Structured thinking and clear writing",
        "Basic data skills (spreadsheets, SQL helps)",
      ],
      skills: ["Prioritization", "Specs", "User research", "Metrics", "Communication"],
    },
  },
  {
    slug: "project-manager",
    name: "Project manager",
    direction: "management",
    practice: "written",
    brief: {
      summary: "Gets projects done on time and on budget by planning the work, tracking it and clearing blockers.",
      responsibilities: [
        "Break projects into tasks with owners and dates",
        "Run status meetings and update stakeholders",
        "Spot risks early and adjust the plan",
        "Track budget and scope changes",
      ],
      qualifications: [
        "Organized, calm under deadlines",
        "Experience coordinating people in any field",
        "PMP or Scrum certificates help but aren't required",
      ],
      skills: ["Planning", "Risk tracking", "Stakeholder updates", "Jira", "Budgeting"],
    },
  },
];

export const PROFESSIONS: Profession[] = SEEDS.map((s) => ({ ...s, pay: PAY[s.slug] ?? null }));

export const getDirection = (id: DirectionId) => DIRECTIONS.find((d) => d.id === id)!;

export const professionsIn = (id: DirectionId) => PROFESSIONS.filter((p) => p.direction === id);

export const getProfession = (slug: string) => PROFESSIONS.find((p) => p.slug === slug);
