import { ArrowRight, FlaskConical, History, LogOut, RefreshCcw, Ruler, Scale, Thermometer, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BalanceLogo } from "../components/BalanceLogo";
import { HistoryCard } from "../components/HistoryCard";
import { fetchAuthStatus, getStoredUser, getUserDisplayName, logout, saveUser } from "../lib/auth";
import { fetchHistory, measurementConfig, submitCalculation, type ActionKey, type MeasurementTypeKey } from "../lib/measurement";
import type { CalculationResponse, HistoryItem, QuantityDTO, User } from "../types";

type ComparisonState = {
  fromValue: string;
  fromUnit: string;
  toValue: string;
  toUnit: string;
};

type ConversionState = {
  value: string;
  fromUnit: string;
  toUnit: string;
};

type ArithmeticState = {
  value1: string;
  unit1: string;
  operator: "+" | "-" | "/" | "*";
  value2: string;
  unit2: string;
  resultUnit: string;
};

const icons = {
  length: Ruler,
  weight: Scale,
  temperature: Thermometer,
  volume: FlaskConical
} as const;

export function MeasurementPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser());
  const [selectedType, setSelectedType] = useState<MeasurementTypeKey>("length");
  const [selectedAction, setSelectedAction] = useState<ActionKey>("comparison");
  const [statusText, setStatusText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CalculationResponse | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyStatus, setHistoryStatus] = useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [comparison, setComparison] = useState<ComparisonState>({
    fromValue: "1",
    fromUnit: measurementConfig.length.units[0].value,
    toValue: "1000",
    toUnit: measurementConfig.length.units[1].value
  });
  const [conversion, setConversion] = useState<ConversionState>({
    value: "1",
    fromUnit: measurementConfig.length.units[0].value,
    toUnit: measurementConfig.length.units[1].value
  });
  const [arithmetic, setArithmetic] = useState<ArithmeticState>({
    value1: "1",
    unit1: measurementConfig.length.units[0].value,
    operator: "+",
    value2: "1",
    unit2: measurementConfig.length.units[1].value,
    resultUnit: measurementConfig.length.units[0].value
  });

  const units = measurementConfig[selectedType].units;

  useEffect(() => {
    const run = async () => {
      try {
        const status = await fetchAuthStatus();
        setAuthenticated(status.authenticated);
        if (status.user) {
          saveUser(status.user);
          setCurrentUser(status.user);
        } else if (!status.authenticated) {
          setCurrentUser(null);
        }
      } finally {
        setReady(true);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    const nextUnits = measurementConfig[selectedType].units;
    setComparison((current) => ({
      ...current,
      fromUnit: nextUnits[0].value,
      toUnit: (nextUnits[1] ?? nextUnits[0]).value
    }));
    setConversion({
      value: "1",
      fromUnit: nextUnits[0].value,
      toUnit: (nextUnits[1] ?? nextUnits[0]).value
    });
    setArithmetic({
      value1: "1",
      unit1: nextUnits[0].value,
      operator: "+",
      value2: "1",
      unit2: (nextUnits[1] ?? nextUnits[0]).value,
      resultUnit: nextUnits[0].value
    });
    setResult(null);
    setStatusText("");
  }, [selectedType]);

  useEffect(() => {
    if (!authenticated) {
      return;
    }

    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryStatus("");

      try {
        const data = await fetchHistory("/api/v1/quantities/my/history");
        setHistoryItems(data);
        if (data.length === 0) {
          setHistoryStatus("No history found yet.");
        }
      } catch (error) {
        setHistoryItems([]);
        setHistoryStatus(error instanceof Error ? error.message : "Unable to load history.");
      } finally {
        setHistoryLoading(false);
      }
    };

    void loadHistory();
  }, [authenticated, historyRefreshKey]);

  const resultLabel = useMemo(() => {
    if (!result) {
      return "";
    }
    if (result.operation === "compare") {
      return result.resultString === "true" ? "Equal" : "Not Equal";
    }
    if (result.resultValue === undefined || result.resultValue === null) {
      return "";
    }
    return String(result.resultValue);
  }, [result]);

  const currentUserName = useMemo(() => getUserDisplayName(currentUser), [currentUser]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-medium text-slate-500">Loading...</div>;
  }

  const buildQuantityDTO = (value: string | number, unit: string): QuantityDTO => ({
    value: Number(value),
    unit,
    measurementType: measurementConfig[selectedType].measurementType
  });

  const getUnitLabel = (unitValue: string) => units.find((unit) => unit.value === unitValue)?.label ?? unitValue;

  const getDisplayedResultUnit = () => {
    if (result?.operation === "compare") {
      return "Comparison";
    }

    if (selectedAction === "conversion") {
      return getUnitLabel(result?.resultUnit ?? conversion.toUnit);
    }

    return getUnitLabel(result?.resultUnit ?? arithmetic.resultUnit);
  };

  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
    setCurrentUser(null);
    setHistoryItems([]);
    setHistoryStatus("");
    setResult(null);
    setStatusText("You are now using the app without login.");
    navigate("/measurement", { replace: true });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);
    setStatusText("Calculating...");

    try {
      if (selectedAction === "comparison") {
        const data = await submitCalculation("/api/v1/quantities/compare", {
          thisQuantityDTO: buildQuantityDTO(comparison.fromValue, comparison.fromUnit),
          thatQuantityDTO: buildQuantityDTO(comparison.toValue, comparison.toUnit)
        });
        setResult(data);
        setStatusText("Comparison completed from backend response.");
        if (authenticated) {
          setHistoryRefreshKey((current) => current + 1);
        }
      } else if (selectedAction === "conversion") {
        const data = await submitCalculation("/api/v1/quantities/convert", {
          thisQuantityDTO: buildQuantityDTO(conversion.value, conversion.fromUnit),
          thatQuantityDTO: buildQuantityDTO(0, conversion.toUnit)
        });
        setResult({
          ...data,
          resultUnit: data.resultUnit ?? conversion.toUnit
        });
        setStatusText("Calculation completed from backend response.");
        if (authenticated) {
          setHistoryRefreshKey((current) => current + 1);
        }
      } else {
        const endpoint =
          arithmetic.operator === "+"
            ? "/api/v1/quantities/add"
            : arithmetic.operator === "-"
              ? "/api/v1/quantities/subtract"
              : arithmetic.operator === "*"
                ? "/api/v1/quantities/multiply"
                : "/api/v1/quantities/divide";
        const data = await submitCalculation(endpoint, {
          thisQuantityDTO: buildQuantityDTO(arithmetic.value1, arithmetic.unit1),
          thatQuantityDTO: buildQuantityDTO(arithmetic.value2, arithmetic.unit2)
        });

        let finalResult = {
          ...data,
          resultUnit: data.resultUnit ?? arithmetic.resultUnit
        };

        if (
          finalResult.resultValue !== undefined &&
          finalResult.resultValue !== null &&
          typeof finalResult.resultValue !== "string" &&
          finalResult.resultUnit &&
          finalResult.resultUnit !== arithmetic.resultUnit
        ) {
          const convertedResult = await submitCalculation("/api/v1/quantities/convert", {
            thisQuantityDTO: buildQuantityDTO(finalResult.resultValue, finalResult.resultUnit),
            thatQuantityDTO: buildQuantityDTO(0, arithmetic.resultUnit)
          });

          finalResult = {
            ...finalResult,
            resultValue: convertedResult.resultValue,
            resultUnit: convertedResult.resultUnit ?? arithmetic.resultUnit
          };
        }

        setResult(finalResult);
        setStatusText("Calculation completed from backend response.");
        if (authenticated) {
          setHistoryRefreshKey((current) => current + 1);
        }
      }
    } catch (error) {
      setResult(null);
      setStatusText(error instanceof Error ? error.message : "Unable to fetch calculation from backend.");
    } finally {
      setSubmitting(false);
    }
  };

  const recentHistory = historyItems.slice(0, 6);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_85%_15%,_rgba(45,212,191,0.18),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_52%,_#f8fafc_100%)]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-brand-700/60 bg-brand-600/95 shadow-sm shadow-brand-900/10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <BalanceLogo className="h-10 w-10 rounded-full bg-white/95 p-1 shadow-panel" />
            <h1 className="text-lg font-bold text-white sm:text-xl">Quantity Measurement App</h1>
          </div>
          {authenticated ? (
            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-white/20 bg-white/10 px-4 py-2 text-right text-white sm:block">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Signed in as</p>
                <p className="text-sm font-semibold text-white">{currentUserName}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void handleLogout();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : null}
        </div>
      </nav>

      <div className="mx-auto w-full max-w-[1380px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {/* Type Selection */}
        <section className="mb-10 space-y-4">
          <span className="text-xs font-semibold tracking-[0.18em] text-slate-600">SELECT MEASUREMENT TYPE</span>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(measurementConfig).map(([key, value]) => {
              const Icon = icons[key as MeasurementTypeKey];
              const active = selectedType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedType(key as MeasurementTypeKey)}
                  className={`rounded-2xl border px-6 py-8 text-center shadow-panel transition duration-300 hover:-translate-y-1 hover:shadow-auth ${
                    active
                      ? "border-brand-300 bg-gradient-to-br from-brand-50 to-cyan-50"
                      : "border-slate-200/70 bg-gradient-to-br from-white to-slate-50 hover:border-brand-300"
                  }`}
                >
                  <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${active ? "bg-gradient-to-br from-brand-500 to-cyan-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <div className="mt-4 text-base font-semibold capitalize text-slate-900">{key}</div>
                  <div className="mt-2 text-xs text-slate-500">{value.units.length} units</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Action Selection */}
        <section className="mb-10 space-y-4">
          <span className="text-xs font-semibold tracking-[0.18em] text-slate-600">SELECT ACTION</span>
          <div className="grid gap-3 sm:grid-cols-3">
            {(["comparison", "conversion", "arithmetic"] as ActionKey[]).map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => {
                    setSelectedAction(action);
                    setResult(null);
                    setStatusText("");
                  }}
                  className={`rounded-2xl px-5 py-3 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 ${
                    selectedAction === action
                      ? "bg-gradient-to-r from-brand-600 to-cyan-500 text-white shadow-lg shadow-brand-500/25"
                      : "border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-brand-300 hover:text-brand-600"
                  }`}
                >
                {action.charAt(0).toUpperCase() + action.slice(1)}
              </button>
            ))}
          </div>
        </section>

        {/* Form Section */}
        <section className="mb-10 rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-panel backdrop-blur">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {selectedAction === "comparison" ? (
              <div className="grid gap-6 lg:grid-cols-2">
                <QuantityCard
                  label="FROM"
                  value={comparison.fromValue}
                  unit={comparison.fromUnit}
                  units={units}
                  onValueChange={(value) => setComparison((current) => ({ ...current, fromValue: value }))}
                  onUnitChange={(unit) => setComparison((current) => ({ ...current, fromUnit: unit }))}
                />
                <QuantityCard
                  label="TO"
                  value={comparison.toValue}
                  unit={comparison.toUnit}
                  units={units}
                  onValueChange={(value) => setComparison((current) => ({ ...current, toValue: value }))}
                  onUnitChange={(unit) => setComparison((current) => ({ ...current, toUnit: unit }))}
                />
              </div>
            ) : null}

            {selectedAction === "conversion" ? (
              <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-end">
                <QuantityCard
                  label="VALUE"
                  value={conversion.value}
                  unit={conversion.fromUnit}
                  units={units}
                  onValueChange={(value) => setConversion((current) => ({ ...current, value }))}
                  onUnitChange={(unit) => setConversion((current) => ({ ...current, fromUnit: unit }))}
                />
                <div className="flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 text-white shadow-panel">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                </div>
                <UnitOnlyCard
                  label="CONVERT INTO"
                  unit={conversion.toUnit}
                  units={units}
                  onUnitChange={(unit) => setConversion((current) => ({ ...current, toUnit: unit }))}
                />
              </div>
            ) : null}

            {selectedAction === "arithmetic" ? (
              <div className="grid gap-6 xl:grid-cols-[1fr_auto_1fr_320px] xl:items-end">
                <QuantityCard
                  label="VALUE 1"
                  value={arithmetic.value1}
                  unit={arithmetic.unit1}
                  units={units}
                  onValueChange={(value) => setArithmetic((current) => ({ ...current, value1: value }))}
                  onUnitChange={(unit) => setArithmetic((current) => ({ ...current, unit1: unit }))}
                />
                <div className="flex items-center justify-center">
                  <select
                    value={arithmetic.operator}
                    onChange={(event) => setArithmetic((current) => ({ ...current, operator: event.target.value as "+" | "-" | "/" | "*" }))}
                    className="h-16 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-5 text-2xl font-semibold text-slate-800 shadow-panel outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  >
                    <option value="+">+</option>
                    <option value="-">-</option>
                    <option value="*">*</option>
                    <option value="/">/</option>
                  </select>
                </div>
                <QuantityCard
                  label="VALUE 2"
                  value={arithmetic.value2}
                  unit={arithmetic.unit2}
                  units={units}
                  onValueChange={(value) => setArithmetic((current) => ({ ...current, value2: value }))}
                  onUnitChange={(unit) => setArithmetic((current) => ({ ...current, unit2: unit }))}
                />
                <UnitOnlyCard
                  label="RESULT UNIT"
                  unit={arithmetic.resultUnit}
                  units={units}
                  onUnitChange={(unit) => setArithmetic((current) => ({ ...current, resultUnit: unit }))}
                />
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-gradient-to-r from-brand-600 to-cyan-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-auth disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Calculating..." : "Calculate"}
              </button>
            </div>
          </form>
        </section>

        {/* Result Section */}
        {result && resultLabel ? (
          <section className="mb-10 grid gap-4 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-cyan-50 p-6 shadow-panel sm:grid-cols-[1fr_220px] sm:items-center">
            <div className="border-l-4 border-brand-500 pl-4">
              <div className="text-xs font-semibold tracking-[0.18em] text-slate-500">RESULT</div>
              <div className="mt-2 text-3xl font-bold text-brand-600">{resultLabel}</div>
            </div>
            <div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-4 text-sm font-medium text-slate-700">
                {getDisplayedResultUnit()}
              </div>
            </div>
          </section>
        ) : null}

        {/* History Section */}
        <section className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-panel backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-cyan-100 text-brand-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Calculation History</h2>
            </div>
          </div>
            {authenticated ? (
              <div className="flex gap-2">
                <Link
                  to="/history"
                  className="flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-600 hover:text-white hover:shadow-panel"
                >
                  View All
                </Link>
                <button
                  type="button"
                  onClick={() => setHistoryRefreshKey((current) => current + 1)}
                  className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-600 hover:text-white hover:shadow-panel"
                >
                  <RefreshCcw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-5 space-y-4">
            {authenticated ? (
              <>
                {historyLoading ? <p className="text-sm font-medium text-slate-500">Loading history...</p> : null}
                {!historyLoading && historyStatus ? <p className="text-sm font-medium text-slate-500">{historyStatus}</p> : null}
                {!historyLoading && !historyStatus && recentHistory.length > 0 ? (
                  <div className="grid gap-3">
                    {recentHistory.map((item, index) => (
                      <HistoryCard
                        key={String(item.id ?? `${item.operation}-${index}-${item.thisUnit}-${item.thatUnit}-${item.resultValue}`)}
                        item={item}
                        compact
                      />
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-cyan-50 px-5 py-8 text-center">
                <p className="text-base font-semibold text-slate-900">History is available after login.</p>
                <p className="mt-2 text-sm text-slate-500">
                  You can still compare, convert, and calculate quantities right now in guest mode.
                </p>
                <Link
                  to="/login"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:shadow-panel"
                >
                  Go to Login
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

type Unit = {
  label: string;
  value: string;
};

type QuantityCardProps = {
  label: string;
  value: string;
  unit: string;
  units: readonly Unit[];
  onValueChange: (value: string) => void;
  onUnitChange: (unit: string) => void;
};

function QuantityCard({ label, value, unit, units, onValueChange, onUnitChange }: QuantityCardProps) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 shadow-panel transition duration-300 hover:-translate-y-0.5 hover:shadow-auth">
      <div className="px-5 pt-5 text-xs font-semibold tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-3 border-y border-slate-100 px-5 py-4">
        <input
          type="number"
          step="any"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className="w-full border-none bg-transparent p-0 text-4xl font-bold text-slate-900 outline-none"
        />
      </div>
      <select
        value={unit}
        onChange={(event) => onUnitChange(event.target.value)}
        className="w-full rounded-b-[24px] border-none bg-transparent px-5 py-4 text-sm text-slate-600 outline-none"
      >
        {units.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}

type UnitOnlyCardProps = {
  label: string;
  unit: string;
  units: readonly Unit[];
  onUnitChange: (unit: string) => void;
};

function UnitOnlyCard({ label, unit, units, onUnitChange }: UnitOnlyCardProps) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 shadow-panel transition duration-300 hover:-translate-y-0.5 hover:shadow-auth">
      <div className="px-5 pt-5 text-xs font-semibold tracking-[0.18em] text-slate-500">{label}</div>
      <select
        value={unit}
        onChange={(event) => onUnitChange(event.target.value)}
        className="mt-3 w-full rounded-b-[24px] border-t border-slate-100 bg-transparent px-5 py-5 text-sm text-slate-600 outline-none"
      >
        {units.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
