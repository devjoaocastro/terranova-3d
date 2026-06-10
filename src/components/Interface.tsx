import { scrollToPage } from '../scrollBus'

function Marquee({ text }: { text: string }) {
  const chunk = Array(6).fill(text).join('  ')
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        <span>{chunk}</span>
        <span>{chunk}</span>
      </div>
    </div>
  )
}

export default function Interface() {
  return (
    <div className="interface">
      {/* 0 — Hero */}
      <section className="section section--center section--hero">
        <p className="tagline">Real estate for the next century · Lisbon</p>
        <h1 className="hero-title">
          We shape tomorrow's
          <br />
          <em>skylines</em>.
        </h1>
        <p className="hero-sub">
          Four decades building places people love to live in.
          <br />
          Lisbon · Porto · Madrid · São Paulo
        </p>
        <button className="cta" onClick={() => scrollToPage(1)}>
          Begin the flight ↓
        </button>
        <div className="scroll-hint">
          <span className="scroll-hint__line" />
          <span className="scroll-hint__label">scroll</span>
        </div>
      </section>

      {/* 1 — Vision */}
      <section className="section section--left" data-num="01">
        <p className="kicker">01 — Vision</p>
        <h2>
          We build the future
          <br />
          of <em>living</em>.
        </h2>
        <p className="body">
          Residential, commercial, industrial — 45 developments that treat the city as a
          living organism, not a grid to fill. Watch it rise around you as you move.
        </p>
      </section>

      {/* 2 — Intention */}
      <section className="section section--right" data-num="02">
        <p className="kicker">02 — Intention</p>
        <h2>
          We shape land
          <br />
          with <em>intention</em>.
        </h2>
        <p className="body">
          Every square meter is a promise. We work with the city — its light, its river,
          its people — never against it.
        </p>
      </section>

      {/* 3 — Territory */}
      <section className="section section--top" data-num="03">
        <p className="kicker">03 — Territory</p>
        <h2>
          Explore the <em>territory</em>.
        </h2>
        <p className="hint">→ hover the district markers</p>
      </section>

      {/* 4 — Developments */}
      <section className="section section--top" data-num="04">
        <p className="kicker">04 — Developments</p>
        <h2>
          Selected <em>developments</em>.
        </h2>
        <ul className="projects">
          <li>
            <em>AURA TOWER</em> — Riverside · 2027
          </li>
          <li>
            <em>MIRADOR</em> — Old Town · 2026
          </li>
          <li>
            <em>LUMEN BAY</em> — Atlantic Coast · 2028
          </li>
        </ul>
      </section>

      {/* 5 — Legacy */}
      <section className="section section--center" data-num="05">
        <Marquee text="1984 — 2026 — TERRANOVA —" />
        <p className="kicker">05 — Legacy</p>
        <h2>
          Since <em>1984</em>.
        </h2>
        <div className="stats">
          <div>
            <strong>45</strong>
            <span>developments</span>
          </div>
          <div>
            <strong>12,400</strong>
            <span>homes</span>
          </div>
          <div>
            <strong>4</strong>
            <span>cities</span>
          </div>
        </div>
      </section>

      {/* 6 — Contact */}
      <section className="section section--center" data-num="06">
        <p className="kicker">06 — Contact</p>
        <h2>
          Build the <em>improbable</em>
          <br />
          with us.
        </h2>
        <a className="cta cta--big" href="mailto:hello@terranova.city">
          hello@terranova.city
        </a>
        <footer className="footer">
          <span>TERRANOVA® {new Date().getFullYear()}</span>
          <span>Lisbon — facing the river</span>
        </footer>
      </section>
    </div>
  )
}
