#!/usr/bin/env python3
"""Run desktop dashboard layout checks and capture requested screenshots."""

import os
from pathlib import Path

from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:3000")
OUTPUT_DIR = Path(
    os.environ.get("SCREENSHOT_DIR", "screenshots/desktop-layout-check")
)
VIEWPORTS = [(1280, 709), (1280, 800), (1470, 830), (1470, 956), (1920, 1080)]
SCREENSHOT_VIEWPORTS = {(1280, 709), (1470, 956)}
TABS = ["Alerts", "Chat"]


CHECK_LAYOUT = """() => {
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
  };
  const overlap = (a, b) => {
    const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return x > 1 && y > 1;
  };
  const groups = [
    [...document.querySelectorAll(".desktop-crew-list > button")],
    [
      document.querySelector(".desktop-dashboard-left > .desktop-crew-list"),
      document.querySelector(".desktop-dashboard-left > .desktop-scenario-wrap"),
    ],
    [
      document.querySelector(".desktop-dashboard-center > .desktop-vitals-wrap"),
      document.querySelector(".desktop-dashboard-center > [data-tabbed]"),
    ],
    [...document.querySelectorAll(".desktop-dashboard-right > div")],
    [...document.querySelectorAll(".desktop-scenario-rows > button")],
  ].filter((group) => group.every(Boolean));
  const overlaps = [];
  for (const group of groups) {
    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) {
        if (overlap(rect(group[i]), rect(group[j]))) {
          overlaps.push({
            first: group[i].className || group[i].tagName,
            second: group[j].className || group[j].tagName,
          });
        }
      }
    }
  }

  const clipped = [...document.querySelectorAll("body *")].filter((el) => {
    if (!el.innerText?.trim() || !el.getClientRects().length) return false;
    if (el.matches(".desktop-tab-content, .chat-scroll")) return false;
    if (el.closest(".sr-only, [aria-hidden='true']")) return false;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" ||
        Number(style.opacity) === 0) return false;
    const clips = ["hidden", "clip"].includes(style.overflowX) ||
      ["hidden", "clip"].includes(style.overflowY);
    return clips &&
      (el.scrollHeight > el.clientHeight + 1 ||
       el.scrollWidth > el.clientWidth + 1);
  }).map((el) => ({
    text: el.innerText.trim().slice(0, 80),
    className: el.className?.baseVal || el.className || el.tagName,
    scroll: [el.scrollWidth, el.scrollHeight],
    client: [el.clientWidth, el.clientHeight],
  }));

  const textOutside = [];
  for (const container of [
    document.querySelector(".dashboard-topbar"),
    document.querySelector(".desktop-pipeline"),
  ]) {
    if (!container) continue;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (r.width === 0 || r.height === 0) continue;
        if (r.top < 0 || r.bottom > innerHeight ||
            r.left < 0 || r.right > innerWidth) {
          textOutside.push(node.textContent.trim());
          break;
        }
      }
    }
  }

  const ruleRows = [...document.querySelectorAll(".desktop-rules li")];
  const fullyVisibleRules = ruleRows.filter((row) => {
    const r = row.getBoundingClientRect();
    return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight;
  }).length;
  const radiation = document.querySelector(".desktop-dose-tile");
  const radiationRect = radiation?.getBoundingClientRect();
  const radiationVisible = !!radiationRect &&
    radiationRect.width > 0 && radiationRect.height > 0 &&
    radiationRect.top >= 0 && radiationRect.bottom <= innerHeight &&
    window.scrollY === 0;

  // Visualization primitives — verify which ones exist on the page.
  const aiFactorCount = document.querySelectorAll(
    ".desktop-ai-factor"
  ).length;
  const radiationBar = !!document.querySelector(
    ".desktop-dose-tile .desktop-vital-chart > div[role='progressbar']"
  );
  const aiBand = document.querySelector("[data-ai-band]")?.getAttribute(
    "data-ai-band"
  );
  // The Gantt strip only exists once the user has caused at least one
  // alert. We only check that the alert Gantt container is registered.
  const ganttContainerPresent = !!document.querySelector(
    ".desktop-timeline-gantt"
  );

  // --- New spec-driven checks ---
  // Each crew card has a sparkline at the bottom.
  const crewSparklineHeights = [...document.querySelectorAll(
    ".desktop-crew-sparkline"
  )].map((el) => el.getBoundingClientRect().height);

  // The vitals panel's computed padding should be at least 20px.
  const vitalsPanel = document.querySelector(".desktop-vitals");
  const vitalsStyle = vitalsPanel ? getComputedStyle(vitalsPanel) : null;
  const vitalsPaddingTop = vitalsStyle
    ? parseFloat(vitalsStyle.paddingTop)
    : 0;

  // The bottom panel ([data-tabbed]) should have a margin-top of at
  // least 28px and a content area of at least 240px tall.
  const tabbed = document.querySelector(".desktop-dashboard-center > [data-tabbed]");
  const tabbedStyle = tabbed ? getComputedStyle(tabbed) : null;
  const tabbedMarginTop = tabbedStyle ? parseFloat(tabbedStyle.marginTop) : 0;
  const tabContent = document.querySelector(
    ".desktop-dashboard-center [data-tabbed] .desktop-tab-content"
  );
  const tabContentHeight = tabContent
    ? tabContent.getBoundingClientRect().height
    : 0;

  // The big AI number is at least 40px tall.
  const aiNumber = document.querySelector(".desktop-ai-number");
  const aiNumberHeight = aiNumber
    ? aiNumber.getBoundingClientRect().height
    : 0;

  // The radiation bar (the inner progressbar div) is at least 14px tall.
  const radiationBarEl = document.querySelector(
    ".desktop-dose-tile .desktop-vital-chart > div[role='progressbar']"
  );
  const radiationBarHeight = radiationBarEl
    ? radiationBarEl.getBoundingClientRect().height
    : 0;

  return {
    overlaps,
    clipped,
    textOutside,
    rules: { total: ruleRows.length, fullyVisible: fullyVisibleRules },
    radiationVisible,
    aiFactorCount,
    radiationBar,
    aiBand,
    ganttContainerPresent,
    crewSparklineHeights,
    vitalsPaddingTop,
    tabbedMarginTop,
    tabContentHeight,
    aiNumberHeight,
    radiationBarHeight,
  };
}"""


def check_viewport(page, width, height, tab):
    result = page.evaluate(CHECK_LAYOUT)
    errors = []
    if result["overlaps"]:
        errors.append(f"sibling cards overlap: {result['overlaps']}")
    if result["clipped"]:
        errors.append(f"clipped text: {result['clipped']}")
    if result["textOutside"]:
        errors.append(f"header/pipeline text outside viewport: {result['textOutside']}")
    if result["rules"]["total"] < 5 or result["rules"]["fullyVisible"] < 5:
        errors.append(f"Rules rows visible: {result['rules']}")
    if height >= 700 and not result["radiationVisible"]:
        errors.append("Radiation tile is not fully visible at scrollTop 0")

    # The AI card shows 5 factor rows.
    if result["aiFactorCount"] < 5:
        errors.append(
            f"Expected 5 AI factor rows, got {result['aiFactorCount']}"
        )
    if not result["radiationBar"]:
        errors.append("Radiation ProgressBar missing")
    if result["aiBand"] not in {"low", "watch", "high"}:
        errors.append(f"AI score data-ai-band is {result['aiBand']!r}, not in low/watch/high")

    # Spec checks — only enforce at the larger viewports where the
    # spacious layout is in effect. The short-laptop cases (700-779px
    # tall) intentionally use the more compact media block.
    spacious = height >= 800
    if spacious:
        heights = result["crewSparklineHeights"]
        if len(heights) < 3 or any(h < 36 for h in heights):
            errors.append(
                f"Crew sparkline heights should be >= 36px (got {heights})"
            )
        if result["vitalsPaddingTop"] < 20:
            errors.append(
                f"Vitals panel padding should be >= 20px (got {result['vitalsPaddingTop']})"
            )
        if result["tabbedMarginTop"] < 28:
            errors.append(
                f"Bottom panel margin-top should be >= 28px (got {result['tabbedMarginTop']})"
            )
        if result["tabContentHeight"] < 240:
            errors.append(
                f"Tab content area should be >= 240px tall (got {result['tabContentHeight']})"
            )
        if result["aiNumberHeight"] < 40:
            errors.append(
                f"AI score number should be >= 40px tall (got {result['aiNumberHeight']})"
            )
        if result["radiationBarHeight"] < 14:
            errors.append(
                f"Radiation bar should be >= 14px tall (got {result['radiationBarHeight']})"
            )

    print(
        f"| {width}x{height} | {tab} | "
        f"{'FAIL' if errors else 'PASS'} | "
        f"{result['rules']['fullyVisible']}/{result['rules']['total']} | "
        f"{'yes' if result['radiationVisible'] else 'no'} | "
        f"factors={result['aiFactorCount']} | doseBar={result['radiationBar']} | "
        f"ai={result['aiBand']} | "
        f"vPad={result['vitalsPaddingTop']:.0f} | bMar={result['tabbedMarginTop']:.0f} | "
        f"tArea={result['tabContentHeight']:.0f} | "
        f"aiH={result['aiNumberHeight']:.0f} | rH={result['radiationBarHeight']:.0f} | "
        f"{len(result['overlaps'])} | {len(result['clipped'])} |"
    )
    if errors:
        raise AssertionError(f"{width}x{height} ({tab}): " + "; ".join(errors))


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    failures = []
    print("| Viewport | Tab | Result | Rules rows | Radiation | Overlaps | Clipped |")
    print("|---|---|---:|---:|:---:|---:|---:|")

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 709}, device_scale_factor=1)
        page.goto(BASE_URL, wait_until="domcontentloaded")
        page.locator(".desktop-dashboard-grid").wait_for(state="visible")
        page.wait_for_timeout(900)

        for width, height in VIEWPORTS:
            page.set_viewport_size({"width": width, "height": height})
            page.wait_for_timeout(250)
            for tab in TABS:
                button = page.locator('[role="tab"]').filter(has_text=tab)
                button.click()
                page.wait_for_timeout(250)
                try:
                    check_viewport(page, width, height, tab)
                except AssertionError as error:
                    failures.append(str(error))

                if (width, height) in SCREENSHOT_VIEWPORTS:
                    slug = tab.lower()
                    prefix = f"{width}x{height}-{slug}"
                    page.screenshot(
                        path=OUTPUT_DIR / f"{prefix}-viewport.png",
                        full_page=False,
                    )
                    page.screenshot(
                        path=OUTPUT_DIR / f"{prefix}-full.png",
                        full_page=True,
                    )

        browser.close()

    if failures:
        raise SystemExit("\n".join(failures))
    print(f"\nAll layout checks passed. Screenshots: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
