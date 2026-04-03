import { AlertTriangle, X } from "lucide-react";
import type { HistoryItem } from "../types";

type HistoryCardProps = {
  item: HistoryItem;
  onRemove?: () => void;
  removing?: boolean;
  compact?: boolean;
};

export function HistoryCard({ item, onRemove, removing = false, compact = false }: HistoryCardProps) {
  if (compact) {
    const resultText = item.operation === "compare" ? (item.resultString === "true" ? "Equal" : "Not Equal") : `${item.resultValue}`;

    return (
      <article
        className={`rounded-2xl border px-4 py-3 shadow-sm transition duration-300 hover:-translate-y-0.5 ${
          item.error ? "border-rose-200 bg-rose-50/70" : "border-slate-200/80 bg-white/85"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                  item.error ? "bg-rose-100 text-rose-700" : "bg-brand-100 text-brand-700"
                }`}
              >
                {item.operation}
              </span>
              <span className="text-xs font-medium text-slate-500">{item.thisMeasurementType}</span>
            </div>
            <p className="mt-3 truncate text-sm font-medium text-slate-700">
              {item.thisValue} {item.thisUnit} {getHistoryOperatorLabel(item.operation)} {item.thatValue} {item.thatUnit}
            </p>
          </div>
          {item.error ? (
            <div className="flex items-center gap-1 text-xs font-medium text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              <span>Error</span>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Result</div>
            <div className={`mt-1 text-lg font-bold ${item.error ? "text-rose-600" : "text-brand-600"}`}>{resultText}</div>
          </div>
          <div className="text-right text-xs text-slate-500">{item.operation === "compare" ? "Comparison" : item.resultUnit || "Result"}</div>
        </div>

        {item.error && item.errorMessage ? (
          <p className="mt-3 rounded-xl bg-white/80 px-3 py-2 text-xs font-medium text-rose-700">{item.errorMessage}</p>
        ) : null}
      </article>
    );
  }

  return (
    <article
      className={`rounded-2xl border px-4 py-4 shadow-sm sm:px-5 ${
        item.error ? "border-rose-200 bg-rose-50/60" : "border-slate-200 bg-slate-50/70"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
            item.error ? "bg-rose-100 text-rose-700" : "bg-brand-100 text-brand-700"
          }`}>
            {item.operation}
          </span>
          <span className="text-xs font-medium text-slate-500 sm:text-sm">{item.thisMeasurementType}</span>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {item.error ? (
            <div className="flex items-center gap-2 text-xs font-medium text-rose-700 sm:text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Error</span>
            </div>
          ) : null}
          {onRemove ? (
            <button
              type="button"
              onClick={onRemove}
              disabled={removing}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Remove this history item"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
        <HistoryValue value={item.thisValue} unit={item.thisUnit} />
        <HistoryOperator value={getHistoryOperatorLabel(item.operation)} />
        <HistoryValue value={item.thatValue} unit={item.thatUnit} />
        <HistoryOperator value="=" />
        <HistoryResult item={item} />
      </div>

      {item.error && item.errorMessage ? (
        <p className="mt-3 rounded-lg bg-white/75 px-3 py-2 text-xs font-medium text-rose-700 sm:text-sm">{item.errorMessage}</p>
      ) : null}
    </article>
  );
}

export function getHistoryOperatorLabel(operation: string) {
  if (operation === "add") return "+";
  if (operation === "subtract") return "-";
  if (operation === "divide") return "/";
  if (operation === "compare") return "vs";
  if (operation === "convert") return "to";
  return operation;
}

function HistoryValue({ value, unit }: { value: number; unit: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-4">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{unit || "N/A"}</div>
    </div>
  );
}

function HistoryOperator({ value }: { value: string }) {
  return <div className="text-center text-2xl font-bold text-brand-500">{value}</div>;
}

function HistoryResult({ item }: { item: HistoryItem }) {
  const resultText = item.operation === "compare" ? (item.resultString === "true" ? "Equal" : "Not Equal") : `${item.resultValue}`;

  return (
    <div className="rounded-2xl bg-white px-4 py-4">
      <div className={`text-2xl font-bold ${item.error ? "text-rose-600" : "text-brand-600"}`}>{resultText}</div>
      <div className="mt-1 text-sm text-slate-500">{item.operation === "compare" ? "Comparison" : item.resultUnit || "Result"}</div>
    </div>
  );
}
