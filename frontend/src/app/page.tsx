"use client";
import Link from "next/link";
import { MKLogo } from "@/components/shared";

export default function Home() {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "var(--mk-canvas)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 20px",
    }}>
      {/* Header */}
      <MKLogo subtitle="Clinical Suite" />

      <h1 className="mk-display" style={{ marginTop: 40, marginBottom: 8, textAlign: "center" }}>
        MediKiosk
      </h1>
      <p className="mk-body" style={{ color: "var(--mk-text-muted)", textAlign: "center", maxWidth: 400, marginBottom: 48 }}>
        AI-powered patient intake and hospital queue optimisation. Select your role to continue.
      </p>

      {/* Role selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, width: "100%", maxWidth: 680 }}>
        {[
          {
            href: "/patient",
            icon: "🏥",
            role: "Patient",
            desc: "Self-service intake kiosk",
            color: "var(--mk-primary)",
          },
          {
            href: "/doctor",
            icon: "🩺",
            role: "Doctor",
            desc: "Clinical suite",
            color: "var(--mk-success)",
          },
          {
            href: "/admin",
            icon: "⚙️",
            role: "Super Admin",
            desc: "Hospital operations",
            color: "var(--mk-purple)",
          },
        ].map(({ href, icon, role, desc, color }) => (
          <Link href={href} key={role} style={{ textDecoration: "none" }}>
            <div className="mk-card" style={{
              padding: 24,
              cursor: "pointer",
              transition: `transform 160ms var(--mk-ease), box-shadow 160ms var(--mk-ease)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--mk-shadow-overlay)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
            >
              <div style={{ fontSize: 36 }}>{icon}</div>
              <div className="mk-sec-title" style={{ color }}>{role}</div>
              <div className="mk-meta">{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <p className="mk-meta" style={{ marginTop: 48, textAlign: "center" }}>
        MediKiosk is not a diagnosis tool. AI supports intake; a doctor makes the final clinical decision.
      </p>
    </div>
  );
}
