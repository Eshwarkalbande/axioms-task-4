import { useEffect, useState } from "react";
import "./App.css";

const pad = (n) => String(n).padStart(2, "0");
const formatDMY = (d) =>
  `${pad(d.getDate())} - ${pad(d.getMonth() + 1)} - ${d.getFullYear()}`;
const toInputValue = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseInput = (v) => {
  const [y, m, d] = v.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const dayName = (d) => d.toLocaleDateString("en-US", { weekday: "long" });
const longDate = (d) =>
  d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/* date arithmetic: aaj ki date minus janam ki date */
const diffYMD = (birth, today) => {
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();
  if (days < 0) {
    months -= 1;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
};

const daysToBirthday = (birth, today) => {
  let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
  if (next < today)
    next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
  return Math.round((next - today) / 86400000);
};

function CountUp({ to }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / 900, 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{n}</>;
}

export default function App() {
  const [today, setToday] = useState(() => new Date());
  const [dob, setDob] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFind = () => {
    const now = new Date();
    setToday(now);

    if (!dob) {
      setResult(null);
      return setError("Pick your date of birth first.");
    }
    const birth = parseInput(dob);
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (birth > t || birth.getFullYear() < 1900) {
      setResult(null);
      return setError(
        birth > t
          ? "Date of birth can't be in the future."
          : "Enter a year from 1900 onwards."
      );
    }
    setError("");
    setResult({
      ...diffYMD(birth, t),
      weekday: dayName(birth),
      dobText: longDate(birth),
      nextIn: daysToBirthday(birth, t),
    });
  };

  const clear = () => {
    setDob("");
    setResult(null);
    setError("");
  };

  const idle = !result;
  const yearPercent = result
    ? Math.round(((365 - Math.min(result.nextIn, 365)) / 365) * 100)
    : 0;

  return (
    <main className="page">
      <section className="sheet">
        {/* ---------- header ---------- */}
        <header className="top">
          <div className="eyebrow">AGE CALCULATOR</div>
          <h1>Find your age, precisely.</h1>
          <p>See your years, months, and days in one clean snapshot.</p>
        </header>

        {/* ---------- form ---------- */}
        <div className="form">
          <div className="pair">
            <div className="cell">
              <label htmlFor="dob">Enter your Date of Birth</label>
              <input
                id="dob"
                type="date"
                value={dob}
                max={toInputValue(today)}
                onChange={(e) => {
                  setDob(e.target.value);
                  setResult(null);
                  setError("");
                }}
              />
              <span className={dob ? "chip set" : "chip"}>
                {dob ? formatDMY(parseInput(dob)) : "DD - MM - YYYY"}
              </span>
            </div>

            <div className="cell sys">
              <span className="lbl">System Date</span>
              <strong>{formatDMY(today)}</strong>
              <small>{longDate(today)}</small>
            </div>
          </div>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <div className="btns">
            <button className="find" onClick={handleFind}>
              Find Present Age
            </button>
            {(dob || result) && (
              <button className="clear" onClick={clear}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ---------- result (same screen) ---------- */}
        <section
          className={idle ? "result idle" : "result"}
          aria-live="polite"
          key={result ? `${result.years}-${result.months}-${result.days}` : "idle"}
        >
          <h2>Current age</h2>

          <div className="tiles">
            <div className="tile years">
              <strong>{idle ? "--" : <CountUp to={result.years} />}</strong>
              <span>Years</span>
            </div>
            <div className="tile months">
              <strong>{idle ? "--" : <CountUp to={result.months} />}</strong>
              <span>Months</span>
            </div>
            <div className="tile days">
              <strong>{idle ? "--" : <CountUp to={result.days} />}</strong>
              <span>Days</span>
            </div>
          </div>

          <div className="foot">
            <div className="born">
              <small>Day of birth</small>
              <strong>{idle ? "--" : result.weekday}</strong>
              <span>{idle ? "Shows after you press Find" : result.dobText}</span>
            </div>

            <div className="next">
              <small>
                {idle
                  ? "Next birthday"
                  : result.nextIn === 0
                  ? "Happy birthday today!"
                  : `Next birthday in ${result.nextIn} ${
                      result.nextIn === 1 ? "day" : "days"
                    }`}
              </small>
              <div className="meter">
                <i style={{ width: `${yearPercent}%` }} />
              </div>
              <span>{idle ? "--" : `${yearPercent}% of this age-year done`}</span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}