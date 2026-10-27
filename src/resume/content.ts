export type HeroLine = {
  org: string;
  title: string;
  dates: string;
};

export type Role = HeroLine & {
  place: string;
  bullets: readonly string[];
};

export type RoleGroup = {
  id: string;
  label: string;
  detail: string;
  roles: readonly Role[];
};

export type School = {
  heroOrg: string;
  heroTitle: string;
  school: string;
  credential: string;
  dates: string;
};

export type SkillGroup = {
  label: string;
  detail: string;
};

const hubspotManager: Role = {
  org: "HubSpot",
  title: "Technical Manager, Marketing Technology",
  dates: "April 2023–Present",
  place: "Cambridge, MA / Remote",
  bullets: [
    "Built and shipped a production full-stack Workato error dashboard using React and Java, centralizing failure alerts and bulk remediation for daily team use; expanded automated test coverage and modernized the service runtime.",
    "Led the Workato implementation for an AI-generated events recommendation program serving a broad customer audience on a recurring cadence; designed enrollment and control logic, local-time delivery, API integration, architecture documentation, and AI-output QA.",
    "Automated post-project documentation with a Workato and OpenAI pipeline that gathers Asana and Google Docs content and publishes formatted Confluence pages, reducing manual effort and earning adoption in the team’s project template.",
    "Architected a Claude Code and Workato CLI “Recipe Factory” that converts automation intake requests into plans and scaffolded recipes, then added builder, QA, validation, and review agents with bounded escalation for human oversight.",
    "Expanded self-paced onboarding for Enterprise and Japanese customers, including comprehensive language-routing logic and a carefully monitored production cutover.",
    "Served as Marketing point of contact for an Amplitude-to-Snowflake-to-Census-to-HubSpot data pipeline that made product-usage signals available for AI-personalized email programs.",
    "Automated Looker cleanup with Python, migrating Look assets, mapping Workato dependencies, and publishing a reusable runbook.",
  ],
};

const hubspotSupport: Role = {
  org: "HubSpot",
  title: "Senior Customer Support Specialist",
  dates: "November 2019–April 2023",
  place: "Cambridge, MA / Remote",
  bullets: [
    "Diagnosed and resolved complex HubSpot software and integration issues using HTML, CSS, JavaScript, Python, SQL, APIs, and browser-development tools; escalated reproducible product defects to engineering.",
    "Selected as a top performer to lead a North America-wide new-hire pilot that reduced time to ramp and increased internal NPS; built an automated data-collection system and coached new hires.",
    "Trained multiple teams on CMS and API troubleshooting and served as a subject-matter expert for automation, CMS, APIs, and technical documentation.",
  ],
};

const cyberAnalyst: Role = {
  org: "Air National Guard",
  title: "Cyber Intelligence Analyst",
  dates: "December 2022–Present",
  place: "Otis ANGB",
  bullets: [
    "Identify and interpret threat-warning data and deliver force-protection and intelligence insights to commanders; support Computer Network Operations and apply information-security procedures.",
    "Built and packaged portable AI tools for cyber-intelligence use during military orders and prepared an AI project portfolio for the DAF–MIT AI Accelerator Phantom program.",
  ],
};

const flightEngineer: Role = {
  org: "Air Force Reserve",
  title: "C-5M Aircraft Flight Engineer",
  dates: "November 2015–December 2022",
  place: "Westover ARB",
  bullets: [
    "Managed complex aircraft systems, troubleshot in-flight emergencies, and advised aircraft commanders on risk mitigation during global airlift missions.",
  ],
};

const sensorOperator: Role = {
  org: "Air Force Reserve",
  title: "Remotely Piloted Aircraft Sensor Operator",
  dates: "November 2010–November 2015",
  place: "Creech AFB",
  bullets: [
    "Employed airborne sensors to acquire, track, and monitor airborne, maritime, and ground targets during intelligence, surveillance, and reconnaissance operations.",
  ],
};

const umass: School = {
  heroOrg: "UMass Lowell",
  heroTitle: "M.S. Information Technology",
  school: "University of Massachusetts Lowell",
  credential: "Master of Science in Information Technology",
  dates: "May 2026",
};

const snhu: School = {
  heroOrg: "Southern New Hampshire University",
  heroTitle: "B.A. General Studies",
  school: "Southern New Hampshire University",
  credential:
    "Bachelor of Arts in General Studies, Concentration in Computer Programming",
  dates: "2021",
};

const ccaf: School = {
  heroOrg: "Community College of the Air Force",
  heroTitle: "A.A.S. Air and Space Operations",
  school: "Community College of the Air Force",
  credential: "Associate of Applied Science in Air and Space Operations",
  dates: "2017",
};

function heroRole(role: Role): HeroLine {
  return { org: role.org, title: role.title, dates: role.dates };
}

function heroSchool(school: School): HeroLine {
  return {
    org: school.heroOrg,
    title: school.heroTitle,
    dates: school.dates,
  };
}

export const resume = {
  name: "Michael Morse",
  location: "Framingham, MA",
  headlineLead: "Marketing Technology Specialist.",
  headlineRest: "Automation, AI and Systems Engineering.",
  deck: "Marketing technology specialist and automation engineer experienced in HubSpot, Workato, AI-assisted workflows, full-stack tooling, and U.S. Air Force cyber operations.",
  githubHref: "https://github.com/mmorsecode",
  githubLabel: "github.com/mmorsecode",
  contactLabel: "Contact",
  selectedWorkLabel: "Selected work",
  selectedWork:
    "Built and shipped a production Workato error dashboard with React and Java. Led Workato for an AI-generated events recommendation program. Architected a Claude Code and Workato CLI Recipe Factory.",
  summary:
    "Marketing technology specialist and automation engineer with extensive experience at HubSpot and in U.S. Air Force service. Designs and operates Workato and HubSpot systems spanning lifecycle marketing, AI-personalized programs, production reliability, and internal developer tooling. Builds practical AI-assisted workflows and full-stack tools, translates complex requirements into production systems, and documents solutions for adoption across technical and nontechnical teams.",
  hero: [
    heroRole(hubspotManager),
    heroRole(hubspotSupport),
    heroRole(cyberAnalyst),
    heroSchool(umass),
  ],
  experience: {
    id: "experience",
    label: "Experience",
    detail: "HubSpot, Cambridge, MA / Remote",
    roles: [hubspotManager, hubspotSupport],
  } satisfies RoleGroup,
  military: {
    id: "military",
    label: "Military",
    detail: "United States Air Force and Air National Guard",
    roles: [cyberAnalyst, flightEngineer, sensorOperator],
  } satisfies RoleGroup,
  education: [umass, snhu, ccaf],
  skills: [
    {
      label: "Automation and integration",
      detail:
        "Workato, Workato CLI and Developer API, HubSpot workflows and custom-coded actions, REST APIs, webhooks, Census, Slack apps, PagerDuty",
    },
    {
      label: "AI and agentic systems",
      detail:
        "Claude Code, OpenAI API, prompt design, multi-agent workflows, MCP, Workato AIRO, Glean",
    },
    {
      label: "Data and software engineering",
      detail:
        "SQL, Snowflake, Python, JavaScript, React, Java, HTML/CSS, Git/GitHub, automated testing, CI/CD, Looker, Amplitude",
    },
    {
      label: "Delivery and leadership",
      detail:
        "Requirements and PRDs, solution design, QA, production cutover, monitoring, technical documentation, enablement, stakeholder management",
    },
  ] satisfies readonly SkillGroup[],
  certifications: [
    "Workato Certified Chef",
    "Workato Automation Pro",
    "General Assembly Front End Web Development",
    "HubSpot Analyst Foundations",
  ],
};
