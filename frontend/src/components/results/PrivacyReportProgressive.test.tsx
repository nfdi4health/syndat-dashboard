import { render, screen, waitFor, within } from "@testing-library/react";
import axios from "axios";
import React from "react";
import { vi, test, expect, beforeEach } from "vitest";
import type { MockedFunction } from "vitest";
import PrivacyReport from "./PrivacyReport";

vi.mock("axios", () => ({
  __esModule: true,
  default: { get: vi.fn() },
}));

const mockedAxiosGet = axios.get as MockedFunction<typeof axios.get>;

const never = () => new Promise(() => {});

function metricByHeading(heading: RegExp) {
  const h4 = screen.getByRole("heading", { name: heading });
  const metric = h4.closest(".ResultsMetric") as HTMLElement;
  return within(metric);
}

beforeEach(() => {
  mockedAxiosGet.mockReset();
});

test("renders a privacy risk as soon as it arrives", async () => {
  mockedAxiosGet.mockImplementation((url: string) => {
    if (url.endsWith("/risk_singling_out"))
      return Promise.resolve({ data: { risk: 0.0 } }) as any;
    return never() as any;
  });

  render(<PrivacyReport dataset="cohort-a" />);

  await waitFor(() =>
    expect(metricByHeading(/singling out risk/i).getByText(/%/)).toBeInTheDocument(),
  );
  expect(
    metricByHeading(/linkability risk/i).getByLabelText(/loading score/i),
  ).toBeInTheDocument();
});

test("still shows an error when every privacy request fails", async () => {
  mockedAxiosGet.mockRejectedValue(new Error("network error"));

  render(<PrivacyReport dataset="cohort-a" />);

  expect(
    await screen.findByText(/failed to load privacy risks/i),
  ).toBeInTheDocument();
});

test("does not show an error while only some privacy requests have failed", async () => {
  mockedAxiosGet.mockImplementation((url: string) => {
    if (url.endsWith("/risk_singling_out"))
      return Promise.resolve({ data: { risk: 0.0 } }) as any;
    return Promise.reject(new Error("boom")) as any;
  });

  render(<PrivacyReport dataset="cohort-a" />);

  await waitFor(() =>
    expect(metricByHeading(/singling out risk/i).getByText(/%/)).toBeInTheDocument(),
  );
  expect(
    screen.queryByText(/failed to load privacy risks/i),
  ).not.toBeInTheDocument();
});
