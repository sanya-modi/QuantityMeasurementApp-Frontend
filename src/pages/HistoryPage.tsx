import { ArrowLeft, History, LogOut, RefreshCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BalanceLogo } from "../components/BalanceLogo";
import { HistoryCard } from "../components/HistoryCard";
import { fetchAuthStatus, logout } from "../lib/auth";
import { clearAllHistory, deleteHistoryItem, fetchHistory } from "../lib/measurement";
import type { HistoryItem } from "../types";

export function HistoryPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyStatus, setHistoryStatus] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const [removingId, setRemovingId] = useState<string | number | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const status = await fetchAuthStatus();
        setAuthenticated(status.authenticated);
      } finally {
        setReady(true);
      }
    };

    void run();
  }, []);

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
  }, [authenticated, refreshKey]);

  const handleRemoveItem = async (item: HistoryItem, index: number) => {
    if (item.id === undefined || item.id === null) {
      setHistoryStatus("This history item cannot be removed because it has no id.");
      return;
    }

    setRemovingId(item.id);
    setHistoryStatus("");

    try {
      await deleteHistoryItem(item.id);
      setHistoryItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
    } catch (error) {
      setHistoryStatus(error instanceof Error ? error.message : "Unable to remove history item.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    setHistoryStatus("");

    try {
      await clearAllHistory();
      setHistoryItems([]);
      setRefreshKey((current) => current + 1);
      setHistoryStatus("All history has been cleared.");
      setShowClearConfirm(false);
    } catch (error) {
      setHistoryStatus(error instanceof Error ? error.message : "Unable to clear history.");
    } finally {
      setClearingAll(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/measurement", { replace: true });
  };

  const showReturnToCalculator = useMemo(() => authenticated && !historyLoading && historyItems.length === 0, [authenticated, historyItems.length, historyLoading]);

  if (!ready) {
    return <div className="flex min-h-screen items-center justify-center text-sm font-medium text-slate-500">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="sticky top-0 z-50 border-b border-brand-700/60 bg-brand-600/95 shadow-sm shadow-brand-900/10 backdrop-blur">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <BalanceLogo className="h-10 w-10 rounded-full bg-white/95 p-1" />
            <h1 className="text-lg font-bold text-white sm:text-xl">Quantity Measurement App</h1>
          </div>
          {authenticated ? (
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
          ) : null}
        </div>
      </nav>

      <section className="mx-auto max-w-[1380px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {!authenticated ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-panel">
            <p className="text-xl font-semibold text-slate-900">Login to view your history.</p>
            <p className="mt-3 text-sm text-slate-500">History is only available for signed-in users. The calculator still works in guest mode.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                Go to Login
              </Link>
              <Link
                to="/measurement"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Return to Calculator
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-panel sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Your Full History</h2>
              </div>
            </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/measurement"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-600 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Calculator</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setRefreshKey((current) => current + 1)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-600 hover:text-white"
                >
                  <RefreshCcw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={historyItems.length === 0 || clearingAll}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:bg-brand-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            {historyLoading ? <p className="text-sm font-medium text-slate-500">Loading history...</p> : null}
            {!historyLoading && historyStatus ? <p className="text-sm font-medium text-slate-500">{historyStatus}</p> : null}

            {!historyLoading && historyItems.length > 0 ? (
              <div className="grid gap-4">
                {historyItems.map((item, index) => {
                  const key = getHistoryItemKey(item, index);

                  return (
                    <HistoryCard
                      key={key}
                      item={item}
                      removing={removingId === item.id}
                      onRemove={() => {
                        void handleRemoveItem(item, index);
                      }}
                    />
                  );
                })}
              </div>
            ) : null}

            {showReturnToCalculator ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center shadow-panel">
                <p className="text-base font-semibold text-slate-900">No history to show.</p>
                <p className="mt-2 text-sm text-slate-500">You can return to the calculator and start a new measurement whenever you want.</p>
                <Link
                  to="/measurement"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
                >
                  Return to Calculator
                </Link>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {showClearConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-6 shadow-2xl">
            <div className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              Confirm Delete
            </div>
            <h2 className="mt-3 text-xl font-semibold text-slate-900">Clear all history?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              This will delete every saved calculation for the current user. When you press confirm, all history will be removed.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleClearAll();
                }}
                disabled={clearingAll}
                className="rounded-full bg-gradient-to-r from-brand-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-panel disabled:cursor-not-allowed disabled:opacity-60"
              >
                {clearingAll ? "Deleting..." : "Confirm Delete All"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function getHistoryItemKey(item: HistoryItem, index: number) {
  return String(item.id ?? `${item.operation}-${index}-${item.thisUnit}-${item.thatUnit}-${item.resultValue}`);
}
