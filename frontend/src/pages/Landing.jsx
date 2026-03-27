import { useState, useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import {
  ChevronDown,
  Github,
  Inbox,
  LayoutGrid,
  Calendar,
  Zap,
  Lock,
  Bell,
  GitBranch,
  Clock,
  Search,
  Check,
  ArrowRight,
  Menu,
  X,
  Users,
  BarChart2,
  GitMerge,
  AlertCircle,
  MoveRight,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

// ─── DESIGN TOKENS ────────────────────────────────────────────────
// Exactly matching Atlassian's design language
const C = {
  blue500: "#0052CC",
  blue400: "#0065FF",
  blue300: "#2684FF",
  blue100: "#DEEBFF",
  blue50: "#EAE6FF",
  navy: "#172B4D",
  slate500: "#42526E",
  slate400: "#5E6C84",
  slate300: "#8993A4",
  slate100: "#DFE1E6",
  bg: "#F4F5F7",
  white: "#FFFFFF",
  green: "#36B37E",
  red: "#FF5630",
  yellow: "#FFAB00",
  teal: "#00B8D9",
};

// ─── TYPOGRAPHY ───────────────────────────────────────────────────
// Atlassian uses Charlie Display. We'll use Plus Jakarta Sans + DM Serif Display
const fontLink = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Serif+Display:ital@0;1&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; }
  .font-display { font-family: 'DM Serif Display', serif; }
`;

// ─── ANIMATION VARIANTS ───────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
  }),
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

// ─── SCROLL REVEAL WRAPPER ────────────────────────────────────────
function Reveal({ children, delay = 0, className = "", as = "div" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const Tag = motion[as] || motion.div;
  return (
    <Tag
      ref={ref}
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </Tag>
  );
}

// ─── ANIMATED COUNTER ─────────────────────────────────────────────
function Counter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = parseInt(target);
    const duration = 1600;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: C.white,
        borderBottom: `1px solid ${scrolled ? C.slate100 : "transparent"}`,
        transition: "border-color 0.2s, box-shadow 0.2s",
        boxShadow: scrolled
          ? "0 1px 0 rgba(9,30,66,0.06), 0 2px 6px rgba(9,30,66,0.04)"
          : "none",
      }}
    >
      <nav
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="6" fill={C.blue500} />
              <path
                d="M8 22 L14 10 L20 18 L23 14 L26 22"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="14" cy="10" r="2" fill={C.teal} />
            </svg>
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans'",
                fontWeight: 800,
                fontSize: 18,
                color: C.navy,
                letterSpacing: "-0.02em",
              }}
            >
              CoWorkx
            </span>
          </div>

          {/* Desktop nav */}
          <div style={{ display: "flex", gap: 4 }} className="desktop-nav">
            {["Features", "How it Works", "Tech Stack", "GitHub"].map(
              (item) => (
                <button
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px 10px",
                    borderRadius: 4,
                    fontSize: 14,
                    fontWeight: 500,
                    color: C.slate500,
                    fontFamily: "'Plus Jakarta Sans'",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = C.bg;
                    e.currentTarget.style.color = C.navy;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                    e.currentTarget.style.color = C.slate500;
                  }}
                >
                  {item}
                  {item !== "GitHub" && (
                    <ChevronDown size={14} color={C.slate300} />
                  )}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Right */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 8 }}
          className="desktop-nav"
        >
          <Link to="/login">
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px 14px",
                fontSize: 14,
                fontWeight: 500,
                color: C.slate500,
                fontFamily: "'Plus Jakarta Sans'",
                borderRadius: 4,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.blue500)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.slate500)}
            >
              Sign in
            </button>{" "}
          </Link>
          <Link to="/register">
          <button
            style={{
              background: C.blue500,
              color: C.white,
              border: "none",
              cursor: "pointer",
              padding: "8px 16px",
              borderRadius: 4,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'Plus Jakarta Sans'",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = C.blue400)}
            onMouseLeave={(e) => (e.currentTarget.style.background = C.blue500)}
          >
            Get started free
          </button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: C.slate500,
          }}
          className="mobile-nav"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          style={{
            background: C.white,
            borderTop: `1px solid ${C.slate100}`,
            padding: "12px 24px 20px",
          }}
        >
          {["Features", "How it Works", "Tech Stack", "GitHub", "Sign in"].map(
            (item) => (
              <div
                key={item}
                style={{
                  padding: "11px 0",
                  borderBottom: `1px solid ${C.bg}`,
                  fontSize: 15,
                  color: C.navy,
                  fontWeight: 500,
                }}
              >
                {item}
              </div>
            ),
          )}
          <button
            style={{
              marginTop: 16,
              width: "100%",
              background: C.blue500,
              color: C.white,
              border: "none",
              cursor: "pointer",
              padding: "11px",
              borderRadius: 4,
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Get started free
          </button>
        </div>
      )}
    </header>
  );
}

// ─── KANBAN MOCKUP ────────────────────────────────────────────────
function KanbanMockup() {
  const cols = [
    {
      label: "TO DO",
      count: 3,
      color: C.slate300,
      cards: [
        {
          title: "Setup GitHub OAuth",
          tag: "Auth",
          priority: C.red,
          user: "AM",
          id: "WS-12",
        },
        {
          title: "Design system tokens",
          tag: "UI",
          priority: C.yellow,
          user: "PP",
          id: "WS-13",
          blocked: true,
        },
      ],
    },
    {
      label: "IN PROGRESS",
      count: 2,
      color: C.blue500,
      cards: [
        {
          title: "Build Kanban board",
          tag: "Feature",
          priority: C.yellow,
          user: "AM",
          id: "WS-09",
        },
        {
          title: "Webhook integration",
          tag: "Backend",
          priority: C.red,
          user: "PP",
          id: "WS-10",
        },
      ],
    },
    {
      label: "DONE",
      count: 4,
      color: C.green,
      cards: [
        {
          title: "Prisma schema design",
          tag: "DB",
          priority: C.green,
          user: "AM",
          id: "WS-07",
          done: true,
        },
        {
          title: "Project setup",
          tag: "Infra",
          priority: C.green,
          user: "PP",
          id: "WS-08",
          done: true,
        },
      ],
    },
  ];

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 8,
        border: `1px solid ${C.slate100}`,
        boxShadow:
          "0 8px 32px -4px rgba(9,30,66,0.12), 0 2px 8px -2px rgba(9,30,66,0.08)",
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans'",
      }}
    >
      {/* Window chrome */}
      <div
        style={{
          height: 44,
          background: C.bg,
          borderBottom: `1px solid ${C.slate100}`,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {[C.red, C.yellow, C.green].map((c, i) => (
            <div
              key={i}
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                background: c,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
        <div
          style={{
            marginLeft: 12,
            flex: 1,
            maxWidth: 240,
            height: 24,
            background: C.slate100,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            padding: "0 10px",
            gap: 6,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: C.green,
            }}
          />
          <span style={{ fontSize: 11, color: C.slate400, fontWeight: 500 }}>
            CoWorkx.app/sprint-board
          </span>
        </div>
      </div>

      {/* App UI */}
      <div style={{ display: "flex", height: 340 }}>
        {/* Sidebar */}
        <div
          style={{
            width: 48,
            background: C.navy,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "12px 0",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: C.blue500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 32 32" fill="none">
              <path
                d="M8 22 L14 10 L20 18 L23 14 L26 22"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          {[LayoutGrid, Inbox, Calendar, BarChart2, Users].map((Icon, i) => (
            <Icon
              key={i}
              size={16}
              color={i === 0 ? "white" : "rgba(255,255,255,0.35)"}
            />
          ))}
        </div>

        {/* Main area */}
        <div style={{ flex: 1, background: C.white, overflow: "hidden" }}>
          {/* Sub header */}
          <div
            style={{
              height: 40,
              borderBottom: `1px solid ${C.bg}`,
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              gap: 16,
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.navy }}>
                Sprint 2
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: C.slate400,
                  background: "#FFF0B3",
                  padding: "2px 8px",
                  borderRadius: 3,
                  fontWeight: 600,
                }}
              >
                5 days left
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["All", "Mine", "Unassigned"].map((f, i) => (
                <span
                  key={f}
                  style={{
                    fontSize: 11,
                    color: i === 0 ? C.blue500 : C.slate400,
                    fontWeight: i === 0 ? 700 : 500,
                    cursor: "pointer",
                    padding: "2px 6px",
                    borderRadius: 3,
                    background: i === 0 ? C.blue100 : "none",
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Columns */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 1,
              padding: "12px",
              height: "calc(100% - 40px)",
              background: C.bg,
            }}
          >
            {cols.map((col) => (
              <div
                key={col.label}
                style={{
                  background: C.white,
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "8px 10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `2px solid ${col.color}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: col.color,
                      letterSpacing: "0.08em",
                    }}
                  >
                    {col.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: C.slate400,
                      background: C.bg,
                      padding: "1px 6px",
                      borderRadius: 10,
                      fontWeight: 600,
                    }}
                  >
                    {col.count}
                  </span>
                </div>
                <div
                  style={{
                    padding: "8px 6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {col.cards.map((card, i) => (
                    <div
                      key={i}
                      style={{
                        background: card.done
                          ? "#F6FFFA"
                          : card.blocked
                            ? "#FFFAE6"
                            : C.white,
                        border: `1px solid ${card.blocked ? "#FFECB3" : card.done ? "#ABF5D1" : C.slate100}`,
                        borderRadius: 4,
                        padding: "8px 8px 6px",
                        boxShadow: "0 1px 2px rgba(9,30,66,0.06)",
                        opacity: card.blocked ? 0.85 : 1,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: C.navy,
                          fontWeight: 600,
                          lineHeight: 1.4,
                          marginBottom: 6,
                        }}
                      >
                        {card.title}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: card.priority,
                            }}
                          />
                          {card.blocked && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Lock size={8} color={C.yellow} />
                              <span
                                style={{
                                  fontSize: 9,
                                  color: C.yellow,
                                  fontWeight: 700,
                                }}
                              >
                                Blocked
                              </span>
                            </div>
                          )}
                          {card.done && <Check size={9} color={C.green} />}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              color: C.slate300,
                              fontWeight: 500,
                            }}
                          >
                            {card.id}
                          </span>
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              background: C.blue500,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 8,
                              color: C.white,
                              fontWeight: 700,
                            }}
                          >
                            {card.user}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INBOX MOCKUP ─────────────────────────────────────────────────
function InboxMockup() {
  const issues = [
    {
      id: 47,
      title: "Fix login redirect after OAuth",
      label: "bug",
      labelColor: C.red,
      status: "converted",
    },
    {
      id: 46,
      title: "Add dark mode support",
      label: "enhancement",
      labelColor: C.blue300,
      status: "pending",
    },
    {
      id: 45,
      title: "Update API documentation",
      label: "docs",
      labelColor: C.teal,
      status: "pending",
    },
    {
      id: 44,
      title: "Mobile layout shift on iOS",
      label: "bug",
      labelColor: C.red,
      status: "dismissed",
    },
  ];

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 8,
        border: `1px solid ${C.slate100}`,
        boxShadow: "0 4px 16px rgba(9,30,66,0.08)",
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans'",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderBottom: `1px solid ${C.bg}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
            Issues Inbox
          </div>
          <div style={{ fontSize: 12, color: C.slate400, marginTop: 2 }}>
            github.com/team/frontend · 45 open
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            background: C.bg,
            padding: "4px 10px",
            borderRadius: 3,
            color: C.slate500,
            fontWeight: 500,
          }}
        >
          Auto-syncing via webhook ⚡
        </div>
      </div>

      {issues.map((issue) => (
        <div
          key={issue.id}
          style={{
            padding: "11px 18px",
            borderBottom: `1px solid ${C.bg}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            opacity: issue.status === "dismissed" ? 0.45 : 1,
            background: issue.status === "converted" ? "#F3FFF8" : C.white,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{ fontSize: 11, color: C.slate400, fontWeight: 600 }}
              >
                #{issue.id}
              </span>
              <span style={{ fontSize: 13, color: C.navy, fontWeight: 500 }}>
                {issue.title}
              </span>
            </div>
            <div style={{ marginTop: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  color: issue.labelColor,
                  background: `${issue.labelColor}18`,
                  padding: "2px 7px",
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                {issue.label}
              </span>
            </div>
          </div>
          {issue.status === "converted" ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: C.green,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              <Check size={13} /> Added to backlog
            </div>
          ) : issue.status === "dismissed" ? (
            <span style={{ fontSize: 11, color: C.slate300, fontWeight: 500 }}>
              Dismissed
            </span>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                style={{
                  background: C.blue500,
                  color: C.white,
                  border: "none",
                  padding: "5px 10px",
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans'",
                }}
              >
                Convert
              </button>
              <button
                style={{
                  background: "none",
                  color: C.slate400,
                  border: `1px solid ${C.slate100}`,
                  padding: "5px 10px",
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans'",
                }}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── WORKLOAD MOCKUP ──────────────────────────────────────────────
function WorkloadMockup() {
  const members = [
    {
      name: "Ashwin Mali",
      initials: "AM",
      tasks: 8,
      max: 8,
      done: 5,
      overdue: 1,
      status: "overloaded",
      color: C.red,
    },
    {
      name: "Purvaja Pedhekar",
      initials: "PP",
      tasks: 4,
      max: 8,
      done: 2,
      overdue: 0,
      status: "available",
      color: C.green,
    },
    {
      name: "Ravi Kumar",
      initials: "RK",
      tasks: 6,
      max: 8,
      done: 3,
      overdue: 1,
      status: "moderate",
      color: C.yellow,
    },
  ];
  const statusColors = {
    overloaded: C.red,
    available: C.green,
    moderate: C.yellow,
  };
  const statusBg = {
    overloaded: "#FFF4F2",
    available: "#F3FFF8",
    moderate: "#FFFAE6",
  };

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 8,
        border: `1px solid ${C.slate100}`,
        boxShadow: "0 4px 16px rgba(9,30,66,0.08)",
        overflow: "hidden",
        fontFamily: "'Plus Jakarta Sans'",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderBottom: `1px solid ${C.bg}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>
          Team Workload
        </div>
        <span style={{ fontSize: 11, color: C.slate400, fontWeight: 500 }}>
          Sprint 2 · Active
        </span>
      </div>
      <div style={{ padding: "8px 0" }}>
        {members.map((m) => (
          <div
            key={m.name}
            style={{ padding: "12px 18px", borderBottom: `1px solid ${C.bg}` }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: C.navy,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    color: C.white,
                    fontWeight: 700,
                  }}
                >
                  {m.initials}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>
                    {m.name}
                  </div>
                  <div
                    style={{ fontSize: 11, color: C.slate400, marginTop: 1 }}
                  >
                    {m.tasks} active · {m.done} done{" "}
                    {m.overdue > 0 && `· ${m.overdue} overdue`}
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: statusColors[m.status],
                  background: statusBg[m.status],
                  padding: "3px 8px",
                  borderRadius: 10,
                  textTransform: "capitalize",
                }}
              >
                {m.status}
              </span>
            </div>
            <div
              style={{
                height: 6,
                background: C.bg,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(m.tasks / m.max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                style={{ height: "100%", background: m.color, borderRadius: 3 }}
              />
            </div>
          </div>
        ))}
        <div
          style={{
            padding: "12px 18px",
            background: "#F0F7FF",
            borderTop: `1px solid ${C.blue100}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={13} color={C.blue500} />
            <span style={{ fontSize: 12, color: C.blue500, fontWeight: 600 }}>
              Suggestion: Ashwin is at capacity. Purvaja can take 4 more tasks.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HERO SECTION ─────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      style={{
        background: `linear-gradient(180deg, #EAF0FF 0%, ${C.white} 100%)`,
        paddingTop: 80,
        paddingBottom: 80,
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 64,
            alignItems: "center",
          }}
        >
          {/* Left: Text */}
          <motion.div variants={stagger} initial="hidden" animate="visible">
            {/* Badge */}
            <motion.div variants={fadeUp} custom={0}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: C.blue100,
                  border: `1px solid ${C.blue300}30`,
                  padding: "6px 14px",
                  borderRadius: 20,
                  marginBottom: 28,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: C.blue500,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: C.blue500,
                    letterSpacing: "0.04em",
                  }}
                >
                  GitHub Issue Intelligence Platform
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              custom={0.08}
              style={{
                fontSize: "clamp(38px, 4.5vw, 56px)",
                lineHeight: 1.08,
                fontWeight: 800,
                color: C.navy,
                letterSpacing: "-0.025em",
                marginBottom: 22,
              }}
            >
              Stop managing
              <br />
              GitHub issues.
              <br />
              <span
                style={{
                  background: `linear-gradient(135deg, ${C.blue500} 0%, ${C.teal} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Start shipping.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={0.16}
              style={{
                fontSize: 18,
                lineHeight: 1.7,
                color: C.slate500,
                marginBottom: 36,
                maxWidth: 460,
              }}
            >
              CoWorkx adds a triage layer, sprint planning, workload visibility,
              and burndown charts on top of GitHub — the workflow features your
              team actually needs.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              custom={0.22}
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 28,
                flexWrap: "wrap",
              }}
            >
              <button
                style={{
                  background: C.blue500,
                  color: C.white,
                  border: "none",
                  cursor: "pointer",
                  padding: "12px 24px",
                  borderRadius: 4,
                  fontSize: 15,
                  fontWeight: 700,
                  fontFamily: "'Plus Jakarta Sans'",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: `0 4px 14px ${C.blue500}50`,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.blue400;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = C.blue500;
                  e.currentTarget.style.transform = "none";
                }}
              >
                Get started free <ArrowRight size={16} />
              </button>
              <button
                style={{
                  background: C.white,
                  color: C.navy,
                  border: `1px solid ${C.slate100}`,
                  cursor: "pointer",
                  padding: "12px 20px",
                  borderRadius: 4,
                  fontSize: 15,
                  fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans'",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.slate300;
                  e.currentTarget.style.background = C.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.slate100;
                  e.currentTarget.style.background = C.white;
                }}
              >
                <Github size={16} /> View on GitHub
              </button>
            </motion.div>

            <motion.p
              variants={fadeUp}
              custom={0.28}
              style={{ fontSize: 13, color: C.slate400, fontWeight: 500 }}
            >
              Free for teams up to 5 · No credit card · MCA Project 2025–26
            </motion.p>
          </motion.div>

          {/* Right: Mockup */}
          <Reveal delay={0.18}>
            <motion.div
              initial={{ rotateX: 8, rotateY: -6, y: 0 }}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ perspective: 1000, transformStyle: "preserve-3d" }}
            >
              <KanbanMockup />
            </motion.div>

            {/* Floating chips */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              style={{
                position: "absolute",
                top: -18,
                right: -20,
                background: C.white,
                border: `1px solid ${C.slate100}`,
                borderRadius: 8,
                padding: "8px 12px",
                boxShadow: "0 4px 16px rgba(9,30,66,0.12)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "'Plus Jakarta Sans'",
                zIndex: 10,
                pointerEvents: "none",
              }}
            >
              <Bell size={13} color={C.blue500} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>
                Ashwin assigned you #34
              </span>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              style={{
                position: "absolute",
                bottom: -12,
                left: -24,
                background: C.white,
                border: `1px solid ${C.slate100}`,
                borderRadius: 8,
                padding: "8px 12px",
                boxShadow: "0 4px 16px rgba(9,30,66,0.10)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "'Plus Jakarta Sans'",
                zIndex: 10,
                pointerEvents: "none",
              }}
            >
              <BarChart2 size={13} color={C.green} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>
                Sprint velocity ↑ 14%
              </span>
            </motion.div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── PROBLEM SECTION ──────────────────────────────────────────────
function ProblemSection() {
  const problems = [
    {
      icon: <Inbox size={22} color={C.blue500} />,
      title: "Issues flood in, unfiltered",
      desc: "GitHub Issues mix bugs, feature requests, and noise with no triage process. Your team drowns in irrelevant work.",
    },
    {
      icon: <GitBranch size={22} color={C.blue500} />,
      title: "Repos are siloed",
      desc: "Frontend, backend, mobile — each repo is isolated. GitHub Projects can't show you a unified cross-repo view.",
    },
    {
      icon: <Calendar size={22} color={C.blue500} />,
      title: "No sprint planning",
      desc: "GitHub has zero concept of sprints, burndown charts, or velocity. You can't plan or measure team cadence.",
    },
    {
      icon: <Users size={22} color={C.blue500} />,
      title: "Workload is invisible",
      desc: "You don't know who's overloaded until burnout happens. No tool shows real-time developer capacity.",
    },
  ];

  return (
    <section
      style={{
        background: C.bg,
        padding: "80px 24px",
        borderTop: `1px solid ${C.slate100}`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal
          className="text-center"
          style={{ textAlign: "center", marginBottom: 60 }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: C.blue500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            The Problem
          </div>
          <h2
            style={{
              fontSize: "clamp(28px, 3vw, 40px)",
              fontWeight: 800,
              color: C.navy,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            GitHub alone isn't enough
            <br />
            for growing teams
          </h2>
          <p
            style={{
              fontSize: 17,
              color: C.slate500,
              maxWidth: 520,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Every development team hits these walls. CoWorkx was built
            specifically to solve them.
          </p>
        </Reveal>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          {problems.map((p, i) => (
            <motion.div key={i} variants={fadeUp} custom={i * 0.08}>
              <div
                style={{
                  background: C.white,
                  borderRadius: 6,
                  border: `1px solid ${C.slate100}`,
                  padding: "28px 24px",
                  transition: "box-shadow 0.2s, transform 0.2s",
                  cursor: "default",
                  height: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(9,30,66,0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: C.blue100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                  }}
                >
                  {p.icon}
                </div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: C.navy,
                    marginBottom: 10,
                  }}
                >
                  {p.title}
                </h3>
                <p style={{ fontSize: 14, color: C.slate500, lineHeight: 1.7 }}>
                  {p.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── FEATURES SECTION ─────────────────────────────────────────────
function FeaturesSection() {
  const features = [
    {
      tag: "Triage Layer",
      headline: "GitHub issues are noise.\nTasks are decisions.",
      body: "CoWorkx gives you an Issues Inbox where your team lead reviews raw GitHub issues and decides what gets worked on. Convert relevant ones into tasks with one click. The rest gets dismissed — cleanly, never lost.",
      bullets: [
        "One-click convert issue to task",
        "Set priority and assignee during conversion",
        "Webhook-powered — inbox updates in real time",
        "Dismissed issues hidden, recoverable anytime",
      ],
      visual: <InboxMockup />,
      reverse: false,
    },
    {
      tag: "Sprint Board",
      headline: "Ship in sprints.\nNot in chaos.",
      body: "Create time-boxed sprints from your backlog. Drag tasks across columns as work progresses. CoWorkx tracks order, status, and issue dependencies automatically. Incomplete tasks roll back to backlog at sprint end.",
      bullets: [
        "Drag and drop with database-persisted order",
        "Blocked task lock indicators with dependency view",
        "Sprint countdown and auto-rollover logic",
        "Filter by assignee, priority, or status",
      ],
      visual: (
        <div style={{ position: "relative" }}>
          <KanbanMockup />
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: -16,
              left: "50%",
              transform: "translateX(-50%)",
              background: "#FFF0B3",
              border: `1px solid ${C.yellow}40`,
              borderRadius: 6,
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 12px rgba(9,30,66,0.1)",
            }}
          >
            <Clock size={12} color={C.yellow} />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#7A5C00",
                fontFamily: "'Plus Jakarta Sans'",
              }}
            >
              Sprint ends in 5 days
            </span>
          </motion.div>
        </div>
      ),
      reverse: true,
    },
    {
      tag: "Intelligence Layer",
      headline: "Know your team's capacity\nbefore it's too late.",
      body: "CoWorkx tracks each developer's active workload and flags overloaded members in real time. Smart suggestions surface who has bandwidth. Burndown charts show sprint health. Velocity trends tell you if you're getting faster.",
      bullets: [
        "Color-coded workload bars per developer",
        "Smart reassignment suggestions",
        "Sprint burndown — ideal vs actual line",
        "Velocity tracking across sprints",
      ],
      visual: <WorkloadMockup />,
      reverse: false,
    },
  ];

  return (
    <section style={{ background: C.white, padding: "96px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {features.map((f, idx) => (
          <div
            key={idx}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 72,
              alignItems: "center",
              marginBottom: idx < features.length - 1 ? 120 : 0,
            }}
          >
            {/* Text */}
            <Reveal delay={0.05} style={{ order: f.reverse ? 2 : 1 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: C.blue500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                {f.tag}
              </div>
              <h2
                style={{
                  fontSize: "clamp(26px, 2.8vw, 36px)",
                  fontWeight: 800,
                  color: C.navy,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.18,
                  marginBottom: 20,
                  whiteSpace: "pre-line",
                }}
              >
                {f.headline}
              </h2>
              <p
                style={{
                  fontSize: 16,
                  color: C.slate500,
                  lineHeight: 1.75,
                  marginBottom: 28,
                }}
              >
                {f.body}
              </p>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {f.bullets.map((b, i) => (
                  <li
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      fontSize: 15,
                      color: C.navy,
                      fontWeight: 500,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: "#E3FCEF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      <Check size={11} color={C.green} />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Visual */}
            <Reveal
              delay={0.12}
              style={{ order: f.reverse ? 1 : 2, position: "relative" }}
            >
              {f.visual}
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── SMALLER FEATURES GRID ────────────────────────────────────────
function SmallFeaturesSection() {
  const items = [
    {
      icon: <Lock size={20} color={C.blue500} />,
      title: "Issue Dependencies",
      desc: "Mark tasks as blocked by other tasks. Visual lock icons on the Kanban prevent teams from starting blocked work.",
    },
    {
      icon: <Bell size={20} color={C.blue500} />,
      title: "Smart Notifications",
      desc: "Alerts when assigned, when blockers resolve, and 24h before sprint deadline. Not noise — signal.",
    },
    {
      icon: <GitMerge size={20} color={C.blue500} />,
      title: "Cross-Repo Dashboard",
      desc: "All repositories. All issues. One unified view. See repo health scores and stale issue detection at a glance.",
    },
    {
      icon: <Clock size={20} color={C.blue500} />,
      title: "Activity Timeline",
      desc: "Full audit trail of every team action. Filter by member or task. Know exactly what happened and when.",
    },
    {
      icon: <Zap size={20} color={C.blue500} />,
      title: "Real-Time Sync",
      desc: "GitHub Webhooks keep CoWorkx updated automatically. No manual refresh. No stale data. Ever.",
    },
    {
      icon: <Search size={20} color={C.blue500} />,
      title: "Search & Filters",
      desc: "Find any task across all repositories instantly. Filter by priority, status, sprint, or assignee.",
    },
  ];

  return (
    <section
      style={{
        background: C.bg,
        padding: "80px 24px",
        borderTop: `1px solid ${C.slate100}`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
          <h2
            style={{
              fontSize: "clamp(24px, 2.5vw, 32px)",
              fontWeight: 800,
              color: C.navy,
              letterSpacing: "-0.02em",
            }}
          >
            Every detail, thought through
          </h2>
          <p style={{ fontSize: 16, color: C.slate400, marginTop: 12 }}>
            Six more reasons your team will love CoWorkx
          </p>
        </Reveal>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
          }}
        >
          {items.map((item, i) => (
            <motion.div key={i} variants={fadeUp} custom={i * 0.07}>
              <div
                style={{
                  background: C.white,
                  borderRadius: 6,
                  border: `1px solid ${C.slate100}`,
                  padding: "24px",
                  height: "100%",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 16px rgba(9,30,66,0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: C.blue100,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  {item.icon}
                </div>
                <h4
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: C.navy,
                    marginBottom: 8,
                  }}
                >
                  {item.title}
                </h4>
                <p style={{ fontSize: 13, color: C.slate500, lineHeight: 1.7 }}>
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── HOW IT WORKS ─────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      icon: <Github size={24} color={C.blue500} />,
      title: "Connect GitHub",
      desc: "Link your account and add repositories. CoWorkx fetches all open issues instantly via the GitHub REST API.",
    },
    {
      num: "02",
      icon: <Inbox size={24} color={C.blue500} />,
      title: "Triage Your Inbox",
      desc: "Review incoming issues. Convert what matters into tasks with priority and assignee. Dismiss the rest.",
    },
    {
      num: "03",
      icon: <LayoutGrid size={24} color={C.blue500} />,
      title: "Plan Your Sprint",
      desc: "Drag tasks from backlog into a sprint. Set dates. CoWorkx warns if you're overcommitting based on capacity.",
    },
    {
      num: "04",
      icon: <BarChart2 size={24} color={C.blue500} />,
      title: "Ship and Track",
      desc: "Team works the board. You watch the burndown. Everyone knows what's blocked and what ships next.",
    },
  ];

  return (
    <section
      style={{
        background: C.white,
        padding: "96px 24px",
        borderTop: `1px solid ${C.slate100}`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 64 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: C.blue500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            How It Works
          </div>
          <h2
            style={{
              fontSize: "clamp(26px, 3vw, 40px)",
              fontWeight: 800,
              color: C.navy,
              letterSpacing: "-0.02em",
            }}
          >
            From GitHub chaos to shipped sprint
            <br />
            in four steps
          </h2>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            position: "relative",
          }}
        >
          {/* Connector line */}
          <div
            style={{
              position: "absolute",
              top: 36,
              left: "12.5%",
              right: "12.5%",
              height: 1,
              background: `repeating-linear-gradient(90deg, ${C.blue300} 0, ${C.blue300} 6px, transparent 6px, transparent 14px)`,
              zIndex: 0,
            }}
          />

          {steps.map((step, i) => (
            <Reveal
              key={i}
              delay={i * 0.1}
              style={{
                textAlign: "center",
                padding: "0 16px",
                position: "relative",
                zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: C.white,
                  border: `2px solid ${C.blue100}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  position: "relative",
                  boxShadow: `0 0 0 6px ${C.white}`,
                }}
              >
                {step.icon}
                <div
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: C.blue500,
                    color: C.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {i + 1}
                </div>
              </div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: C.navy,
                  marginBottom: 10,
                }}
              >
                {step.title}
              </h3>
              <p style={{ fontSize: 13, color: C.slate500, lineHeight: 1.7 }}>
                {step.desc}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── STATS ────────────────────────────────────────────────────────
function StatsSection() {
  const stats = [
    { value: 15, suffix: "+", label: "Modules Built" },
    { value: 100, suffix: "%", label: "Webhook Powered Sync" },
    { value: 5, suffix: "", label: "Problems GitHub Can't Solve" },
    { value: 1, suffix: "", label: "Unified Platform" },
  ];

  return (
    <section style={{ background: C.navy, padding: "72px 24px" }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 32,
          textAlign: "center",
        }}
      >
        {stats.map((s, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <div
              style={{
                fontSize: "clamp(38px, 4vw, 52px)",
                fontWeight: 800,
                color: C.white,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              <Counter target={s.value} suffix={s.suffix} />
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.5)",
                marginTop: 10,
                fontWeight: 500,
              }}
            >
              {s.label}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── TECH STACK ───────────────────────────────────────────────────
function TechStackSection() {
  const techs = [
    { name: "React", color: "#61DAFB" },
    { name: "Vite", color: "#646CFF" },
    { name: "Tailwind CSS", color: "#38BDF8" },
    { name: "Node.js", color: "#68A063" },
    { name: "Express", color: "#aaaaaa" },
    { name: "PostgreSQL", color: "#336791" },
    { name: "Prisma", color: "#5A67D8" },
    { name: "Socket.io", color: "#010101" },
    { name: "GitHub API", color: "#24292F" },
    { name: "Docker", color: "#2496ED" },
  ];

  return (
    <section
      style={{
        background: C.bg,
        padding: "72px 24px",
        borderTop: `1px solid ${C.slate100}`,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <Reveal>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.slate400,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 28,
            }}
          >
            Built with a modern production stack
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            {techs.map((t) => (
              <span
                key={t.name}
                style={{
                  background: C.white,
                  border: `1px solid ${C.slate100}`,
                  padding: "7px 16px",
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.slate500,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  transition: "border-color 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = t.color;
                  e.currentTarget.style.color = t.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.slate100;
                  e.currentTarget.style.color = C.slate500;
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: t.color,
                  }}
                />
                {t.name}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 14, color: C.slate400 }}>
            PERN Stack — PostgreSQL + Express + React + Node.js — with real-time
            WebSocket layer and GitHub Webhook integration
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section
      style={{
        background: C.blue500,
        padding: "96px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background circles */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.05)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -60,
          left: -60,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Reveal>
          <h2
            style={{
              fontSize: "clamp(30px, 4vw, 48px)",
              fontWeight: 800,
              color: C.white,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
              marginBottom: 18,
            }}
          >
            Ready to bring order to your GitHub workflow?
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.75)",
              marginBottom: 40,
              lineHeight: 1.7,
            }}
          >
            Connect your GitHub account and have your team running in under 5
            minutes. Free for teams up to 5 people.
          </p>
          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              style={{
                background: C.white,
                color: C.blue500,
                border: "none",
                padding: "13px 28px",
                borderRadius: 4,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans'",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = C.blue100;
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = C.white;
                e.currentTarget.style.transform = "none";
              }}
            >
              Get started free <ArrowRight size={16} />
            </button>
            <button
              style={{
                background: "transparent",
                color: C.white,
                border: "1px solid rgba(255,255,255,0.3)",
                padding: "13px 24px",
                borderRadius: 4,
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans'",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.7)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)")
              }
            >
              <Github size={16} /> View on GitHub
            </button>
          </div>
          <p
            style={{
              marginTop: 20,
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            No credit card required · Free for teams up to 5 · Open source
            friendly
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────
function Footer() {
  return (
    <footer
      style={{
        background: C.bg,
        borderTop: `1px solid ${C.slate100}`,
        padding: "56px 24px 32px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 48,
            marginBottom: 48,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="6" fill={C.blue500} />
                <path
                  d="M8 22 L14 10 L20 18 L23 14 L26 22"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                <circle cx="14" cy="10" r="2" fill={C.teal} />
              </svg>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                  color: C.navy,
                  letterSpacing: "-0.02em",
                }}
              >
                CoWorkx
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                color: C.slate400,
                lineHeight: 1.7,
                maxWidth: 240,
              }}
            >
              Developer Task & GitHub Issue Intelligence Platform
            </p>
            <p style={{ fontSize: 12, color: C.slate300, marginTop: 12 }}>
              MCA Sem-II Project · IMCC Pune · A.Y. 2025–26
            </p>
          </div>
          {[
            {
              title: "Product",
              links: ["Features", "How it Works", "Tech Stack", "Changelog"],
            },
            {
              title: "Resources",
              links: [
                "GitHub Repository",
                "Documentation",
                "Report a Bug",
                "Request Feature",
              ],
            },
            {
              title: "Team",
              links: ["Ashwin Mali (2501115)", "Purvaja Pedhekar (2501148)"],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: C.navy,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                }}
              >
                {col.title}
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      style={{
                        fontSize: 14,
                        color: C.slate500,
                        textDecoration: "none",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = C.blue500)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = C.slate500)
                      }
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: `1px solid ${C.slate100}`,
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 24 }}>
            {["Privacy policy", "Terms", "Cookie settings"].map((link) => (
              <a
                key={link}
                href="#"
                style={{
                  fontSize: 12,
                  color: C.slate400,
                  textDecoration: "none",
                }}
              >
                {link}
              </a>
            ))}
          </div>
          <span style={{ fontSize: 12, color: C.slate400 }}>
            © 2026 CoWorkx · Built for academic purposes · MES IMCC Pune
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────
const globalStyles = `
  ${fontLink}
  * { font-family: 'Plus Jakarta Sans', sans-serif !important; }
  @media (max-width: 768px) {
    .desktop-nav { display: none !important; }
    .mobile-nav { display: flex !important; }
  }
  @media (min-width: 769px) {
    .mobile-nav { display: none !important; }
  }
`;

// ─── ROOT ─────────────────────────────────────────────────────────
export default function CoWorkxLanding() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          background: C.white,
          color: C.navy,
          overflowX: "hidden", // Add this to hide the horizontal scroll
          userSelect: "none",
        }}
      >
        <Navbar />
        <main>
          <HeroSection />
          <ProblemSection />
          <FeaturesSection />
          <SmallFeaturesSection />
          <HowItWorksSection />
          <StatsSection />
          <TechStackSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
}
