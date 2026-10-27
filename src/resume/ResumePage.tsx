import { resume, type RoleGroup, type School } from "./content";

function RoleBlock({ role }: { role: RoleGroup["roles"][number] }) {
  return (
    <article className="role">
      <div className="row">
        <span className="org">{role.org}</span>
        <h3>{role.title}</h3>
        <em>{role.dates}</em>
      </div>
      <p className="place">{role.place}</p>
      <ul>
        {role.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </article>
  );
}

function Group({ group }: { group: RoleGroup }) {
  return (
    <section className="section" aria-labelledby={group.id}>
      <h2 id={group.id} className="label">
        {group.label}
      </h2>
      <p className="section-detail">{group.detail}</p>
      {group.roles.map((role) => (
        <RoleBlock key={role.title} role={role} />
      ))}
    </section>
  );
}

function SchoolBlock({ school }: { school: School }) {
  return (
    <article className="role">
      <div className="row">
        <span className="org">{school.heroOrg}</span>
        <h3>{school.credential}</h3>
        <em>{school.dates}</em>
      </div>
      <p className="place">{school.school}</p>
    </article>
  );
}

export function ResumePage() {
  return (
    <main>
      <div className="page">
        <figure className="portrait">
          <img src="headshot.jpg" alt="Michael Morse" />
        </figure>
        <section className="copy">
          <p className="label">{resume.location}</p>
          <h1>{resume.name}</h1>
          <p className="deck">
            {resume.headlineLead} {resume.headlineRest}{" "}
            <span className="deck-more">{resume.deck}</span>
          </p>
          <div className="links">
            <a href={resume.githubHref}>{resume.githubLabel}</a>
            <span className="contact">{resume.contactLabel}</span>
          </div>
          <div className="rows">
            {resume.hero.map((line) => (
              <div className="row" key={`${line.org}-${line.title}`}>
                <span className="org">{line.org}</span>
                <strong>{line.title}</strong>
                <em>{line.dates}</em>
              </div>
            ))}
          </div>
          <div className="focus">
            <p className="label">{resume.selectedWorkLabel}</p>
            <p>{resume.selectedWork}</p>
          </div>
        </section>
      </div>
      <div className="rest">
        <section className="section" aria-labelledby="summary">
          <h2 id="summary" className="label">
            Summary
          </h2>
          <p className="prose">{resume.summary}</p>
        </section>
        <Group group={resume.experience} />
        <Group group={resume.military} />
        <section className="section" aria-labelledby="education">
          <h2 id="education" className="label">
            Education
          </h2>
          {resume.education.map((school) => (
            <SchoolBlock key={school.school} school={school} />
          ))}
        </section>
        <section className="section" aria-labelledby="skills">
          <h2 id="skills" className="label">
            Skills
          </h2>
          {resume.skills.map((group) => (
            <div className="skill" key={group.label}>
              <h3>{group.label}</h3>
              <p>{group.detail}</p>
            </div>
          ))}
        </section>
        <section className="section" aria-labelledby="certifications">
          <h2 id="certifications" className="label">
            Certifications
          </h2>
          <ul className="certs">
            {resume.certifications.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
