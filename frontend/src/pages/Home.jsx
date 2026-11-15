import {
  ArrowRight,
  ArrowUpRight,
  Moon,
  Sun,
  Heart,
  ShieldCheck,
  Sparkles,
  Clock,
  Check,
  Menu,
} from "lucide-react";

import "./Home.css";


import "./Home.css";

const features = [
  {
    icon: Moon,
    title: "Sleep Compatibility",
    description:
      "Find someone whose sleeping and waking schedule naturally aligns with yours.",
  },
  {
    icon: Heart,
    title: "Lifestyle Matching",
    description:
      "Match through cleanliness, social habits, food preferences and daily routines.",
  },
  {
    icon: ShieldCheck,
    title: "Safer Connections",
    description:
      "Build meaningful connections with verified profiles and safety-focused tools.",
  },
];

const matches = [
  {
    name: "Aarav",
    role: "Software Developer",
    sleep: "11:00 PM",
    wake: "7:00 AM",
    score: 96,
    initials: "A",
    color: "#DCE9DF",
  },
  {
    name: "Riya",
    role: "Design Student",
    sleep: "11:30 PM",
    wake: "7:30 AM",
    score: 91,
    initials: "R",
    color: "#F1E1D5",
  },
];

function Navbar() {
  return (
    <nav className="navbar">
      <a href="#" className="brand">
        nivora<span>.</span>
      </a>

      <div className="nav-links">
        <a href="#how-it-works">How it works</a>
        <a href="#features">Features</a>
        <a href="#matching">Discover</a>
      </div>

      <div className="nav-actions">
        <a href="#login" className="login-link">Log in</a>
        <a href="#signup" className="nav-cta">
          Get started <ArrowUpRight size={16} />
        </a>
      </div>

      <button className="mobile-menu" aria-label="Open menu">
        <Menu />
      </button>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero container">
      <div className="hero-content">
        <div className="eyebrow">
          <Sparkles size={15} />
          A BETTER WAY TO LIVE TOGETHER
        </div>

        <h1>
          Your space.
          <br />
          Your <span>rhythm.</span>
          <br />
          Your people.
        </h1>

        <p className="hero-description">
          Finding a roommate shouldn't be a gamble.
          Discover people who match your lifestyle,
          daily habits and the little things that make
          a house feel like home.
        </p>

        <div className="hero-buttons">
          <a href="#signup" className="primary-button">
            Find your match <ArrowRight size={18} />
          </a>

          <a href="#how-it-works" className="secondary-button">
            Explore how it works
          </a>
        </div>

        <div className="hero-trust">
          <div className="trust-icon">
            <Heart size={16} />
          </div>
          <p>Better compatibility. Happier shared living.</p>
        </div>
      </div>

      <div className="hero-visual">
        <div className="visual-background"></div>

        <div className="floating-label label-top">
          <Moon size={16} />
          <span>Early sleeper</span>
        </div>

        <div className="visual-card">
          <div className="visual-card-header">
            <span>YOUR LIFESTYLE MATCH</span>
            <Sparkles size={17} />
          </div>

          <div className="match-percentage">
            <strong>96%</strong>
            <span>Compatibility</span>
          </div>

          <div className="match-divider"></div>

          <div className="person-details">
            <div className="person-avatar">A</div>
            <div>
              <h3>Aarav Sharma</h3>
              <p>Software Developer · Indore</p>
            </div>
            <div className="verified">
              <Check size={15} />
            </div>
          </div>

          <div className="routine">
            <div>
              <Moon size={17} />
              <span>Sleep</span>
              <strong>11:00 PM</strong>
            </div>

            <div>
              <Sun size={17} />
              <span>Wake up</span>
              <strong>7:00 AM</strong>
            </div>
          </div>

          <div className="match-message">
            <Sparkles size={15} />
            Your daily routines align beautifully!
          </div>

          <button className="preview-button">
            View compatibility <ArrowRight size={16} />
          </button>
        </div>

        <div className="floating-label label-bottom">
          <Clock size={16} />
          Same sleep schedule
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="stats container">
      <div>
        <strong>01</strong>
        <span>Understand your lifestyle</span>
      </div>
      <div>
        <strong>02</strong>
        <span>Discover compatible people</span>
      </div>
      <div>
        <strong>03</strong>
        <span>Build a better living experience</span>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="features-section" id="features">
      <div className="container">
        <div className="section-heading">
          <span className="section-label">NOT JUST A ROOMMATE FINDER</span>
          <h2>
            Compatibility goes
            <br />
            <span>beyond rent.</span>
          </h2>
          <p>
            The little things matter when you share a space.
            We help you find someone who gets your lifestyle.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <article className="feature-card" key={feature.title}>
                <div className="feature-icon">
                  <Icon size={23} />
                </div>

                <span className="feature-number">
                  0{index + 1}
                </span>

                <h3>{feature.title}</h3>
                <p>{feature.description}</p>

                <ArrowUpRight className="feature-arrow" size={20} />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Matching() {
  return (
    <section className="matching-section container" id="matching">
      <div className="matching-content">
        <span className="section-label">MEET YOUR KIND OF PEOPLE</span>

        <h2>
          Your next roommate
          <br />
          might be <span>one match away.</span>
        </h2>

        <p>
          Forget endless scrolling through random profiles.
          Discover people based on the way you actually live.
        </p>

        <a href="#signup" className="primary-button">
          Discover your matches <ArrowRight size={18} />
        </a>
      </div>

      <div className="matching-cards">
        {matches.map((person) => (
          <article className="match-card" key={person.name}>
            <div
              className="match-avatar"
              style={{ background: person.color }}
            >
              {person.initials}
            </div>

            <div className="match-info">
              <h3>{person.name}</h3>
              <p>{person.role}</p>

              <div className="match-routine">
                <span><Moon size={13} /> {person.sleep}</span>
                <span><Sun size={13} /> {person.wake}</span>
              </div>
            </div>

            <div className="match-score">
              <strong>{person.score}%</strong>
              <span>Match</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    ["01", "Tell us about you", "Share your daily routine, sleeping habits and living preferences."],
    ["02", "Discover your matches", "Explore people who share your lifestyle and living expectations."],
    ["03", "Connect & move in", "Start conversations and find a space where you belong."],
  ];

  return (
    <section className="how-section" id="how-it-works">
      <div className="container">
        <div className="section-heading centered">
          <span className="section-label">SIMPLE BY DESIGN</span>
          <h2>Three steps to a <span>better home.</span></h2>
        </div>

        <div className="steps-grid">
          {steps.map(([number, title, description]) => (
            <article className="step-card" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="cta-section container" id="signup">
      <div className="cta-content">
        <span className="section-label">YOUR NEXT CHAPTER STARTS HERE</span>
        <h2>
          A better roommate.
          <br />
          A better <span>everyday.</span>
        </h2>

        <p>
          Because feeling at home starts with the people
          you share it with.
        </p>

        <a href="#login" className="cta-button">
          Find your people <ArrowRight size={18} />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <a href="#" className="brand footer-brand">
            nivora<span>.</span>
          </a>
          <p>Find your rhythm. Find your people.</p>
        </div>

        <div className="footer-socials">
          <a href="https://instagram.com" target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© 2026 NIVORA. All rights reserved.</span>
        <span>Made for better living.</span>
      </div>
    </footer>
  );
}

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Matching />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

export default Home;