import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import React from "react";
import { vi, test, expect, beforeEach, afterEach } from "vitest";
import type { MockedFunction } from "vitest";
import ClassifierReport from "./ClassifierReport";

vi.mock("axios", () => ({
  __esModule: true,
  default: { get: vi.fn() },
}));

const mockedAxiosGet = axios.get as MockedFunction<typeof axios.get>;

const warningIcon = /about this score/i;
const disclaimer = /can be low even when the synthetic data is still faithful/i;
const missingDataNote = /incomplete records had to be dropped/i;

function mockScores(scores: {
  auc: any;
  jsd?: any;
  norm?: any;
  realRows?: any;
  totalRealRows?: any;
}) {
  mockedAxiosGet.mockImplementation(async (url: string) => {
    if (url.endsWith("/auc"))
      return {
        data: {
          auc_score: scores.auc,
          real_rows: scores.realRows ?? null,
          total_real_rows: scores.totalRealRows ?? null,
        },
      };
    if (url.endsWith("/jsd")) return { data: { jsd_score: scores.jsd ?? 0.1 } };
    if (url.endsWith("/norm")) return { data: { norm: scores.norm ?? 0.1 } };
    return { data: 0 };
  });
}

beforeEach(() => {
  mockedAxiosGet.mockReset();
});

afterEach(() => {
  mockedAxiosGet.mockReset();
});

test("shows a warning icon that reveals the disclaimer when the AUC score is low", async () => {
  mockScores({ auc: 1.0 });

  render(<ClassifierReport dataset="cohort-a" />);

  const icon = await screen.findByLabelText(warningIcon);
  expect(screen.queryByText(disclaimer)).not.toBeInTheDocument();

  await userEvent.click(icon);
  expect(await screen.findByText(disclaimer)).toBeInTheDocument();
});

test("hides the warning icon when the AUC score is not low", async () => {
  mockScores({ auc: 0.5 });

  render(<ClassifierReport dataset="cohort-a" />);

  await waitFor(() => expect(mockedAxiosGet).toHaveBeenCalled());
  expect(screen.queryByLabelText(warningIcon)).not.toBeInTheDocument();
  expect(screen.queryByText(disclaimer)).not.toBeInTheDocument();
});

test("hides the warning icon and shows N/A when the AUC value is null", async () => {
  mockScores({ auc: null });

  render(<ClassifierReport dataset="cohort-a" />);

  expect(await screen.findByText("N/A")).toBeInTheDocument();
  expect(screen.queryByLabelText(warningIcon)).not.toBeInTheDocument();
});

test("shows an error and no warning icon when every request fails", async () => {
  mockedAxiosGet.mockRejectedValue(new Error("network error"));

  render(<ClassifierReport dataset="cohort-a" />);

  expect(
    await screen.findByText(/failed to load quality scores/i),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText(warningIcon)).not.toBeInTheDocument();
});

test("warns through the popover when most real rows are missing", async () => {
  mockScores({ auc: 0.1, realRows: 3, totalRealRows: 100 });

  render(<ClassifierReport dataset="cohort-a" />);

  const icon = await screen.findByLabelText(warningIcon);
  await userEvent.click(icon);
  expect(await screen.findByText(missingDataNote)).toBeInTheDocument();
  expect(screen.getByText(missingDataNote)).toHaveTextContent("97 out of 100");
});

test("warns through the popover when a moderate share of real rows is missing", async () => {
  mockScores({ auc: 0.1, realRows: 70, totalRealRows: 100 });

  render(<ClassifierReport dataset="cohort-a" />);

  const icon = await screen.findByLabelText(warningIcon);
  await userEvent.click(icon);
  expect(await screen.findByText(missingDataNote)).toBeInTheDocument();
});

test("hides the warning icon when few rows are missing and the score is fine", async () => {
  mockScores({ auc: 0.45, realRows: 95, totalRealRows: 100 });

  render(<ClassifierReport dataset="cohort-a" />);

  await waitFor(() => expect(mockedAxiosGet).toHaveBeenCalled());
  expect(screen.queryByLabelText(warningIcon)).not.toBeInTheDocument();
});

test("hides the warning icon when row counts are absent and the score is fine", async () => {
  mockScores({ auc: 0.45 });

  render(<ClassifierReport dataset="cohort-a" />);

  await waitFor(() => expect(mockedAxiosGet).toHaveBeenCalled());
  expect(screen.queryByLabelText(warningIcon)).not.toBeInTheDocument();
});

test("shows only the missing-data note when rows are missing but the score is fine", async () => {
  mockScores({ auc: 0.45, realRows: 3, totalRealRows: 100 });

  render(<ClassifierReport dataset="cohort-a" />);

  const icon = await screen.findByLabelText(warningIcon);
  await userEvent.click(icon);
  expect(await screen.findByText(missingDataNote)).toBeInTheDocument();
  expect(screen.queryByText(disclaimer)).not.toBeInTheDocument();
});

test("shows both the missing-data note and the low-score disclaimer when both apply", async () => {
  mockScores({ auc: 0.9, realRows: 3, totalRealRows: 100 });

  render(<ClassifierReport dataset="cohort-a" />);

  const icon = await screen.findByLabelText(warningIcon);
  await userEvent.click(icon);
  expect(await screen.findByText(missingDataNote)).toBeInTheDocument();
  expect(await screen.findByText(disclaimer)).toBeInTheDocument();
  expect(screen.getByText(missingDataNote)).toHaveTextContent("97 out of 100");
});
