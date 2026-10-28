const MAX_DETAIL_LENGTH = 200;

export type ValidationReport = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  details?: {
    real_rows: number | null;
    synthetic_rows: number | null;
    processing_rows: number | null;
    max_processing_rows?: number;
    shared_columns: number;
    ignored_columns?: { real: string[]; synthetic: string[] };
  };
};

/**
 * Reduce a backend string to a short, single line that is safe to display.
 * Backend messages are already written for humans; this guards against raw
 * exception dumps and unbounded text slipping into the UI.
 */
const sanitize = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const text = value.replace(/\s+/g, " ").trim();
  if (!text || text.length > MAX_DETAIL_LENGTH || /traceback/i.test(text)) {
    return null;
  }
  return text;
};

const sanitizeList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => sanitize(entry))
    .filter((entry): entry is string => entry !== null);
};

/** Human readable description of a failed request, without internals. */
const describeError = (error: any): string => {
  const status = error?.response?.status;
  if (status === undefined) {
    return "Could not reach the server.";
  }
  const detail = sanitize(error?.response?.data?.detail);
  return detail ?? `Request failed (status ${status}).`;
};

/** Turn an unknown axios payload into a validation report. */
const parseReport = (data: unknown): ValidationReport | null => {
  if (!data || typeof data !== "object") {
    return null;
  }
  const report = data as Record<string, unknown>;
  if (typeof report.valid !== "boolean") {
    return null;
  }
  return {
    valid: report.valid,
    errors: sanitizeList(report.errors),
    warnings: sanitizeList(report.warnings),
    details: (report.details as ValidationReport["details"]) ?? undefined,
  };
};

const MessageUtils = { sanitize, sanitizeList, describeError, parseReport };

export default MessageUtils;
