"use client";

import { type AstroRole } from "@/lib/astroGuardTypes";

interface QuickRoleBarProps {
  currentRole: AstroRole;
  onSelectRole: (role: AstroRole) => void;
  onOpenLoginModal: () => void;
  onSignOut?: () => void;
}

export function QuickRoleBar({
  currentRole,
  onSelectRole,
  onOpenLoginModal,
  onSignOut,
}: QuickRoleBarProps) {
  const roles: { key: AstroRole; label: string; icon: string; badge: string }[] = [
    { key: "crew-0", label: "Cdr. Amara", icon: "👩🏾‍🚀", badge: "Crew 1" },
    { key: "crew-1", label: "Dr. Lin", icon: "👨🏻‍🚀", badge: "Crew 2" },
    { key: "crew-2", label: "Eng. Rafi", icon: "👨🏽‍🚀", badge: "Crew 3" },
    { key: "doctor", label: "Dr. Evelyn", icon: "👩🏼‍⚕️", badge: "Doctor Hub" },
    { key: "admin", label: "Mission Control", icon: "🛰️", badge: "Admin 3-Crew" },
  ];

  return (
    <div className="sticky top-0 z-40 w-full border-b border-cyan-500/30 bg-slate-950/95 px-4 sm:px-6 py-2 backdrop-blur-md shadow-lg shadow-black/60 font-sans">
      <div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-sm shadow-md shadow-cyan-500/30">
            🛡️
          </span>
          <span className="font-mono text-xs font-bold text-white tracking-wider uppercase">
            AstroGuard Console:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {roles.map((r) => {
            const isActive = currentRole === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => onSelectRole(r.key)}
                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 font-mono text-xs font-bold transition border ${
                  isActive
                    ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-400/30 scale-105"
                    : "bg-slate-900 text-slate-200 border-slate-800 hover:border-slate-700 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="text-sm">{r.icon}</span>
                <span>{r.label}</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] uppercase font-extrabold ${
                    isActive ? "bg-slate-950 text-cyan-300" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {r.badge}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onOpenLoginModal}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition"
            title="Inspect Demo Credentials & Login Gateway"
          >
            🔑 Credentials
          </button>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-1.5 font-mono text-xs font-bold text-rose-300 hover:bg-rose-900/60 hover:text-white transition"
              title="Sign Out to Login Gateway"
            >
              Sign Out [→
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
