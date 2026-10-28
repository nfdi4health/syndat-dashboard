import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import React from "react";
import { vi, test, expect, beforeEach } from "vitest";
import type { MockedFunction } from "vitest";
import OutlierPlot from "./OutlierPlot";

vi.mock("react-plotly.js", () => ({
  __esModule: true,
  default: () => <div data-testid="plot" />,
}));

vi.mock("axios", () => ({
  __esModule: true,
  default: { get: vi.fn() },
}));

const mockedAxiosGet = axios.get as MockedFunction<typeof axios.get>;

beforeEach(() => {
  mockedAxiosGet.mockReset();
});

const tsne = {
  trace_real: { x: [1, 2], y: [3, 4] },
  trace_virtual: { x: [5, 6], y: [7, 8] },
};

test("renders the plot as soon as the tsne data arrives", async () => {
  mockedAxiosGet.mockImplementation((url: string) => {
    if (url.endsWith("/tsne")) return Promise.resolve({ data: tsne }) as any;
    return new Promise(() => {}) as any;
  });

  render(<OutlierPlot dataset="cohort-a" />);

  expect(await screen.findByTestId("plot")).toBeInTheDocument();
});

test("still renders the plot when the outlier score request fails", async () => {
  mockedAxiosGet.mockImplementation((url: string) => {
    if (url.endsWith("/tsne")) return Promise.resolve({ data: tsne }) as any;
    return Promise.reject(new Error("boom")) as any;
  });

  render(<OutlierPlot dataset="cohort-a" />);

  expect(await screen.findByTestId("plot")).toBeInTheDocument();
  expect(screen.queryByText(/failed to load outlier plot data/i)).not.toBeInTheDocument();
});

test("shows an error when the tsne request fails", async () => {
  mockedAxiosGet.mockImplementation((url: string) => {
    if (url.endsWith("/tsne")) return Promise.reject(new Error("boom")) as any;
    return Promise.resolve({ data: { Outlier_Scores: [] } }) as any;
  });

  render(<OutlierPlot dataset="cohort-a" />);

  expect(
    await screen.findByText(/failed to load outlier plot data/i),
  ).toBeInTheDocument();
  expect(screen.queryByTestId("plot")).not.toBeInTheDocument();
});
