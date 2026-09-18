import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HelpPage from "./HelpPage";

describe("HelpPage", () => {
  it("renders the page title and the FAQ content", () => {
    render(<HelpPage />);

    expect(screen.getByRole("heading", { name: "Aide", level: 1 })).toBeInTheDocument();
    expect(
      screen.getByText("Quels formats de bulletins de paie sont acceptés ?")
    ).toBeInTheDocument();
  });
});
