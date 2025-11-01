export type DateInput = Date | string | number;

function toDate(input: DateInput): Date {
  return input instanceof Date ? new Date(input.getTime()) : new Date(input);
}

export function addDays(date: DateInput, amount: number): Date {
  const result = toDate(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function subDays(date: DateInput, amount: number): Date {
  return addDays(date, -amount);
}

export function addWeeks(date: DateInput, amount: number): Date {
  return addDays(date, amount * 7);
}

export function isBefore(date: DateInput, compare: DateInput): boolean {
  return toDate(date).getTime() < toDate(compare).getTime();
}

export function isWithinInterval(
  date: DateInput,
  interval: { start: DateInput; end: DateInput }
): boolean {
  const value = toDate(date).getTime();
  const start = toDate(interval.start).getTime();
  const end = toDate(interval.end).getTime();
  return value >= Math.min(start, end) && value <= Math.max(start, end);
}

function startOfDay(date: Date): Date {
  const result = new Date(date.getTime());
  result.setHours(0, 0, 0, 0);
  return result;
}

export function differenceInCalendarDays(left: DateInput, right: DateInput): number {
  const leftStart = startOfDay(toDate(left));
  const rightStart = startOfDay(toDate(right));
  const diff = leftStart.getTime() - rightStart.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function formatISO(
  date: DateInput,
  options?: { representation?: "complete" | "date" | "time" }
): string {
  const value = toDate(date).toISOString();
  if (options?.representation === "date") {
    return value.split("T")[0] ?? value;
  }
  if (options?.representation === "time") {
    return value.split("T")[1] ?? value;
  }
  return value;
}

const fullDateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "full" });
const mediumDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDisplay(date: DateInput, token: "PPPP" | "PPpp"): string {
  const value = toDate(date);
  return token === "PPPP" ? fullDateFormatter.format(value) : mediumDateTimeFormatter.format(value);
}

export function formatDistanceToNow(
  date: DateInput,
  options?: { addSuffix?: boolean }
): string {
  const value = toDate(date);
  const now = new Date();
  const diffMs = value.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);

  type Threshold = {
    limit: number;
    divisor: number;
    unit: "second" | "minute" | "hour" | "day" | "month" | "year";
  };

  const thresholds: Threshold[] = [
    { limit: 60, divisor: 1, unit: "second" },
    { limit: 60 * 60, divisor: 60, unit: "minute" },
    { limit: 60 * 60 * 24, divisor: 60 * 60, unit: "hour" },
    { limit: 60 * 60 * 24 * 30, divisor: 60 * 60 * 24, unit: "day" },
    { limit: 60 * 60 * 24 * 365, divisor: 60 * 60 * 24 * 30, unit: "month" },
  ];

  let valueCount: number;
  let unit: string;

  if (absMs < 1000) {
    valueCount = 0;
    unit = "second";
  } else {
    let chosen = thresholds.find((entry) => absMs < entry.limit * 1000);
    if (!chosen) {
      chosen = { limit: Number.POSITIVE_INFINITY, divisor: 60 * 60 * 24 * 365, unit: "year" };
    }
    valueCount = Math.max(1, Math.round(absMs / (chosen.divisor * 1000)));
    unit = chosen.unit;
  }

  const plural = valueCount === 1 ? "" : "s";
  const base = `${valueCount} ${unit}${plural}`;

  if (options?.addSuffix) {
    if (diffMs < 0) {
      return `${base} ago`;
    }
    return `in ${base}`;
  }

  return base;
}
