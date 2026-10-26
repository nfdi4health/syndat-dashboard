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

const warningIcon = /about this low score/i;
const disclaimer = /can be low even when the synthetic data is still faithful/i;

function mockScores(scores: { auc: any; jsd?: any; norm?: any }) {
  mockedAxiosGet.mockImplementation(async (url: string) => {
    if (url.endsWith("/auc")) return { data: { auc_score: scores.auc } };
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
