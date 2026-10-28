import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { vi, test, expect } from "vitest";
import Header from "./Header";

vi.mock("../header/VersionDisplay", () => ({
  __esModule: true,
  default: () => null,
}));

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={["/input"]}>
      <Header />
      <Routes>
        <Route path="/input" element={<div>input page</div>} />
        <Route path="/results" element={<div>results page</div>} />
        <Route path="/" element={<div>home page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

test("navigates to the results page without a full page reload", async () => {
  renderWithRouter();

  expect(screen.getByText("input page")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("link", { name: /results/i }));

  expect(await screen.findByText("results page")).toBeInTheDocument();
  expect(screen.queryByText("input page")).not.toBeInTheDocument();
});

test("navigates back to the input page from results", async () => {
  renderWithRouter();

  await userEvent.click(screen.getByRole("link", { name: /results/i }));
  await screen.findByText("results page");

  await userEvent.click(screen.getByRole("link", { name: /^input$/i }));

  expect(await screen.findByText("input page")).toBeInTheDocument();
});

test("brand link navigates home", async () => {
  renderWithRouter();

  await userEvent.click(screen.getByRole("link", { name: /syndat dashboard/i }));

  expect(await screen.findByText("home page")).toBeInTheDocument();
});

test("keeps the external helpdesk link as a normal link", () => {
  renderWithRouter();

  const helpdesk = screen.getByRole("link", { name: /helpdesk/i });
  expect(helpdesk).toHaveAttribute(
    "href",
    "https://www.nfdi4health.de/en/helpdesk.html",
  );
});
