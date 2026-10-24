interface Props {
  repo: string;
  dataVersion: string;
}

export default function Footer({ repo, dataVersion }: Props) {
  return (
    <footer className="app-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <strong>Elden Ring Damage Calculator</strong>
          <p>Compare weapons and explore your build. Free, open source, and calculated entirely in your browser.</p>
          <p className="footer-stack">Built with TypeScript, React and Vite.</p>
        </div>
        <nav aria-label="Project">
          <h3>Project</h3>
          <ul>
            <li><a href={repo}>Source code</a></li>
            <li><a href={`${repo}/issues`}>Report an issue</a></li>
            <li><a href={`${repo}/blob/main/docs/formula.md`}>How the calculations work</a></li>
            <li><a href={`${repo}/blob/main/LICENSE`}>MIT license</a></li>
          </ul>
        </nav>
        <nav aria-label="Credits">
          <h3>Credits and data</h3>
          <p className="footer-data-version">Weapon data · Patch {dataVersion}</p>
          <p>
            Data and scaling-curve evaluation from{" "}
            <a href="https://github.com/ThomasJClark/elden-ring-weapon-calculator">elden-ring-weapon-calculator</a>
            {" "}by Tom Clark (MIT).
          </p>
        </nav>
      </div>
      <div className="footer-developer">
        <div>
          <span className="footer-eyebrow">Designed & developed by</span>
          <strong>Raed Jani</strong>
        </div>
        <nav className="footer-profiles" aria-label="Developer profiles">
          <a href="https://github.com/Raed-Jani" target="_blank" rel="noopener noreferrer" aria-label="Raed Jani on GitHub (opens in a new tab)">
            GitHub <span aria-hidden="true">↗</span>
          </a>
          <a href="https://www.linkedin.com/in/raed-jani-635005383/" target="_blank" rel="noopener noreferrer" aria-label="Raed Jani on LinkedIn (opens in a new tab)">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
              <path d="M5.4 7.6H2V22h3.4V7.6ZM3.7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM22 13.3c0-4.3-2.3-6.3-5.3-6.3a4.6 4.6 0 0 0-4.1 2.3V7.6H9.2V22h3.4v-8c0-2.1 1-3.4 2.9-3.4 1.8 0 2.7 1.2 2.7 3.4v8H22v-8.7Z" />
            </svg>
            LinkedIn <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </div>
      <div className="footer-legal">
        <p>© {new Date().getFullYear()} Raed Jani</p>
        <p>
          Fan-made, non-commercial project. Not affiliated with or endorsed by FromSoftware or Bandai
          Namco. ELDEN RING, its game data, names and icons belong to FromSoftware / Bandai Namco.
        </p>
      </div>
    </footer>
  );
}
