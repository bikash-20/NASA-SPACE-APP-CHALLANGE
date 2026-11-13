"use client";

import { useState } from "react";
import { DEMO_USERS, type AstroRole } from "@/lib/astroGuardTypes";

interface LoginPageProps {
  onLogin: (role: AstroRole) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<AstroRole>("crew-0");
  const [email, setEmail] = useState(DEMO_USERS["crew-0"].email);
  const [password, setPassword] = useState(DEMO_USERS["crew-0"].pass);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSelectRolePreset = (role: AstroRole) => {
    setSelectedRole(role);
    setEmail(DEMO_USERS[role].email);
    setPassword(DEMO_USERS[role].pass);
    setErrorMsg("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate credentials against DEMO_USERS
    const matchedRole = (Object.keys(DEMO_USERS) as AstroRole[]).find(
      (r) =>
        DEMO_USERS[r].email.toLowerCase() === email.trim().toLowerCase() &&
        DEMO_USERS[r].pass === password.trim()
    );

    if (matchedRole) {
      onLogin(matchedRole);
    } else {
      setErrorMsg("Invalid credentials. Please click any demo card above to load valid credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-[#050914] text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <header className="mx-auto w-full max-w-6xl flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-2xl shadow-lg shadow-cyan-500/25">
            🛡️
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>AstroGuard</span>
              <span className="rounded-md bg-cyan-950 px-2 py-0.5 font-mono text-xs font-bold text-cyan-400 border border-cyan-500/30">
                ARES-1 GATEWAY
              </span>
            </h1>
            <p className="text-sm font-medium text-slate-400">
              NASA Space Apps Challenge · Autonomous Crew Health &amp; Tele-Health System
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-xs">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3 py-1 font-semibold text-emerald-400 border border-emerald-500/40">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetry Uplink Active</span>
          </span>
          <span className="hidden sm:inline-block rounded-full bg-slate-900 px-3 py-1 text-slate-400 border border-slate-800">
            TLS 1.3 Certified
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-6xl my-8 space-y-8">
        {/* Banner */}
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-6 shadow-xl">
          <div className="max-w-3xl space-y-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-400">
              Multi-Tenant Role Isolation
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Select an Astronaut, Doctor, or Mission Control Console
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Every crew member gets their own private portal with isolated tele-health channels, real-time Lead-II ECG canvas monitoring, 24H biometric charts, and IoT bio-links. The Flight Surgeon oversees clinical triage and incoming calls.
            </p>
          </div>
        </div>

        {/* 1-Click Demo Profiles Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
              Demo Access Profiles · 1-Click Immediate Login
            </h3>
            <span className="font-mono text-xs text-amber-400 font-semibold">
              Credentials Exposed for Evaluation
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(DEMO_USERS) as AstroRole[]).map((roleKey) => {
              const u = DEMO_USERS[roleKey];
              const isSelected = selectedRole === roleKey;
              const isDoctor = roleKey === "doctor";
              const isAdmin = roleKey === "admin";

              return (
                <div
                  key={roleKey}
                  className={`flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                    isSelected
                      ? "border-cyan-400 bg-slate-900/90 shadow-xl shadow-cyan-500/15 ring-1 ring-cyan-400"
                      : "border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/50"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${u.avatarBg} text-lg font-bold text-white shadow-md`}
                        >
                          {isDoctor
                            ? "👩🏼‍⚕️"
                            : isAdmin
                            ? "🛰️"
                            : roleKey === "crew-0"
                            ? "👩🏾‍🚀"
                            : roleKey === "crew-1"
                            ? "👨🏻‍🚀"
                            : "👨🏽‍🚀"}
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white leading-tight">
                            {u.name}
                          </h4>
                          <span className="font-mono text-xs text-cyan-400 font-medium">
                            {u.callSign}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider ${
                          isDoctor
                            ? "bg-rose-950 text-rose-300 border border-rose-500/40"
                            : isAdmin
                            ? "bg-purple-950 text-purple-300 border border-purple-500/40"
                            : "bg-cyan-950 text-cyan-300 border border-cyan-500/30"
                        }`}
                      >
                        {isDoctor
                          ? "Doctor Hub"
                          : isAdmin
                          ? "Admin"
                          : "Astronaut"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium">
                      {u.roleTitle}
                    </p>

                    {/* Credentials Preview Strip */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 font-mono text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="text-slate-200 font-medium select-all">
                          {u.email}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pass:</span>
                        <span className="text-amber-400 font-bold select-all">
                          {u.pass}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectRolePreset(roleKey)}
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-900 py-2 font-mono text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
                    >
                      Prefill Form
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectRolePreset(roleKey);
                        onLogin(roleKey);
                      }}
                      className={`flex-1 rounded-xl py-2 font-mono text-xs font-bold text-white transition shadow-md ${
                        isDoctor
                          ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                          : isAdmin
                          ? "bg-purple-600 hover:bg-purple-500 shadow-purple-600/30"
                          : "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30"
                      }`}
                    >
                      Sign In →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manual Login Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 max-w-xl mx-auto shadow-xl">
          <div className="border-b border-slate-800 pb-3 mb-4">
            <h3 className="text-base font-bold text-white">
              Manual Operator Sign-In
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Enter email and passkey to launch your authorized module
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Operator Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. amara@ares.nasa.gov"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white font-mono focus:border-cyan-400 focus:outline-none placeholder-slate-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Passkey
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. amara123"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white font-mono focus:border-cyan-400 focus:outline-none placeholder-slate-500"
                required
              />
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300 font-mono">
                ⚠ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 py-3 font-mono text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-indigo-500 transition"
            >
              Authenticate &amp; Launch Console
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto w-full max-w-6xl border-t border-slate-800/80 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
        <div>
          Contract: <span className="text-cyan-400 font-bold">Rules decide, AI advises.</span>
        </div>
        <div>
          NASA Space Apps Challenge · Educational Bio-Telemetry Prototype
        </div>
      </footer>
    </div>
  );
}
