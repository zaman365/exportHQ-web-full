import {
  BadgeCheck,
  FileCheck2,
  Globe2,
  LayoutDashboard,
  PackageCheck,
  ShieldCheck,
  TrendingUp,
  UsersRound
} from "lucide-react";

const RAIL = [LayoutDashboard, ShieldCheck, UsersRound, PackageCheck, TrendingUp];

function HealthGauge({ value }: { value: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const filled = (Math.max(0, Math.min(100, value)) / 100) * circumference;

  return (
    <svg className="gauge" viewBox="0 0 80 80" role="img" aria-label={`Export health score ${value} out of 100`}>
      <circle className="gauge-track" cx="40" cy="40" r={radius} />
      <circle
        className="gauge-fill"
        cx="40"
        cy="40"
        r={radius}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeDashoffset={circumference * 0.25}
      />
      <text className="gauge-value" x="40" y="40" textAnchor="middle" dominantBaseline="central">
        {value}
      </text>
    </svg>
  );
}

/** Illustrative product surface shown in the hero. Static by design — no live data. */
export function Console() {
  return (
    <figure className="console">
      <div className="console-chrome">
        <span className="chrome-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="chrome-path">
          Export programme <em>/</em> <b>Germany entry</b>
        </span>
        <span className="chrome-live">
          <i aria-hidden="true" /> Live
        </span>
      </div>

      <div className="console-body">
        <div className="console-rail" aria-hidden="true">
          <span className="rail-mark">EH</span>
          {RAIL.map((Icon, index) => (
            <span key={Icon.displayName ?? index} className={index === 0 ? "rail-item is-active" : "rail-item"}>
              <Icon size={16} strokeWidth={1.75} />
            </span>
          ))}
        </div>

        <div className="console-main">
          <header className="console-head">
            <div>
              <p className="data-label">Export health</p>
              <p className="console-score">
                82<span>/100</span>
              </p>
            </div>
            <HealthGauge value={82} />
          </header>

          <div className="console-stats">
            <div className="stat is-primary">
              <p className="data-label">Priority market</p>
              <p className="stat-value">
                <Globe2 size={16} strokeWidth={1.9} /> Germany
              </p>
            </div>
            <div className="stat">
              <p className="data-label">Open actions</p>
              <p className="stat-value">7</p>
              <p className="stat-note">3 with Export HQ</p>
            </div>
            <div className="stat">
              <p className="data-label">Buyer pipeline</p>
              <p className="stat-value">12</p>
              <p className="stat-note">4 qualified</p>
            </div>
          </div>

          <div className="console-milestone">
            <span className="milestone-icon" aria-hidden="true">
              <FileCheck2 size={18} strokeWidth={1.8} />
            </span>
            <span className="milestone-copy">
              <span className="data-label">Next milestone</span>
              <strong>Market requirements signed off</strong>
              <em>Export HQ · Due Friday</em>
            </span>
            <BadgeCheck size={20} strokeWidth={1.7} aria-hidden="true" />
          </div>

          <div className="console-team">
            <span className="team-avatars" aria-hidden="true">
              <i>AM</i>
              <i>RA</i>
              <i>LW</i>
            </span>
            <span className="team-copy">
              <strong>Your accountable export team</strong>
              <small>Market · Compliance · Trade operations</small>
            </span>
            <span className="team-status">
              <i aria-hidden="true" /> Online
            </span>
          </div>
        </div>
      </div>
      <figcaption className="sr-only">
        Illustration of the Export HQ workspace showing export health, priority market, open actions, buyer pipeline and the next
        milestone.
      </figcaption>
    </figure>
  );
}
