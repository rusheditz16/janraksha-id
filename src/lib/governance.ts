// Humanitarian Data Governance, RBAC Permissions & ICRC Retention Engine

export type ScopedRole =
  | "EVENT_ADMIN"
  | "POLICE_OFFICER"
  | "RELIEF_CAMP_WORKER"
  | "HOSPITAL_TRIAGE"
  | "VOLUNTEER";

export interface RolePermissions {
  role: ScopedRole;
  title: string;
  organization: string;
  canAuthorizeChildHandoff: boolean;
  requiresDualVerification: boolean;
  canViewUnmaskedAddress: boolean;
  canEditMedicalAlerts: boolean;
  canManageRetentionSchedule: boolean;
  canInitiateCrossOrgShare: boolean;
  canWithdrawConsentPurge: boolean;
}

export const ROLE_PERMISSIONS: Record<ScopedRole, RolePermissions> = {
  EVENT_ADMIN: {
    role: "EVENT_ADMIN",
    title: "Event Command Administrator",
    organization: "Central District Disaster Authority",
    canAuthorizeChildHandoff: true,
    requiresDualVerification: true,
    canViewUnmaskedAddress: true,
    canEditMedicalAlerts: true,
    canManageRetentionSchedule: true,
    canInitiateCrossOrgShare: true,
    canWithdrawConsentPurge: true,
  },
  POLICE_OFFICER: {
    role: "POLICE_OFFICER",
    title: "Police Officer / Missing Persons Bureau",
    organization: "State Police Special Juvenile Police Unit (SJPU)",
    canAuthorizeChildHandoff: true,
    requiresDualVerification: true,
    canViewUnmaskedAddress: true,
    canEditMedicalAlerts: false,
    canManageRetentionSchedule: false,
    canInitiateCrossOrgShare: true,
    canWithdrawConsentPurge: false,
  },
  RELIEF_CAMP_WORKER: {
    role: "RELIEF_CAMP_WORKER",
    title: "Trained Child Protection Worker",
    organization: "UNICEF / Red Cross Emergency Camp",
    canAuthorizeChildHandoff: true,
    requiresDualVerification: true,
    canViewUnmaskedAddress: false,
    canEditMedicalAlerts: false,
    canManageRetentionSchedule: false,
    canInitiateCrossOrgShare: true,
    canWithdrawConsentPurge: true,
  },
  HOSPITAL_TRIAGE: {
    role: "HOSPITAL_TRIAGE",
    title: "Hospital Emergency & Triage Officer",
    organization: "Civil Hospital & Red Cross First-Aid",
    canAuthorizeChildHandoff: false,
    requiresDualVerification: true,
    canViewUnmaskedAddress: false,
    canEditMedicalAlerts: true,
    canManageRetentionSchedule: false,
    canInitiateCrossOrgShare: true,
    canWithdrawConsentPurge: false,
  },
  VOLUNTEER: {
    role: "VOLUNTEER",
    title: "Authorized Field Volunteer",
    organization: "Civil Defense Volunteer Corps",
    canAuthorizeChildHandoff: false, // UNICEF: Field volunteers cannot authorize release of minors alone
    requiresDualVerification: true,
    canViewUnmaskedAddress: false,
    canEditMedicalAlerts: false,
    canManageRetentionSchedule: false,
    canInitiateCrossOrgShare: false,
    canWithdrawConsentPurge: false,
  },
};

export interface EventGovernanceConfig {
  eventId: string;
  eventName: string;
  leadOrganization: string;
  eventStartDate: string;
  eventEndDate: string;
  retentionWindowHours: number; // e.g. 72 hours
  autoPurgeEnabled: boolean;
  lastRetentionAudit: string;
}

export function getDefaultEventConfig(): EventGovernanceConfig {
  const now = new Date();
  const endDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days duration
  return {
    eventId: "EVT-MELA-2026-DEL",
    eventName: "Grand Gathering & Emergency Relief Camp 2026",
    leadOrganization: "National Disaster Response & Child Protection Wing",
    eventStartDate: now.toISOString(),
    eventEndDate: endDate.toISOString(),
    retentionWindowHours: 72,
    autoPurgeEnabled: true,
    lastRetentionAudit: now.toISOString(),
  };
}

export function checkRecordExpiry(createdAt: string, retentionHours = 72): {
  isExpired: boolean;
  expiresAt: string;
  hoursRemaining: number;
} {
  const created = new Date(createdAt).getTime();
  const expires = created + retentionHours * 60 * 60 * 1000;
  const now = Date.now();
  const diffHours = Math.round((expires - now) / (1000 * 60 * 60));

  return {
    isExpired: now > expires,
    expiresAt: new Date(expires).toLocaleDateString(),
    hoursRemaining: Math.max(0, diffHours),
  };
}

// ICRC Humanitarian Consent Withdrawal: Anonymizes and erases PII upon guardian request
export function purgeGuardianPII(profile: any, actorName: string, reason: string): any {
  return {
    ...profile,
    fullName: `[ANONYMIZED REUNITED CASE - ${profile.janRakshaCode}]`,
    photoUrl: null,
    guardianName: "[PURGED UPON GUARDIAN REQUEST]",
    guardianPhone: "[PURGED]",
    guardianAltPhone: null,
    guardianEmail: null,
    guardianAddress: "[PURGED UNDER HUMANITARIAN ERASURE RIGHT]",
    criticalNotes: "[PURGED]",
    allergies: null,
    chronicIllness: null,
    status: "REUNITED",
    isConsentWithdrawn: true,
    consentWithdrawnAt: new Date().toISOString(),
    consentWithdrawnBy: actorName,
    erasureReason: reason,
  };
}

// Controlled Cross-Organization Case Sharing Token (24h validity with PIN)
export interface CrossOrgShareToken {
  token: string;
  pin: string;
  profileId: string;
  janRakshaCode: string;
  sourceOrg: string;
  destinationOrg: string;
  authorizedBy: string;
  expiresAt: string;
}

export function generateCrossOrgShareToken(
  profileId: string,
  code: string,
  sourceOrg: string,
  destinationOrg: string,
  authorizedBy: string
): CrossOrgShareToken {
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const token = `XSHARE-${Date.now().toString().slice(-6)}-${pin}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  return {
    token,
    pin,
    profileId,
    janRakshaCode: code,
    sourceOrg,
    destinationOrg,
    authorizedBy,
    expiresAt,
  };
}
