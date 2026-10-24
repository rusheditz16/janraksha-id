// Compact URL-safe encoder and decoder for JanRaksha emergency profiles
// Enables 100% resilient offline and serverless QR code scanning without database dependency

export function getWebappBaseUrl(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("janraksha_custom_domain");
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/$/, "");
    }
    const origin = window.location.origin;
    // When running on localhost, default to the deployed Vercel URL so phone cameras scanning QR codes hit the webapp
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return "https://janraksha-id-demo.vercel.app";
    }
    return origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "https://janraksha-id-demo.vercel.app";
}

export interface CompactProfile {
  c: string; // janRakshaCode
  n: string; // fullName
  a?: number | null; // age
  g?: string | null; // gender
  t: string; // personType
  b?: string | null; // bloodGroup
  gn: string; // guardianName
  gp: string; // guardianPhone
  ga?: string | null; // guardianAltPhone
  gm?: string | null; // guardianEmail
  gadd?: string | null; // guardianAddress
  al?: string | null; // allergies
  ci?: string | null; // chronicIllness
  cn?: string | null; // criticalNotes
  ed?: string | null; // emergencyDoctor
  dp?: string | null; // doctorPhone
  e?: string | null; // eventName
  bd?: string | null; // assignedBooth
  w?: string | null; // wristbandUid
  p?: string | null; // photoUrl
  s?: string; // status
  ts?: string; // timestamp
}

export function encodeProfilePayload(profile: any): string {
  if (!profile) return "";

  const compact: CompactProfile = {
    c: profile.janRakshaCode || "",
    n: profile.fullName || "",
    a: profile.age !== undefined && profile.age !== null && profile.age !== "" ? Number(profile.age) : undefined,
    g: profile.gender || undefined,
    t: profile.personType || "GENERAL",
    b: profile.bloodGroup || undefined,
    gn: profile.guardianName || "",
    gp: profile.guardianPhone || "",
    ga: profile.guardianAltPhone || undefined,
    gm: profile.guardianEmail || undefined,
    gadd: profile.guardianAddress || undefined,
    al: profile.allergies || undefined,
    ci: profile.chronicIllness || undefined,
    cn: profile.criticalNotes || undefined,
    ed: profile.emergencyDoctor || undefined,
    dp: profile.doctorPhone || undefined,
    e: profile.eventName || undefined,
    bd: profile.assignedBooth || undefined,
    w: profile.wristbandUid || undefined,
    p: profile.photoUrl || undefined,
    s: profile.status || "SAFE",
    ts: profile.createdAt || new Date().toISOString(),
  };

  const json = JSON.stringify(compact);

  if (typeof window !== "undefined") {
    // Browser URL-safe base64
    const utf8Bytes = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    return btoa(utf8Bytes)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } else {
    // Node.js
    return Buffer.from(json, "utf-8").toString("base64url");
  }
}

export function decodeProfilePayload(token: string): any | null {
  if (!token || typeof token !== "string") return null;

  try {
    let json = "";
    if (typeof window !== "undefined") {
      let base64 = token.replace(/-/g, "+").replace(/_/g, "/");
      const mod = base64.length % 4;
      if (mod) base64 += "=".repeat(4 - mod);
      const binary = atob(base64);
      json = decodeURIComponent(
        Array.prototype.map
          .call(binary, (ch: string) => "%" + ("00" + ch.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    } else {
      json = Buffer.from(token, "base64url").toString("utf-8");
    }

    const c: CompactProfile = JSON.parse(json);
    if (!c.c || !c.n) return null;

    return {
      id: `profile-${c.c}`,
      janRakshaCode: c.c,
      fullName: c.n,
      age: c.a ?? null,
      gender: c.g || null,
      personType: c.t || "GENERAL",
      bloodGroup: c.b || "UNKNOWN",
      guardianName: c.gn || "Emergency Contact",
      guardianPhone: c.gp || "",
      guardianAltPhone: c.ga || null,
      guardianEmail: c.gm || null,
      guardianAddress: c.gadd || null,
      allergies: c.al || null,
      chronicIllness: c.ci || null,
      criticalNotes: c.cn || null,
      emergencyDoctor: c.ed || null,
      doctorPhone: c.dp || null,
      eventName: c.e || null,
      assignedBooth: c.bd || null,
      wristbandUid: c.w || null,
      photoUrl: c.p || null,
      status: c.s || "SAFE",
      createdAt: c.ts || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scanLogs: [],
      reunificationNotes: [],
      dispatchAlerts: [],
    };
  } catch (err) {
    console.warn("Failed to decode profile payload:", err);
    return null;
  }
}
