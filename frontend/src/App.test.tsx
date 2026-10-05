import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import App from "./App";
import { vi, test, expect, beforeEach, afterEach } from "vitest";
import type { MockedFunction } from "vitest";

vi.mock("axios", () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
  },
}));

const mockedAxiosGet = axios.get as MockedFunction<typeof axios.get>;

// Keep route tests focused on App and the page shell rather than charting
// libraries and the individual result visualizations.
vi.mock("./components/results/ClassifierReport", () => ({
  __esModule: true,
  default: () => <div>Classifier report</div>,
}));
vi.mock("./components/results/PrivacyReport", () => ({
  __esModule: true,
  default: () => <div>Privacy report</div>,
}));
vi.mock("./components/results/OutlierPlot", () => ({
  __esModule: true,
  default: () => <div>Outlier plot</div>,
}));
vi.mock("./components/results/PlotSelector", () => ({
  __esModule: true,
  default: () => <div>Plot selector</div>,
}));
vi.mock("./components/results/CorrelelationPlot", () => ({
  __esModule: true,
  default: () => <div>Correlation plot</div>,
}));
vi.mock("./components/results/summary/DatasetsEvaluationComparisionChart", () => ({
  __esModule: true,
  default: () => <div>Dataset comparison chart</div>,
}));

beforeEach(() => {
  window.history.pushState({}, "", "/");
  mockedAxiosGet.mockImplementation(async (url: string) => {
    if (url.endsWith("/version")) {
      return { data: "1.2.3" };
    }
    if (url.endsWith("/datasets")) {
      return { data: ["default", "cohort-a"] };
    }
    if (url.endsWith("/auc")) {
      return { data: { auc_score: 0.8 } };
    }
    if (url.endsWith("/jsd")) {
      return { data: { jsd_score: 0.2 } };
    }
    if (url.endsWith("/norm")) {
      return { data: { norm: 0.7 } };
    }
    if (url.includes("/risk_")) {
      return { data: { risk: 0.1 } };
    }
    return { data: 0 };
  });
});

afterEach(() => {
  mockedAxiosGet.mockReset();
});

function renderRoute(route: string) {
  window.history.pushState({}, "", route);
  return render(<App />);
}

test("renders the home page at the root route", async () => {
  renderRoute("/");

  expect(await screen.findByRole("heading", { name: "About" })).toBeInTheDocument();
  expect(screen.getByText("How to Use")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Input" })).toHaveAttribute("href", "/input");
});

test("renders the input page at the input route", async () => {
  renderRoute("/input");

  expect(
    await screen.findByRole("heading", { name: "Data Upload & Processing" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Real Data" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Synthetic Data" })).toBeInTheDocument();
});

test("renders the results page and its default dataset state", async () => {
  renderRoute("/results");

  expect(await screen.findByText(/latest uploaded dataset/i)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /datasets summary/i })).toHaveAttribute(
    "href",
    "/results/summary",
  );
  expect(screen.getByText("Classifier report")).toBeInTheDocument();
  expect(mockedAxiosGet).toHaveBeenCalledWith(
    expect.stringContaining("/datasets"),
  );
});

test("renders the dataset summary after mocked API data is loaded", async () => {
  renderRoute("/results/summary");

  expect(await screen.findByRole("heading", { name: "Dataset Summary" })).toBeInTheDocument();
  expect(screen.getAllByText("Dataset comparison chart")).toHaveLength(2);

  await waitFor(() => {
    expect(mockedAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/datasets/cohort-a/results/auc"),
    );
  });
});

test("displays the API version returned by the mocked version endpoint", async () => {
  renderRoute("/");

  expect(await screen.findByText("App Version: 1.2.3")).toBeInTheDocument();
  expect(mockedAxiosGet).toHaveBeenCalledWith(
    expect.stringContaining("/version"),
  );
});