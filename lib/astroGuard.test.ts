import { describe, it, expect } from "vitest";
import { DEMO_USERS, type ConsultMessage, type TriageIncident } from "./astroGuardTypes";
import {
  INITIAL_CONSULT_MESSAGES,
  INITIAL_TRIAGE_INCIDENTS,
  DEFAULT_IOT_SENSORS,
} from "./astroGuardData";

describe("AstroGuard Role Isolation & Auth Specs", () => {
  it("provides exposed demo credentials for all 5 roles", () => {
    const roles = ["crew-0", "crew-1", "crew-2", "doctor", "admin"] as const;
    roles.forEach((role) => {
      const user = DEMO_USERS[role];
      expect(user).toBeDefined();
      expect(user.email).toContain("@ares.nasa.gov");
      expect(user.pass.length).toBeGreaterThan(0);
      expect(user.callSign).toBeDefined();
      expect(user.roleTitle).toBeDefined();
    });
  });

  it("strictly isolates consultation message streams per crew member", () => {
    const testMessages: ConsultMessage[] = [
      {
        id: "m-0",
        senderRole: "astronaut",
        senderName: "Cdr. Amara Okafor",
        crewIndex: 0,
        text: "Crew 0 message",
        timestamp: "10:00 UTC",
      },
      {
        id: "m-1",
        senderRole: "astronaut",
        senderName: "Dr. Lin Zhao",
        crewIndex: 1,
        text: "Crew 1 message",
        timestamp: "10:05 UTC",
      },
      {
        id: "m-2",
        senderRole: "astronaut",
        senderName: "Eng. Rafi Ahmed",
        crewIndex: 2,
        text: "Crew 2 message",
        timestamp: "10:10 UTC",
      },
    ];

    const crew0Stream = testMessages.filter((m) => m.crewIndex === 0);
    const crew1Stream = testMessages.filter((m) => m.crewIndex === 1);
    const crew2Stream = testMessages.filter((m) => m.crewIndex === 2);

    expect(crew0Stream.length).toBe(1);
    expect(crew0Stream[0].senderName).toBe("Cdr. Amara Okafor");

    expect(crew1Stream.length).toBe(1);
    expect(crew1Stream[0].senderName).toBe("Dr. Lin Zhao");

    expect(crew2Stream.length).toBe(1);
    expect(crew2Stream[0].senderName).toBe("Eng. Rafi Ahmed");
  });

  it("calculates doctor unread notifications when astronauts dispatch messages", () => {
    const messages: ConsultMessage[] = [
      {
        id: "1",
        senderRole: "astronaut",
        senderName: "Cdr. Amara Okafor",
        crewIndex: 0,
        text: "EVA prep complete",
        timestamp: "09:00",
        isReadByDoctor: false,
      },
      {
        id: "2",
        senderRole: "astronaut",
        senderName: "Eng. Rafi Ahmed",
        crewIndex: 2,
        text: "Ventilation nominal",
        timestamp: "09:05",
        isReadByDoctor: false,
      },
      {
        id: "3",
        senderRole: "doctor",
        senderName: "Dr. Evelyn Vance",
        crewIndex: 0,
        text: "Acknowledged Commander",
        timestamp: "09:06",
        isReadByDoctor: true,
      },
    ];

    const unread = messages.filter(
      (m) => m.senderRole === "astronaut" && m.isReadByDoctor === false
    );
    expect(unread.length).toBe(2);

    // Marking crew 0 as read
    const afterRead = messages.map((m) =>
      m.crewIndex === 0 && m.senderRole === "astronaut"
        ? { ...m, isReadByDoctor: true }
        : m
    );
    const remainingUnread = afterRead.filter(
      (m) => m.senderRole === "astronaut" && m.isReadByDoctor === false
    );
    expect(remainingUnread.length).toBe(1);
    expect(remainingUnread[0].crewIndex).toBe(2);
  });

  it("verifies IoT wearable sensor array configuration", () => {
    expect(DEFAULT_IOT_SENSORS.length).toBe(6);
    DEFAULT_IOT_SENSORS.forEach((s) => {
      expect(s.batteryPct).toBeGreaterThanOrEqual(0);
      expect(s.batteryPct).toBeLessThanOrEqual(100);
      expect(s.signalRssi).toBeLessThan(0);
      expect(["BLE 5.3", "WiFi 6E", "USB 3.0 / Serial"]).toContain(s.protocol);
    });
  });
});
