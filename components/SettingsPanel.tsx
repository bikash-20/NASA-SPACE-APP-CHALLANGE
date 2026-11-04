"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/Button";
import {
  DEFAULT_LOCAL_AI_SETTINGS,
  fetchOllamaModels,
  type LocalAiSettings,
} from "@/lib/localAi";

interface SettingsPanelProps {
  open: boolean;
  settings: LocalAiSettings;
  storageWarning?: string;
  onClose: () => void;
  onSave: (settings: LocalAiSettings) => string | null;
}

export function SettingsPanel({
  open,
  settings,
  storageWarning,
  onClose,
  onSave,
}: SettingsPanelProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  const [draft, setDraft] = useState(settings);
  const [models, setModels] = useState<string[]>([]);
  const [connectionState, setConnectionState] = useState<
    "idle" | "checking" | "connected" | "failed"
  >("idle");
  const [connectionMessage, setConnectionMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    setDraft(settings);
    setSaveError("");
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    (dialog?.querySelector<HTMLElement>("#ollama-url") ?? focusable?.[0])?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
      if (event.key !== "Tab") return;
      const elements = Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [open, settings]);

  const update = <K extends keyof LocalAiSettings>(
    key: K,
    value: LocalAiSettings[K]
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaveError("");
  };

  const testConnection = async () => {
    setConnectionState("checking");
    setConnectionMessage("");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const found = await fetchOllamaModels(draft.ollamaUrl, controller.signal);
      setModels(found);
      setConnectionState("connected");
      setConnectionMessage(
        found.length
          ? `Connected · ${found.length} model${found.length === 1 ? "" : "s"} found.`
          : "Connected, but no models are installed yet. Pull a model in Ollama, then test again."
      );
    } catch (error) {
      setConnectionState("failed");
      setConnectionMessage(
        controller.signal.aborted
          ? "Connection timed out after 10 seconds."
          : error instanceof Error
            ? error.message
            : "Could not connect to Ollama."
      );
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const save = () => {
    const error = onSave(draft);
    if (error) setSaveError(error);
    else onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close settings"
            className="fixed inset-0 z-40 cursor-default bg-black/65 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            tabIndex={-1}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-white/10 bg-[#0b0b16] shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
              <div>
                <h2 id="settings-title" className="text-xl font-semibold text-ink">
                  Preferences
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  Configure local inference and voice services.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close settings"
                className="tappable rounded-lg border border-white/10 bg-white/5 px-3 text-white/75 hover:bg-white/10"
              >
                Close
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-7">
              <section className="space-y-4" aria-labelledby="inference-heading">
                <div>
                  <h3 id="inference-heading" className="text-sm font-semibold uppercase tracking-wider text-accent">
                    Inference
                  </h3>
                  <p className="mt-1 text-sm text-white/60">
                    Local Ollama requests go directly from this browser to your configured host.
                  </p>
                </div>

                <fieldset className="grid grid-cols-2 gap-2">
                  <legend className="sr-only">Assistant provider</legend>
                  {([
                    ["openrouter", "OpenRouter"],
                    ["ollama", "Local Ollama"],
                  ] as const).map(([provider, label]) => (
                    <button
                      key={provider}
                      type="button"
                      aria-pressed={draft.provider === provider}
                      onClick={() => update("provider", provider)}
                      className={`tappable rounded-lg border px-3 text-sm font-medium transition-colors ${
                        draft.provider === provider
                          ? "border-accent/70 bg-accent/10 text-accent"
                          : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.07]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </fieldset>

                <Field label="Ollama server URL" htmlFor="ollama-url">
                  <input
                    id="ollama-url"
                    type="url"
                    autoComplete="url"
                    value={draft.ollamaUrl}
                    onChange={(event) => update("ollamaUrl", event.target.value)}
                    placeholder="http://localhost:11434"
                    className={inputClass}
                  />
                </Field>
                <p className="-mt-2 text-sm leading-relaxed text-white/55">
                  For another device on your network, use its host URL. Ollama must allow this app&apos;s origin with{" "}
                  <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-accent">OLLAMA_ORIGINS</code>.
                  A LAN host also needs to bind to a reachable interface. Only expose Ollama on a trusted network; browsers may block plain HTTP LAN connections from an HTTPS deployment.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => update("ollamaUrl", DEFAULT_LOCAL_AI_SETTINGS.ollamaUrl)}
                  >
                    Use localhost
                  </Button>
                  <Button
                    type="button"
                    onClick={testConnection}
                    disabled={connectionState === "checking"}
                  >
                    {connectionState === "checking" ? "Testing…" : "Test connection"}
                  </Button>
                  {connectionMessage && (
                    <p
                      role={connectionState === "failed" ? "alert" : "status"}
                      className={`w-full text-sm ${
                        connectionState === "failed" ? "text-rose-200" : "text-emerald-200"
                      }`}
                    >
                      {connectionMessage}
                    </p>
                  )}
                </div>

                <Field label="Ollama model" htmlFor="ollama-model">
                  <input
                    id="ollama-model"
                    list="ollama-models"
                    value={draft.model}
                    onChange={(event) => update("model", event.target.value)}
                    placeholder="Test connection to discover installed models"
                    className={inputClass}
                  />
                  <datalist id="ollama-models">
                    {models.map((model) => <option key={model} value={model} />)}
                  </datalist>
                </Field>

                <Field label="System prompt (optional)" htmlFor="local-system-prompt">
                  <textarea
                    id="local-system-prompt"
                    value={draft.systemPrompt}
                    onChange={(event) => update("systemPrompt", event.target.value)}
                    maxLength={4000}
                    rows={4}
                    placeholder="You are a helpful assistant that replies concisely."
                    className={`${inputClass} min-h-28 resize-y py-3`}
                  />
                  <p className="text-xs text-white/50">
                    Operator preferences are added beneath fixed safety instructions. They cannot change alert decisions.
                  </p>
                </Field>
              </section>

              <section className="space-y-4 border-t border-white/10 pt-5" aria-labelledby="voice-heading">
                <div>
                  <h3 id="voice-heading" className="text-sm font-semibold uppercase tracking-wider text-accent">
                    Voice services
                  </h3>
                  <p className="mt-1 text-sm text-white/60">
                    Optional local endpoints. Microphone audio is sent only to the STT URL below.
                  </p>
                </div>
                <Field label="Voice (STT) endpoint" htmlFor="stt-endpoint">
                  <input
                    id="stt-endpoint"
                    type="url"
                    value={draft.sttEndpoint}
                    onChange={(event) => update("sttEndpoint", event.target.value)}
                    placeholder="http://localhost:5005/transcribe"
                    className={inputClass}
                  />
                </Field>
                <Field label="Whisper model name" htmlFor="stt-model">
                  <input
                    id="stt-model"
                    value={draft.sttModel}
                    onChange={(event) => update("sttModel", event.target.value)}
                    placeholder="whisper"
                    className={inputClass}
                  />
                </Field>
                <Field label="Voice (TTS) engine" htmlFor="tts-engine">
                  <select
                    id="tts-engine"
                    value={draft.ttsEngine}
                    onChange={(event) => {
                      const engine = event.target.value as LocalAiSettings["ttsEngine"];
                      setDraft((current) => ({
                        ...current,
                        ttsEngine: engine,
                        ttsModel: engine === "piper" ? "piper" : "qwen3-tts",
                        ttsVoice: engine === "piper" ? "en_US-lessac-medium" : "Vivian",
                      }));
                    }}
                    className={inputClass}
                  >
                    <option value="piper">Piper</option>
                    <option value="qwen3-tts">Qwen3 TTS</option>
                  </select>
                </Field>
                <Field label="Voice (TTS) endpoint" htmlFor="tts-endpoint">
                  <input
                    id="tts-endpoint"
                    type="url"
                    value={draft.ttsEndpoint}
                    onChange={(event) => update("ttsEndpoint", event.target.value)}
                    placeholder="http://localhost:5006/speak"
                    className={inputClass}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="TTS model" htmlFor="tts-model">
                    <input
                      id="tts-model"
                      value={draft.ttsModel}
                      onChange={(event) => update("ttsModel", event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="TTS voice" htmlFor="tts-voice">
                    <input
                      id="tts-voice"
                      value={draft.ttsVoice}
                      onChange={(event) => update("ttsVoice", event.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <p className="text-sm leading-relaxed text-white/55">
                  STT sends multipart fields <code className="text-accent">file</code> and <code className="text-accent">model</code>, and expects JSON <code className="text-accent">{"{ text }"}</code> or plain text. TTS sends JSON with text/model/voice and expects raw audio bytes. Your service must permit browser CORS.
                </p>
              </section>

              <p className="rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm leading-relaxed text-white/70">
                The simulation and rule alerts continue offline in the browser. The installed app shell is cached; local AI and voice require their local services to be running.
              </p>
              {storageWarning && (
                <p role="status" className="rounded-lg border border-amber-300/25 bg-amber-300/5 p-3 text-sm text-amber-100">
                  {storageWarning}
                </p>
              )}
              {saveError && (
                <p role="alert" className="rounded-lg border border-bad/30 bg-bad/10 p-3 text-sm text-rose-100">
                  {saveError}
                </p>
              )}
            </div>

            <footer className="flex shrink-0 justify-end gap-2 border-t border-white/10 bg-[#0b0b16] px-5 py-4 sm:px-7">
              <Button type="button" onClick={onClose}>Cancel</Button>
              <Button type="button" variant="primary" onClick={save}>Save</Button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-white/80">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2.5 text-base text-ink placeholder:text-white/40 focus:border-accent/50 focus:outline-none";