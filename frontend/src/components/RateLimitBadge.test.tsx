import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeRateLimits } from "../test/fixtures";
import RateLimitBadge from "./RateLimitBadge";

describe("RateLimitBadge", () => {
  it("shows both scopes as remaining/limit with their label", () => {
    const limits = makeRateLimits({
      upload: { remaining: 15, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
      chat: { remaining: 18, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
    });
    render(<RateLimitBadge limits={limits} />);

    expect(screen.getByText("15/20", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/imports/)).toBeInTheDocument();
    expect(screen.getByText("18/20", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/questions/)).toBeInTheDocument();
  });

  it("does not flag a scope with plenty of quota left", () => {
    const limits = makeRateLimits({
      upload: { remaining: 15, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
    });
    render(<RateLimitBadge limits={limits} />);

    const uploadText = screen.getByText(/imports/);
    expect(uploadText.className).not.toContain("text-alert");
  });

  it("flags a scope at or below the low-quota threshold (≤ 3) with the alert color", () => {
    const limits = makeRateLimits({
      upload: { remaining: 3, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
    });
    render(<RateLimitBadge limits={limits} />);

    const uploadText = screen.getByText(/imports/);
    expect(uploadText.className).toContain("text-alert");
  });

  it("flags a scope at zero remaining, without becoming alarmist (no icon, no extra markup)", () => {
    const limits = makeRateLimits({
      chat: { remaining: 0, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
    });
    render(<RateLimitBadge limits={limits} />);

    const chatText = screen.getByText(/questions/);
    expect(chatText.className).toContain("text-alert");
    expect(chatText.textContent).toBe("0/20 questions");
  });

  it("flags each scope independently", () => {
    const limits = makeRateLimits({
      upload: { remaining: 2, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
      chat: { remaining: 18, limit: 20, reset_at: "2025-01-31T12:00:00Z" },
    });
    render(<RateLimitBadge limits={limits} />);

    expect(screen.getByText(/imports/).className).toContain("text-alert");
    expect(screen.getByText(/questions/).className).not.toContain("text-alert");
  });
});
