import type { Crew, Alert } from "./types";

export type AstroRole = "crew-0" | "crew-1" | "crew-2" | "doctor" | "admin";

export interface AstroUser {
  id: AstroRole;
  name: string;
  callSign: string;
  roleTitle: string;
  email: string;
  pass: string;
  avatarBg: string;
  assignedCrewIndex?: 0 | 1 | 2;
}

export const DEMO_USERS: Record<AstroRole, AstroUser> = {
  "crew-0": {
    id: "crew-0",
    name: "Cdr. Amara Okafor",
    callSign: "AST-001",
    roleTitle: "Mission Commander",
    email: "amara@ares.nasa.gov",
    pass: "amara123",
    avatarBg: "from-blue-600 to-indigo-800",
    assignedCrewIndex: 0,
  },
  "crew-1": {
    id: "crew-1",
    name: "Dr. Lin Zhao",
    callSign: "AST-002",
    roleTitle: "Flight Surgeon & Science Specialist",
    email: "lin@ares.nasa.gov",
    pass: "lin123",
    avatarBg: "from-teal-600 to-emerald-800",
    assignedCrewIndex: 1,
  },
  "crew-2": {
    id: "crew-2",
    name: "Eng. Rafi Ahmed",
    callSign: "AST-003",
    roleTitle: "Systems & Avionics Engineer",
    email: "rafi@ares.nasa.gov",
    pass: "rafi123",
    avatarBg: "from-amber-600 to-orange-800",
    assignedCrewIndex: 2,
  },
  doctor: {
    id: "doctor",
    name: "Dr. Evelyn Vance",
    callSign: "MED-002",
    roleTitle: "Chief Flight Surgeon",
    email: "doctor@ares.nasa.gov",
    pass: "flightdoc",
    avatarBg: "from-rose-600 to-purple-800",
  },
  admin: {
    id: "admin",
    name: "Flight Director",
    callSign: "FLIGHT-01",
    roleTitle: "Mission Operations Director",
    email: "flight@ares.nasa.gov",
    pass: "missioncontrol",
    avatarBg: "from-cyan-600 to-blue-900",
  },
};

export interface IoTSensorDevice {
  id: string;
  name: string;
  code: string;
  protocol: "BLE 5.3" | "WiFi 6E" | "USB 3.0 / Serial";
  signalRssi: number; // e.g. -48 dBm
  batteryPct: number; // 0..100
  dataCategory: "Direct Sensor" | "Derived / Algorithmic" | "Hardware Interconnect";
  livePayload: string;
  calibrationNote: string;
  online: boolean;
  type: "patch" | "watch" | "ecg" | "meal" | "bp" | "cgm";
}

export interface ConsultMessage {
  id: string;
  senderRole: "astronaut" | "doctor" | "system";
  senderName: string;
  crewIndex: 0 | 1 | 2;
  text: string;
  timestamp: string;
  voiceNoteDuration?: number; // seconds, e.g. 11
  isEmergencyAlert?: boolean;
  isReadByDoctor?: boolean;
}

export interface ActiveCallState {
  isOpen: boolean;
  type: "audio" | "video";
  targetCrewIndex: 0 | 1 | 2;
  crewName: string;
  isMuted: boolean;
  isVideoMuted: boolean;
  durationSeconds: number;
}

export interface TriageIncident {
  id: string;
  crewIndex: 0 | 1 | 2;
  crewName: string;
  callSign: string;
  title: string;
  detail: string;
  severity: "critical" | "warning" | "nominal";
  timestamp: string;
  isSos: boolean;
  flaggedToMissionControl: boolean;
  isReadByDoctor?: boolean;
}

export interface NutritionItem {
  id: string;
  name: string;
  code: string;
  icon: "water" | "meat" | "pill" | "leaf";
  proteinG: number;
  fatsG: number;
  fiberG: number;
  waterMl: number;
  caloriesKcal: number;
}
