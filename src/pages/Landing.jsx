import { Link } from "react-router-dom";

const icon = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const FEATURES = [
  {
    title: "מגוון אירועים",
    text: "הופעות, הצגות וספורט במקום אחד, עם כל הפרטים שצריך כדי לבחור.",
    svg: (
      <svg {...icon}>
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    title: "בחירת מושב בדיוק לפי הטעם",
    text: "רואים את המושבים הפנויים ובוחרים בעצמכם את השורה והכיסא.",
    svg: (
      <svg {...icon}>
        <path d="M5 11V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5" />
        <path d="M3 13a2 2 0 0 1 4 0v3h10v-3a2 2 0 0 1 4 0v6H3z" />
        <path d="M6 19v2M18 19v2" />
      </svg>
    ),
  },
  {
    title: "הזמנה מאובטחת",
    text: "ההזמנה נשמרת על שמכם, והמושב נחסם עבורכם ברגע שסיימתם.",
    svg: (
      <svg {...icon}>
        <path d="M12 3l8 3v6c0 4.5-3.2 8.3-8 9-4.8-.7-8-4.5-8-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

const STEPS = [
  { title: "נרשמים", text: "יוצרים חשבון בחינם תוך כמה שניות." },
  { title: "בוחרים אירוע ומושב", text: "מחפשים אירוע ומסמנים את המקום המושלם." },
  { title: "מזמינים ונהנים", text: "מקבלים אישור הזמנה ומגיעים לאירוע." },
];

export default function Landing() {
  return (
    <div className="lp">
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div>
            <span className="lp-pill">מערכת הזמנת כרטיסים</span>
            <h1 className="lp-title">
              הכרטיס הבא שלכם{" "}
              <span>
                במרחק קליק
                <i className="lp-draw" aria-hidden="true">
                  <svg
                    className="lp-draw-line"
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                  >
                    <path
                      pathLength="1"
                      d="M198 6 C 150 1.5, 90 10.5, 3 5"
                    />
                  </svg>
                  <svg
                    className="lp-draw-pen"
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                  >
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    <path d="m15 5 4 4" />
                  </svg>
                </i>
              </span>
            </h1>
            <p className="lp-sub">
              גלו אירועים, בחרו את המושב המושלם והזמינו כרטיסים בקלות ובמהירות, בלי תורים ובלי טלפונים.
            </p>
            <div className="lp-cta">
              <Link to="/login" className="btn btn-primary">
                התחברות
              </Link>
              <Link to="/register" className="btn btn-secondary">
                הרשמה
              </Link>
            </div>
            <p className="lp-note">ההרשמה חינמית ולוקחת פחות מדקה</p>
          </div>

          <div className="lp-visual" aria-hidden="true">
            <div className="lp-chip lp-chip--a">
              <i>✓</i> המושב שלך שמור
            </div>
            <div className="lp-ticket">
              <div className="lp-ticket-top">
                <div className="lp-ticket-label">כרטיס כניסה</div>
                <div className="lp-ticket-name">הערב הגדול של השנה</div>
                <div className="lp-ticket-meta">
                  <div>
                    <small>תאריך</small>
                    <strong>חמישי · 21:00</strong>
                  </div>
                  <div>
                    <small>אולם</small>
                    <strong>היכל מרכזי</strong>
                  </div>
                </div>
              </div>
              <div className="lp-tear" />
              <div className="lp-ticket-bottom">
                <div className="lp-seat">
                  <small>שורה · מושב</small>
                  <strong>C · 12</strong>
                </div>
                <div className="lp-barcode" />
              </div>
            </div>
            <div className="lp-chip lp-chip--b">
              <i>★</i> מושבים פנויים עכשיו
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <h2>למה להזמין אצלנו?</h2>
          <p>כל מה שצריך כדי להגיע לאירוע, בלי כאב ראש.</p>
        </div>
        <div className="lp-features">
          {FEATURES.map((f) => (
            <div className="lp-feature" key={f.title}>
              <div className="lp-feature-icon">{f.svg}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <div className="lp-section-head">
          <h2>איך זה עובד?</h2>
          <p>שלושה צעדים פשוטים.</p>
        </div>
        <div className="lp-steps">
          {STEPS.map((s, i) => (
            <div className="lp-step" key={s.title}>
              <div className="lp-step-num">{i + 1}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-final">
        <div className="lp-final-card">
          <h2>מוכנים להתחיל?</h2>
          <p>הצטרפו עכשיו ותפסו את המושבים הטובים לפני כולם.</p>
          <div className="lp-cta">
            <Link to="/register" className="btn btn-primary">
              הרשמה
            </Link>
            <Link to="/login" className="btn btn-secondary">
              התחברות
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
