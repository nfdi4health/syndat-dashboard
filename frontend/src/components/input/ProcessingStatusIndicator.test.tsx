import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import React from "react";
import { vi, test, expect, beforeEach } from "vitest";
import type { MockedFunction } from "vitest";
import ProcessingStatusIndicator from "./ProcessingStatusIndicator";

vi.mock("axios", () => ({
  __esModule: true,
  default: { patch: vi.fn() },
}));

const mockedPatch = axios.patch as MockedFunction<typeof axios.patch>;

beforeEach(() => {
  mockedPatch.mockReset();
});

test("shows a success card when the backend confirms the computation", async () => {
  mockedPatch.mockResolvedValue({ status: 201, data: { message: "done" } });

  render(<ProcessingStatusIndicator resource="results/auc" />);

  expect(
    await screen.findByText(/computation successful/i),
  ).toBeInTheDocument();
});

test("shows an error card when the backend rejects with a detail message", async () => {
  mockedPatch.mockRejectedValue({
    response: { status: 500, data: { detail: "boom" } },
  });

  render(<ProcessingStatusIndicator resource="results/auc" />);

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(/failed/i);
  expect(alert).toHaveTextContent(/boom/i);
});

test("shows a readable error instead of spinning when the backend returns plain text", async () => {
  mockedPatch.mockRejectedValue({
    response: { status: 500, data: "Internal Server Error" },
  });

  render(<ProcessingStatusIndicator resource="results/auc" />);

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(/failed/i);
  expect(alert).not.toHaveTextContent(/undefined/i);
  expect(screen.queryByText(/computing/i)).not.toBeInTheDocument();
});

test("shows a network error instead of spinning when there is no response", async () => {
  mockedPatch.mockRejectedValue(new Error("Network Error"));

  render(<ProcessingStatusIndicator resource="results/auc" />);

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(/failed/i);
  expect(alert).not.toHaveTextContent(/undefined/i);
  expect(screen.queryByText(/computing/i)).not.toBeInTheDocument();
});

test("shows a loading card while the request is in flight", () => {
  mockedPatch.mockReturnValue(new Promise(() => {}));

  render(<ProcessingStatusIndicator resource="results/auc" />);

  expect(screen.getByRole("alert")).toHaveTextContent(/computing/i);
});

test("never leaks a raw stack trace or exception details", async () => {
  mockedPatch.mockRejectedValue({
    response: { status: 500, data: { detail: "Traceback: secret internals" } },
  });

  render(<ProcessingStatusIndicator resource="results/auc" />);

  const alert = await screen.findByRole("alert");
  expect(alert).not.toHaveTextContent(/traceback/i);
  expect(alert).not.toHaveTextContent(/secret internals/i);
});

test("renders a human readable label derived from the resource", async () => {
  mockedPatch.mockResolvedValue({ status: 201, data: {} });

  render(<ProcessingStatusIndicator resource="results/risk_singling_out" />);

  await waitFor(() => expect(mockedPatch).toHaveBeenCalled());
  expect(
    await screen.findByText(/risk singling out/i),
  ).toBeInTheDocument();
});
