import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import React from "react";
import { vi, test, expect, beforeEach } from "vitest";
import type { MockedFunction } from "vitest";
import ProcessingPanel from "./ProcessingPanel";

vi.mock("axios", () => ({
  __esModule: true,
  default: { get: vi.fn(), patch: vi.fn() },
}));

const mockedGet = axios.get as MockedFunction<typeof axios.get>;
const mockedPatch = axios.patch as MockedFunction<typeof axios.patch>;

const report = (overrides: Record<string, unknown> = {}) => ({
  valid: true,
  errors: [],
  warnings: [],
  details: {
    real_rows: 2,
    synthetic_rows: 2,
    processing_rows: 2,
    max_processing_rows: 1000,
    shared_columns: 2,
    ignored_columns: { real: [], synthetic: [] },
  },
  ...overrides,
});

beforeEach(() => {
  mockedGet.mockReset();
  mockedPatch.mockReset();
  mockedPatch.mockResolvedValue({ status: 201, data: { message: "done" } });
});

const trigger = async () => {
  await userEvent.click(screen.getByRole("button", { name: /trigger result processing/i }));
};

test("starts processing directly when the data is valid", async () => {
  mockedGet.mockResolvedValue({ status: 200, data: report() });

  render(<ProcessingPanel />);
  await trigger();

  await waitFor(() =>
    expect(mockedPatch).toHaveBeenCalledWith(
      expect.stringContaining("/datasets/default/results/auc"),
    ),
  );
  expect(mockedGet).toHaveBeenCalledWith(
    expect.stringContaining("/datasets/default/patients/validation"),
  );
});

test("blocks processing and lists every error when the data is invalid", async () => {
  mockedGet.mockResolvedValue({
    status: 200,
    data: report({
      valid: false,
      errors: ["Row 3 has 2 fields but the header declares 3 columns."],
    }),
  });

  render(<ProcessingPanel />);
  await trigger();

  expect(
    await screen.findByText(/row 3 has 2 fields/i),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /^process/i }),
  ).not.toBeInTheDocument();
  expect(mockedPatch).not.toHaveBeenCalled();
});

test("starts processing and keeps warnings visible as caveats", async () => {
  mockedGet.mockResolvedValue({
    status: 200,
    data: report({
      warnings: ["Only a random sample of 1,000 rows is used for processing."],
    }),
  });

  render(<ProcessingPanel />);
  await trigger();

  expect(
    await screen.findByText(/random sample of 1,000 rows/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/processed with these caveats/i),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /process anyway/i }),
  ).not.toBeInTheDocument();
  await waitFor(() => expect(mockedPatch).toHaveBeenCalled());
});

test("shows a readable message when validation cannot be reached", async () => {
  mockedGet.mockRejectedValue(new Error("Network Error"));

  render(<ProcessingPanel />);
  await trigger();

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(/could not validate/i);
  expect(alert).toHaveTextContent(/could not reach the server/i);
  expect(mockedPatch).not.toHaveBeenCalled();
});

test("never leaks internals from the validation endpoint", async () => {
  mockedGet.mockRejectedValue({
    response: {
      status: 500,
      data: { detail: "Traceback: /srv/app/patients/real.csv exploded" },
    },
  });

  render(<ProcessingPanel />);
  await trigger();

  const alert = await screen.findByRole("alert");
  expect(alert).not.toHaveTextContent(/traceback/i);
  expect(alert).not.toHaveTextContent(/real\.csv/i);
});

test("shows the row and column summary before processing", async () => {
  mockedGet.mockResolvedValue({
    status: 200,
    data: report({
      warnings: ["Real and synthetic data share only 1 of 3 columns."],
      details: {
        real_rows: 2,
        synthetic_rows: 2,
        processing_rows: 2,
        max_processing_rows: 1000,
        shared_columns: 1,
        ignored_columns: { real: ["sex"], synthetic: ["sex"] },
      },
    }),
  });

  render(<ProcessingPanel />);
  await trigger();

  expect(await screen.findByText(/1 shared column/i)).toBeInTheDocument();
  expect(screen.getByText(/computing on 2 row/i)).toBeInTheDocument();
});
