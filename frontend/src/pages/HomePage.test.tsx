import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import HomePage from "./HomePage";

const GITHUB_URL = "https://github.com/nfdi4health/syndat-dashboard";
const SYNDAT_PACKAGE_URL = "https://github.com/SCAI-BIO/syndat";

test("discloses that the running instance is a demo", () => {
  render(<HomePage />);

  const notice = screen.getByRole("heading", { name: "Demo instance" }).closest("section");
  expect(notice).not.toBeNull();
  expect(notice).toHaveTextContent(/public demo/i);
  expect(notice).toHaveTextContent(/exploration and testing/i);
  expect(notice).toHaveTextContent(/never stores real data/i);
  expect(notice).toHaveTextContent(
    /refrain from uploading any non-public or sensitive data to this demo instance/i,
  );
});

test("describes on-site evaluation at data holding organisations", () => {
  render(<HomePage />);

  const notice = screen.getByRole("heading", { name: "Demo instance" }).closest("section");
  expect(notice).toHaveTextContent(/run on-site at data holding organisations/i);
});

test("describes the dashboard as a user-friendly evaluation platform", () => {
  render(<HomePage />);

  const about = screen.getByRole("heading", { name: "About" }).closest("section");
  expect(about).not.toBeNull();
  expect(about).toHaveTextContent(/user-friendly platform for evaluating synthetic data/i);
  expect(about).toHaveTextContent(
    /does not require extensive background knowledge or a data science background/i,
  );
});

test("links to the GitHub repository and the syndat package", () => {
  render(<HomePage />);

  expect(screen.getByRole("link", { name: "Syndat-Dashboard GitHub repository" })).toHaveAttribute(
    "href",
    GITHUB_URL,
  );
  expect(screen.getByRole("link", { name: "syndat Python package" })).toHaveAttribute(
    "href",
    SYNDAT_PACKAGE_URL,
  );
  expect(screen.queryByRole("heading", { name: "Deploy SYNDAT" })).not.toBeInTheDocument();
});
