# Crew Health Monitor — System Vision

## Purpose

Crew Health Monitor is a prototype for exploring how a crew-health support
system could keep working when a spacecraft has no connection to Earth. The
long-term goal is a system that can receive local sensor readings, detect
conditions using validated deterministic rules, present understandable alerts,
and provide a locally running conversational assistant and voice interface.

The core design rule is:

> **Sensors report. Deterministic rules decide. AI explains. Crew and mission
> professionals remain in control.**

This document describes both the current prototype and the proposed direction.
It is a concept and engineering roadmap, not a claim that the current web app
has flight hardware, validated medical algorithms, or autonomous life-support
capabilities.

## Current prototype: what exists today

The current application is a browser-based simulation and user-interface
prototype:

- It generates **synthetic telemetry** for three simulated crew members. It
  does not connect to a watch, biomedical suit, dosimeter, radiation detector,
  spacecraft bus, or other physical sensor.
- It evaluates five deterministic rules over the simulated readings: heart
  rate, oxygen saturation, sleep, stress, and radiation dose/rate.
- It creates and tracks alerts in browser memory. A simulation tick—not an
  incoming radio packet—updates the readings.
- Its AI risk score is a deterministic display calculation. It is not a
  trained medical model and does not decide whether an alert is raised.
- Briefs and chat can use a model already running in Ollama on a reachable
  computer. The browser sends requests to Ollama's HTTP API; typing into
  `ollama run` is not a connection method for the app.
- The voice controls can call configured speech-to-text and text-to-speech
  HTTP endpoints. Whisper, Piper, Qwen3 TTS, and their service hosts are
  external; this repository does not install or run those services.
- The installable PWA caches an app shell and static assets. After the shell is
  cached, the simulation UI and deterministic rules can run without internet.
  An Ollama or voice service must still be powered on and reachable for local
  inference or voice.
- Provider preferences are stored in browser `localStorage`; mission readings,
  chat history, and alerts are not currently saved as a durable local mission
  record.

The current prototype is useful for demonstrating UI flows, scenario
simulation, rule/AI separation, and browser-to-local-service integration. Its
synthetic values and rules must not be used to make real medical or mission
decisions.

## Long-term goal

The proposed system would support two deployment modes using the same
operator-facing software:

### Software-only mode

Run the dashboard, simulation, local rules, local model, and optional speech
services on a laptop or local computer. This mode is useful for development,
training, demonstrations, and offline exercises. It can replay recorded or
synthetic data, but it does not become a sensor system merely by running
offline.

### Hardware-plus-software mode

Add validated wearable or suit sensors and one or more local gateways. The
gateway receives sensor data over a suitable local link, validates and
timestamps it, and supplies it to the same decision and presentation layers.
Possible links include wired connections or short-range radio such as Bluetooth
Low Energy (BLE); the final choice depends on device compatibility, range,
power, interference, and mission requirements.

The hardware mode should retain a software-only simulator so the interface,
rules, and offline workflows can be exercised when sensors are unavailable.

## Proposed end-to-end data flow

```text
Wearable / suit / environmental instruments
                 │
       wired link or local radio
                 ▼
       Onboard edge gateway
   identity · time · units · quality
                 │
                 ▼
       Validated sensor stream
          ┌──────┴────────┐
          ▼               ▼
 Deterministic rules   Local mission log
          │               │
          ▼               │
 Local alert state ◄──────┘
          │
          ├── Dashboard and crew acknowledgement
          ├── Local AI explanation / question-answering
          └── Local speech-to-text and text-to-speech
                 │
          Optional Earth link
       when connectivity is available
```

The Earth link is an optional path for synchronization and consultation. It is
not on the critical path for acquiring readings, evaluating rules, presenting
alerts, or using a model that is already installed and running locally.

## Candidate data sources

These are areas for research and integration, not sensors included in the
current repository. Sensor selection, placement, calibration, and alert
thresholds require domain experts and verification against the intended
mission.

| Concern | Candidate inputs | Important caveats |
| --- | --- | --- |
| Cardiac strain | ECG, heart rate, pulse oximetry, activity/context | Motion, fit, individual baselines, and sensor faults can distort readings. A heart-rate threshold alone is not a diagnosis. |
| Oxygenation and respiration | Pulse oximetry, respiratory rate, suit/environment telemetry | Measurement quality and sensor placement must be surfaced with every value. |
| Sleep and fatigue indicators | Wearable motion/actigraphy, sleep schedule, optional crew input | These are estimates; they should not be presented as a clinical sleep diagnosis. |
| Stress/workload indicators | Validated physiological signals, workload/context inputs, optional self-report | Stress is not directly measured by one universal sensor. Avoid treating a proxy as a fact about a person's mental state. |
| Radiation exposure | Personal dosimeter, suit/vehicle radiation instruments, dose history | A solar event is not the same as a crew dose measurement. Instrument readings, timestamps, location, and uncertainty matter. |
| Solar-space-weather context | Dedicated particle/radiation detectors and mission-provided space-weather feeds | Detection and forecasting are different capabilities. External forecasts may be unavailable offline; local detection depends on onboard instruments. |

Use the least data needed for an approved decision. Each reading should carry
its source, crew/device association, timestamp, unit, quality/status, and
calibration metadata. The system should clearly distinguish measured,
derived, estimated, simulated, and missing values.

## Offline, local network, and power model

### Internet-independent operation

The target system should not require cloud access for core monitoring. Sensor
ingestion, deterministic rules, alerts, the mission log, and local AI/voice
should run on equipment physically available to the crew. Models and required
software must be installed and tested before isolation; downloading a model is
not possible after the link is lost.

### Local area network (LAN)

If devices and the edge gateway are connected to the same powered local
network, they may exchange data without internet access. This can support a
nearby laptop or tablet, subject to network routing, firewall rules, device
discovery, and service configuration. A LAN is not guaranteed by having the
same Wi-Fi name: the access point, gateway, and devices must remain powered and
permit the required local traffic.

For spacecraft or mobile field use, do not assume public internet or a
consumer Wi-Fi router. Select a mission-appropriate local network and radio
architecture, and provide a direct wired or other approved fallback where
required.

### Power and degraded operation

Offline does not mean power-independent. The gateway, sensors, display, radio,
and local inference hardware all need power. A real design needs a mission
power budget, protected reserve energy, charging strategy, health monitoring,
and graceful behavior during low-power conditions. Core rule processing and
alerts should have a defined priority over optional model generation and
speech.

When a sensor or link fails, the system should mark its data stale or
unavailable, preserve the last valid value with its age, report the failure,
and avoid silently substituting a plausible-looking value. If local AI is
unavailable, deterministic monitoring and alerts should continue.

## Decision and automation boundaries

1. **Sensor acquisition is not alert authority.** Sensors supply observations;
   validation checks whether those observations are usable.
2. **Approved deterministic logic owns alert state.** Rules operate on valid,
   sufficiently fresh inputs and produce explainable levels and evidence.
3. **AI is advisory.** The local model can summarize a validated snapshot,
   explain an existing rule result, answer questions, and help navigate
   procedures that have been approved and loaded locally. It cannot create,
   suppress, escalate, or clear a safety alert.
4. **People retain command.** The tool supports crew and mission professionals;
   it does not replace their judgment, approved flight rules, emergency
   procedures, or communication with Earth when that is available.
5. **No silent sensor failure.** Missing, delayed, out-of-range, uncalibrated,
   or contradictory inputs must be visible and handled by explicit quality
   policies.
6. **No false guarantee.** A local model can be wrong or unavailable. It cannot
   guarantee survival, diagnose a crew member, or replace validated medical
   equipment, training, redundancy, or mission procedures.

The existing application follows the first architectural boundary in the
simulation: `lib/rules.ts` owns rule results, while the AI score and LLM output
are advisory. A hardware integration must preserve and strengthen that
separation.

## Local AI and voice in the target design

- **Local model:** A model such as an Ollama-served model runs on a local
  computer with its weights already installed. Inference stays on that
  computer and does not require the terminal's interactive `ollama run` prompt;
  the application calls the Ollama HTTP API.
- **Grounded responses:** The assistant receives only a bounded, validated
  snapshot and relevant conversation context. It should cite which measured
  values and rule outputs it is discussing and identify missing/stale data.
- **Speech input:** A local speech-to-text service converts crew speech into
  text. The user can review the transcript before sending it. Audio should not
  be sent to a cloud service in offline/local mode.
- **Speech output:** A local Piper or Qwen3 TTS service may read assistant
  replies or approved alerts aloud. Safety-critical alert delivery must not
  depend on generated speech alone; provide visual and, where required,
  independently validated audible indicators.
- **Resource limits:** Local language and speech models need sufficient
  storage, memory, compute, thermal headroom, and power. Define model versions,
  test them on target hardware, and retain deterministic fallback behavior.

The prototype currently exposes configurable browser-to-Ollama and
browser-to-voice HTTP contracts. These are integration seams, not a secured
onboard gateway or production voice stack. Direct browser connections require
reachable endpoints and suitable CORS/network configuration. Do not expose an
unauthenticated model server to an untrusted network.

## Proposed implementation roadmap

### Stage 1 — Prototype and simulation (current)

- Exercise deterministic rules using synthetic telemetry and repeatable
  scenarios.
- Demonstrate the local model, voice endpoint contracts, browser settings, and
  offline app-shell behavior.
- Document that sensor acquisition and persistent mission records are not yet
  implemented.

### Stage 2 — Sensor-independent data contract

- Define a versioned telemetry schema including source/device identity,
  timestamp, units, quality, calibration state, and simulated-vs-measured
  provenance.
- Add fixtures and replay tools so sensor data can be tested without physical
  hardware.
- Define freshness, missing-data, outlier, clock-drift, and conflicting-sensor
  policies before using any input for an alert.

### Stage 3 — Local gateway and resilient records

- Build a local edge service that receives approved sensor protocols, validates
  data, and serves the dashboard and model over a restricted local interface.
- Add bounded local storage, retention/export controls, encryption and access
  control appropriate to the deployment, and recovery after power loss.
- Verify that the essential rules and alert display work with the internet
  physically disconnected.

### Stage 4 — Hardware integration

- Integrate one sensor class at a time using documented device adapters.
- Validate identity association, calibration, signal quality, range, dropout,
  reconnect, and device replacement.
- Compare sensor outputs against independent references and expert-reviewed
  acceptance criteria before enabling operational alerts.

### Stage 5 — Mission assurance

- Conduct hazard analysis, human-factors review, cybersecurity review, fault
  injection, environmental testing, and independent verification.
- Establish change control for rules, thresholds, sensor firmware, and model
  versions.
- Obtain appropriate medical, aerospace, regulatory, and mission approvals
  before any operational use.

## Prototype success criteria

The next iterations should be considered successful when they can demonstrate:

- The dashboard can run from a cached app shell with no internet.
- The deterministic rule engine continues when the local model is stopped.
- Every displayed value clearly identifies its source, units, timestamp, and
  quality state.
- Stale or missing telemetry is reported as stale or missing, never silently
  treated as current.
- An LLM response cannot change alert state, and its claims can be checked
  against the supplied snapshot.
- A local voice path can transcribe and speak without sending audio to a cloud
  provider.
- A sensor or network disconnect creates an explicit degraded-state indication
  and follows a tested recovery policy.

Passing these prototype checks would demonstrate software behavior, not
flightworthiness or medical validation.

## Explicit non-goals and cautions

- The current demo is **not** a medical device, flight-certified system,
  radiation warning instrument, autonomous treatment system, or replacement
  for mission control.
- The current app does **not** acquire sensor or radio data, detect real solar
  storms, guarantee LAN connectivity, or store a durable clinical/mission
  record.
- The current rules and thresholds are demo logic. They are not approved
  operational limits.
- No local model should be described as a guarantee that a disconnected crew
  will be safe. Resilience requires validated instruments, independent
  deterministic protections, trained people, power, procedures, redundancy,
  and appropriate mission assurance.
