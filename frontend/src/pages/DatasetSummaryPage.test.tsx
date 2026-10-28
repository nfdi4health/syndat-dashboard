import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import React from "react";
import { vi, test, expect, beforeEach, afterEach } from "vitest";
import type { MockedFunction } from "vitest";
import DatasetSummaryPage from "./DatasetSummaryPage";

const captured: any[] = [];

vi.mock("axios", () => ({
  __esModule: true,
  default: { get: vi.fn() },
}));

vi.mock("../components/results/summary/DatasetsEvaluationComparisionChart", () => ({
  __esModule: true,
  default: (props: any) => {
    captured.push(props);
    return <div data-testid="chart" />;
  },
}));

const mockedAxiosGet = axios.get as MockedFunction<typeof axios.get>;

const datasetValues: Record<string, any> = {
  "ds-a": { auc: 0.1, jsd: 0.1, norm: 1.1, so: 0.1, inf: 0.1, link: 0.1 },
  "ds-b": { auc: 0.2, jsd: 0.2, norm: 1.2, so: 0.2, inf: 0.2, link: 0.2 },
  "ds-c": { auc: 0.3, jsd: 0.3, norm: 1.3, so: 0.3, inf: 0.3, link: 0.3 },
};

beforeEach(() => {
  captured.length = 0;
  mockedAxiosGet.mockImplementation(async (url: string) => {
    if (url.endsWith("/datasets")) {
      return { data: ["ds-a", "ds-b", "ds-c"] };
    }
    for (const id of ["ds-a", "ds-b", "ds-c"]) {
      if (url.includes(`/${id}/`)) {
        const v = datasetValues[id];
        if (url.endsWith("/auc")) return { data: { auc_score: v.auc } };
        if (url.endsWith("/jsd")) return { data: { jsd_score: v.jsd } };
        if (url.endsWith("/norm")) return { data: { norm: v.norm } };
        if (url.endsWith("/risk_singling_out")) return { data: { risk: v.so } };
        if (url.endsWith("/risk_inference")) return { data: { risk: v.inf } };
        if (url.endsWith("/risk_linkability")) return { data: { risk: v.link } };
      }
    }
    return { data: 0 };
  });
});

afterEach(() => {
  mockedAxiosGet.mockReset();
});

test("summary chart receives every dataset, not just the last one", async () => {
  render(<DatasetSummaryPage />);
  await waitFor(() => expect(captured.length).toBeGreaterThan(0));
  await new Promise((resolve) => setTimeout(resolve, 50));

  const quality = captured.filter((c) => c.plotTitle === "Quality Score").pop();
  expect(quality?.datasets).toEqual(["ds-a", "ds-b", "ds-c"]);
  expect(quality?.metric1).toHaveLength(3);
});

test("summary shows risk scores in the same direction as the privacy page", async () => {
  render(<DatasetSummaryPage />);
  await waitFor(() => expect(captured.length).toBeGreaterThan(0));
  await new Promise((resolve) => setTimeout(resolve, 50));

  const privacy = captured.filter((c) => c.plotTitle === "Risk Score").pop();
  expect(privacy?.datasets).toEqual(["ds-a", "ds-b", "ds-c"]);
  expect(privacy?.metric1).toEqual([10, 20, 30]);
  expect(privacy?.metric2).toEqual([10, 20, 30]);
  expect(privacy?.metric3).toEqual([10, 20, 30]);
});

test("a failing metric on one dataset does not hang the page", async () => {
  mockedAxiosGet.mockImplementation(async (url: string) => {
    if (url.endsWith("/datasets")) {
      return { data: ["ds-a", "ds-b"] };
    }
    if (url.includes("/ds-b/") && url.endsWith("/norm")) {
      throw new Error("Request failed with status code 500");
    }
    if (url.includes("/ds-a/")) {
      if (url.endsWith("/auc")) return { data: { auc_score: 0.1 } };
      if (url.endsWith("/jsd")) return { data: { jsd_score: 0.1 } };
      if (url.endsWith("/norm")) return { data: { norm: 1.1 } };
      if (url.endsWith("/risk_singling_out")) return { data: { risk: 0.1 } };
      if (url.endsWith("/risk_inference")) return { data: { risk: 0.1 } };
      if (url.endsWith("/risk_linkability")) return { data: { risk: 0.1 } };
    }
    if (url.includes("/ds-b/")) {
      if (url.endsWith("/auc")) return { data: { auc_score: 0.2 } };
      if (url.endsWith("/jsd")) return { data: { jsd_score: 0.2 } };
      if (url.endsWith("/risk_singling_out")) return { data: { risk: 0.2 } };
      if (url.endsWith("/risk_inference")) return { data: { risk: 0.2 } };
      if (url.endsWith("/risk_linkability")) return { data: { risk: 0.2 } };
    }
    return { data: 0 };
  });

  render(<DatasetSummaryPage />);
  await waitFor(() => expect(captured.length).toBeGreaterThan(0));

  const quality = captured.filter((c) => c.plotTitle === "Quality Score").pop();
  expect(quality?.datasets).toEqual(["ds-a", "ds-b"]);
  expect(quality?.metric3).toEqual([expect.any(Number), null]);
});

test("a null (non-finite) metric value renders as a gap, not zero", async () => {  mockedAxiosGet.mockImplementation(async (url: string) => {
    if (url.endsWith("/datasets")) {
      return { data: ["ds-a"] };
    }
    if (url.endsWith("/auc")) return { data: { auc_score: null } };
    if (url.endsWith("/jsd")) return { data: { jsd_score: 0.1 } };
    if (url.endsWith("/norm")) return { data: { norm: null } };
    if (url.endsWith("/risk_singling_out")) return { data: { risk: null } };
    if (url.endsWith("/risk_inference")) return { data: { risk: 0.1 } };
    if (url.endsWith("/risk_linkability")) return { data: { risk: null } };
    return { data: 0 };
  });

  render(<DatasetSummaryPage />);
  await waitFor(() => expect(captured.length).toBeGreaterThan(0));

  const quality = captured.filter((c) => c.plotTitle === "Quality Score").pop();
  expect(quality?.metric1).toEqual([null]);
  expect(quality?.metric3).toEqual([null]);

  const privacy = captured.filter((c) => c.plotTitle === "Risk Score").pop();
  expect(privacy?.metric1).toEqual([null]);
  expect(privacy?.metric2).toEqual([10]);
  expect(privacy?.metric3).toEqual([null]);
});

test("renders the dataset rows before every metric has arrived", async () => {
  mockedAxiosGet.mockImplementation((url: string) => {
    if (url.endsWith("/datasets")) {
      return Promise.resolve({ data: ["ds-a"] }) as any;
    }
    return new Promise(() => {}) as any;
  });

  render(<DatasetSummaryPage />);
  await waitFor(() => expect(captured.length).toBeGreaterThan(0));

  const quality = captured.filter((c) => c.plotTitle === "Quality Score").pop();
  expect(quality?.datasets).toEqual(["ds-a"]);
  expect(quality?.metric1).toEqual([null]);
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
});

test("updates the chart as each dataset's metrics arrive", async () => {
  let resolveAucA: (value: any) => void = () => {};
  let resolveAucB: (value: any) => void = () => {};

  mockedAxiosGet.mockImplementation((url: string) => {
    if (url.endsWith("/datasets")) {
      return Promise.resolve({ data: ["ds-a", "ds-b"] }) as any;
    }
    if (url.endsWith("/auc") && url.includes("/ds-a/")) {
      return new Promise((resolve) => {
        resolveAucA = resolve;
      }) as any;
    }
    if (url.endsWith("/auc") && url.includes("/ds-b/")) {
      return new Promise((resolve) => {
        resolveAucB = resolve;
      }) as any;
    }
    return Promise.resolve({ data: {} }) as any;
  });

  render(<DatasetSummaryPage />);
  await waitFor(() => expect(captured.length).toBeGreaterThan(0));

  resolveAucA({ data: { auc_score: 0.5 } });

  await waitFor(() => {
    const quality = captured.filter((c) => c.plotTitle === "Quality Score").pop();
    expect(quality?.metric1[0]).not.toBeNull();
  });

  const afterFirst = captured.filter((c) => c.plotTitle === "Quality Score").pop();
  expect(afterFirst?.metric1[1]).toBeNull();

  resolveAucB({ data: { auc_score: 0.5 } });
  await waitFor(() => {
    const quality = captured.filter((c) => c.plotTitle === "Quality Score").pop();
    expect(quality?.metric1[1]).not.toBeNull();
  });
});
