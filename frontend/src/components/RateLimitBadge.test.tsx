import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeRateLimits } from "../test/fixtures";
import RateLimitBadge from "./RateLimitBadge";

/**
 * `Countdown` (inside `RateLimitBadge.tsx`) calls `refreshRateLimits()` —
 * and therefore `fetchRateLimits()` from the API client — once its window
 * reaches zero. Every test below uses a `reset_at` in the past relative to
 * real time, so without this mock each one would fire a real, unmocked
 * network call on mount; mocked here so that never happens, per this
 * project's "no test reaches a real network socket" rule (CONVENTIONS.md).
 */
vi.mock("../api/client", () => ({
  fetchRateLimits: vi.fn(),
}));

import { fetchRateLimits } from "../api/client";

const mockFetchRateLimits = vi.mocked(fetchRateLimits);

beforeEach(() => {
  mockFetchRateLimits.mockReset().mockResolvedValue(makeRateLimits());
});

describe("RateLimitBadge", () => {
  it("renders one meter per scope, each with its own icon", () => {
    const limits = makeRateLimits({
      upload: { remaining: 15, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
      chat: { remaining: 18, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
    });
    const { container } = render(<RateLimitBadge limits={limits} />);

    const meters = screen.getAllByRole("meter");
    expect(meters).toHaveLength(2);
    // One <svg> (the lucide icon) per meter, in addition to the meter
    // itself — a stand-in for "each gauge shows the icon representing its
    // function," since lucide icons render as plain <svg>s with no
    // testable name of their own (they're `aria-hidden`, on purpose).
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  it("exposes the exact remaining/limit as an accessible meter, not just visually", () => {
    const limits = makeRateLimits({
      upload: { remaining: 19, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
      chat: { remaining: 7, limit: 10, reset_at: "2025-01-31T12:00:00Z" },
    });
    render(<RateLimitBadge limits={limits} />);

    const uploadMeter = screen.getByRole("meter", { name: "19 imports restants sur 20" });
    expect(uploadMeter).toHaveAttribute("aria-valuenow", "19");
    expect(uploadMeter).toHaveAttribute("aria-valuemin", "0");
    expect(uploadMeter).toHaveAttribute("aria-valuemax", "20");

    const chatMeter = screen.getByRole("meter", { name: "7 questions restantes sur 10" });
    expect(chatMeter).toHaveAttribute("aria-valuenow", "7");
    expect(chatMeter).toHaveAttribute("aria-valuemax", "10");
  });

  it("shows the tooltip on mouse hover, with the same text as the aria-label", () => {
    const limits = makeRateLimits({
      upload: { remaining: 19, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
    });
    render(<RateLimitBadge limits={limits} />);
    const meter = screen.getByRole("meter", { name: "19 imports restants sur 20" });

    expect(screen.queryByText("19 imports restants sur 20", { selector: "span" })).toBeNull();

    fireEvent.mouseEnter(meter);
    expect(screen.getByText("19 imports restants sur 20", { selector: "span" })).toBeVisible();

    fireEvent.mouseLeave(meter);
    expect(screen.queryByText("19 imports restants sur 20", { selector: "span" })).toBeNull();
  });

  it("shows the tooltip on keyboard focus too, not only mouse hover", () => {
    const limits = makeRateLimits({
      chat: { remaining: 18, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
    });
    render(<RateLimitBadge limits={limits} />);
    const meter = screen.getByRole("meter", { name: "18 questions restantes sur 20" });

    expect(screen.queryByText("18 questions restantes sur 20", { selector: "span" })).toBeNull();

    fireEvent.focus(meter);
    expect(screen.getByText("18 questions restantes sur 20", { selector: "span" })).toBeVisible();

    fireEvent.blur(meter);
    expect(screen.queryByText("18 questions restantes sur 20", { selector: "span" })).toBeNull();
  });

  it("each meter is independently focusable (tabIndex=0), not just hoverable", () => {
    const limits = makeRateLimits();
    render(<RateLimitBadge limits={limits} />);

    for (const meter of screen.getAllByRole("meter")) {
      expect(meter).toHaveAttribute("tabindex", "0");
    }
  });

  it("does not tint a scope with plenty of quota left", () => {
    const limits = makeRateLimits({
      upload: { remaining: 15, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
    });
    const { container } = render(<RateLimitBadge limits={limits} />);

    const fill = container.querySelector(".bg-accent");
    const alertFill = container.querySelector(".bg-alert");
    expect(fill).not.toBeNull();
    expect(alertFill).toBeNull();
  });

  it("tints a scope at the low-quota threshold (≤ 3) with the alert color", () => {
    const limits = makeRateLimits({
      upload: { remaining: 3, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
    });
    render(<RateLimitBadge limits={limits} />);

    const uploadMeter = screen.getByRole("meter", { name: "3 imports restants sur 20" });
    expect(uploadMeter.querySelector(".bg-alert")).not.toBeNull();
    expect(uploadMeter.querySelector(".bg-accent")).toBeNull();
  });

  it("tints a scope at exactly zero remaining", () => {
    const limits = makeRateLimits({
      chat: { remaining: 0, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
    });
    render(<RateLimitBadge limits={limits} />);

    const chatMeter = screen.getByRole("meter", { name: "0 questions restantes sur 20" });
    const fill = chatMeter.querySelector<HTMLElement>(".bg-alert");
    expect(fill).not.toBeNull();
    expect(fill?.style.width).toBe("0%");
  });

  it("tints each scope independently — one low, one healthy", () => {
    const limits = makeRateLimits({
      upload: { remaining: 2, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
      chat: { remaining: 18, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
    });
    render(<RateLimitBadge limits={limits} />);

    const uploadMeter = screen.getByRole("meter", { name: "2 imports restants sur 20" });
    const chatMeter = screen.getByRole("meter", { name: "18 questions restantes sur 20" });
    expect(uploadMeter.querySelector(".bg-alert")).not.toBeNull();
    expect(chatMeter.querySelector(".bg-accent")).not.toBeNull();
    expect(chatMeter.querySelector(".bg-alert")).toBeNull();
  });

  it("clears the alert tint cleanly once the value recovers back above the threshold", () => {
    const low = makeRateLimits({
      upload: { remaining: 3, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
    });
    const { rerender, container } = render(<RateLimitBadge limits={low} />);
    expect(container.querySelector(".bg-alert")).not.toBeNull();

    const recovered = makeRateLimits({
      upload: { remaining: 4, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
    });
    rerender(<RateLimitBadge limits={recovered} />);

    expect(container.querySelector(".bg-alert")).toBeNull();
    expect(container.querySelector(".bg-accent")).not.toBeNull();
  });
});

describe("RateLimitBadge — countdown to the next reset", () => {
  const NOW = new Date("2025-06-15T12:00:00Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function isoAfter(ms: number): string {
    return new Date(NOW.getTime() + ms).toISOString();
  }

  it("shows the initial countdown for whichever scope resets soonest", () => {
    const limits = makeRateLimits({
      upload: { remaining: 5, limit: 20, reset_at: isoAfter(2 * 60 * 60 * 1000) }, // 2h
      chat: { remaining: 5, limit: 20, reset_at: isoAfter(3.5 * 60 * 60 * 1000) }, // 3h30
    });
    render(<RateLimitBadge limits={limits} />);

    expect(screen.getByText("2h 0min")).toBeInTheDocument();
  });

  it("picks the soonest reset regardless of which scope (upload or chat) it belongs to", () => {
    const limits = makeRateLimits({
      upload: { remaining: 5, limit: 20, reset_at: isoAfter(3.5 * 60 * 60 * 1000) },
      chat: { remaining: 5, limit: 20, reset_at: isoAfter(45 * 60 * 1000) }, // 45min
    });
    render(<RateLimitBadge limits={limits} />);

    expect(screen.getByText("45min")).toBeInTheDocument();
    expect(screen.getByText("45min")).toHaveAccessibleName(
      "Réinitialisation du quota de questions dans 45min"
    );
  });

  it("updates live as time passes, without a re-render from the parent", () => {
    const limits = makeRateLimits({
      upload: { remaining: 5, limit: 20, reset_at: isoAfter(60 * 60 * 1000) }, // 1h
      chat: { remaining: 5, limit: 20, reset_at: isoAfter(5 * 60 * 60 * 1000) },
    });
    render(<RateLimitBadge limits={limits} />);
    expect(screen.getByText("1h 0min")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(20 * 60 * 1000); // 20 minutes later
    });

    expect(screen.queryByText("1h 0min")).not.toBeInTheDocument();
    expect(screen.getByText("40min")).toBeInTheDocument();
  });

  it("shows under a minute as '< 1 min' rather than '0min'", () => {
    const limits = makeRateLimits({
      upload: { remaining: 5, limit: 20, reset_at: isoAfter(30 * 1000) },
      chat: { remaining: 5, limit: 20, reset_at: isoAfter(5 * 60 * 60 * 1000) },
    });
    render(<RateLimitBadge limits={limits} />);

    expect(screen.getByText("< 1 min")).toBeInTheDocument();
  });

  it("disappears and triggers exactly one refetch once the countdown reaches zero", async () => {
    const limits = makeRateLimits({
      upload: { remaining: 0, limit: 20, reset_at: isoAfter(3 * 1000) },
      chat: { remaining: 5, limit: 20, reset_at: isoAfter(5 * 60 * 60 * 1000) },
    });
    render(<RateLimitBadge limits={limits} />);
    expect(screen.getByText("< 1 min")).toBeInTheDocument();
    expect(mockFetchRateLimits).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(4000);
      await Promise.resolve();
    });

    expect(screen.queryByText("< 1 min")).not.toBeInTheDocument();
    expect(mockFetchRateLimits).toHaveBeenCalledTimes(1);

    // Further ticks past zero don't fire it again (no aggressive polling).
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    expect(mockFetchRateLimits).toHaveBeenCalledTimes(1);
  });

  it("does not render a countdown at all once both scopes' reset_at are in the past", () => {
    const limits = makeRateLimits({
      upload: { remaining: 20, limit: 20, reset_at: isoAfter(-1000) },
      chat: { remaining: 20, limit: 20, reset_at: isoAfter(-1000) },
    });
    render(<RateLimitBadge limits={limits} />);

    expect(screen.queryByText(/min|h /)).not.toBeInTheDocument();
  });
});
