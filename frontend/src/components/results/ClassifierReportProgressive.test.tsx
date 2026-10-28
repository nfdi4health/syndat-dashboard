import { render, screen, waitFor, within } from "@testing-library/react";
import axios from "axios";
import React from "react";
import { vi, test, expect, beforeEach } from "vitest";
import type { MockedFunction } from "vitest";
import ClassifierReport from "./ClassifierReport";

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

test("renders the discrimination score as soon as it arrives", async () => {
  mockedAxiosGet.mockImplementation((url: string) => {
    if (url.endsWith("/auc"))
      return Promise.resolve({
        data: { auc_score: 0.5, real_rows: null, total_real_rows: null },
      }) as any;
    return never() as any;
  });

  render(<ClassifierReport dataset="cohort-a" />);

  await waitFor(() =>
    expect(metricByHeading(/discrimination complexity/i).getByText(/%/)).toBeInTheDocument(),
  );
  expect(
    metricByHeading(/distribution similarity/i).getByLabelText(/loading score/i),
  ).toBeInTheDocument();
});

test("renders each score independently rather than waiting for all three", async () => {
  mockedAxiosGet.mockImplementation((url: string) => {
    if (url.endsWith("/jsd"))
      return Promise.resolve({ data: { jsd_score: 0.0 } }) as any;
    return never() as any;
  });

  render(<ClassifierReport dataset="cohort-a" />);

  await waitFor(() =>
    expect(
      metricByHeading(/distribution similarity/i).getByText(/%/),
    ).toBeInTheDocument(),
  );
  expect(
    metricByHeading(/discrimination complexity/i).getByLabelText(/loading score/i),
  ).toBeInTheDocument();
});

test("still shows an error when every request fails", async () => {
  mockedAxiosGet.mockRejectedValue(new Error("network error"));

  render(<ClassifierReport dataset="cohort-a" />);

  expect(
    await screen.findByText(/failed to load quality scores/i),
  ).toBeInTheDocument();
});

test("does not show an error while only some requests have failed", async () => {
  mockedAxiosGet.mockImplementation((url: string) => {
    if (url.endsWith("/auc"))
      return Promise.resolve({
        data: { auc_score: 0.5, real_rows: null, total_real_rows: null },
      }) as any;
    return Promise.reject(new Error("boom")) as any;
  });

  render(<ClassifierReport dataset="cohort-a" />);

  await waitFor(() =>
    expect(metricByHeading(/discrimination complexity/i).getByText(/%/)).toBeInTheDocument(),
  );
  expect(
    screen.queryByText(/failed to load quality scores/i),
  ).not.toBeInTheDocument();
});

test("resets to loading spinners when the dataset changes", async () => {
  mockedAxiosGet.mockImplementation((url: string) =>
    Promise.resolve({ data: { auc_score: 0.5, jsd_score: 0.1, norm: 0.1, real_rows: null, total_real_rows: null } }) as any,
  );

  const { rerender } = render(<ClassifierReport dataset="cohort-a" />);
  await waitFor(() =>
    expect(metricByHeading(/discrimination complexity/i).getByText(/%/)).toBeInTheDocument(),
  );

  mockedAxiosGet.mockImplementation(() => never() as any);
  rerender(<ClassifierReport dataset="cohort-b" />);

  await waitFor(() =>
    expect(
      metricByHeading(/discrimination complexity/i).getByLabelText(/loading score/i),
    ).toBeInTheDocument(),
  );
});
