"use client";

import { useState } from "react";
import { DEMO_USERS, type AstroRole } from "@/lib/astroGuardTypes";

interface AuthModalProps {
  isOpen: boolean;
  onSelectRole: (role: AstroRole) => void;
  onClose?: () => void;
  currentRole: AstroRole;
}

export function AuthModal({
  isOpen,
  onSelectRole,
  onClose,
  currentRole,
}: AuthModalProps) {
  const [selectedUserKey, setSelectedUserKey] = useState<AstroRole>(currentRole);
  const [emailInput, setEmailInput] = useState(DEMO_USERS[currentRole].email);
  const [passInput, setPassInput] = useState(DEMO_USERS[currentRole].pass);

  if (!isOpen) return null;

  const handlePickUser = (role: AstroRole) => {
    setSelectedUserKey(role);
    setEmailInput(DEMO_USERS[role].email);
    setPassInput(DEMO_USERS[role].pass);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSelectRole(selectedUserKey);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-cyan-500/40 bg-slate-950 p-6 shadow-2xl shadow-cyan-950/60 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-lg shadow-lg shadow-cyan-500/30">
              🛡️
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                AstroGuard Space Health Access Gateway
              </h2>
              <p className="font-mono text-xs text-cyan-400">
                Select a demo role or sign in with exposed credentials
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white font-mono text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* 1-Click Role Selection Cards */}
        <div className="my-5">
          <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            1-Click Demo Profiles (Credentials Pre-loaded)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {(Object.keys(DEMO_USERS) as AstroRole[]).map((roleKey) => {
              const u = DEMO_USERS[roleKey];
              const isSelected = selectedUserKey === roleKey;

              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => handlePickUser(roleKey)}
                  className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-cyan-400 bg-cyan-950/30 shadow-md shadow-cyan-500/20"
                      : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-white truncate">
                      {u.name}
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.2 font-mono text-[9px] text-cyan-300">
                      {u.callSign}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 truncate mt-0.5">
                    {u.roleTitle}
                  </span>

                  <div className="mt-2 w-full pt-1.5 border-t border-slate-800/80 font-mono text-[10px] text-slate-400 space-y-0.5">
                    <div>
                      <span className="text-slate-500">Email: </span>
                      <span className="text-slate-300">{u.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Pass: </span>
                      <span className="text-amber-400 font-semibold">{u.pass}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-800 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[11px] uppercase text-slate-400 mb-1">
                Operator Email
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-[11px] uppercase text-slate-400 mb-1">
                Access Passkey
              </label>
              <input
                type="text"
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="font-mono text-[11px] text-emerald-400">
              ● TLS 1.3 Certified Session Gateway
            </span>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-cyan-600/30 hover:from-cyan-400 hover:to-blue-500 transition"
            >
              Sign In to {DEMO_USERS[selectedUserKey].name}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
