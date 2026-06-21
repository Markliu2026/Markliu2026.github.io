import { RECO_LABELS, STATUS_LABELS } from "@/lib/types";

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-100 text-blue-700",
  need_info: "bg-amber-100 text-amber-700",
  screening: "bg-indigo-100 text-indigo-700",
  observing: "bg-slate-100 text-slate-600",
  recommend_deep: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  merged: "bg-purple-100 text-purple-600",
};

const RECO_COLOR: Record<string, string> = {
  P0: "bg-green-600 text-white",
  P1: "bg-green-100 text-green-700",
  P2: "bg-slate-100 text-slate-600",
  reject: "bg-red-100 text-red-600",
  need_info: "bg-amber-100 text-amber-700",
  merge: "bg-purple-100 text-purple-600",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${STATUS_COLOR[status] ?? "bg-gray-100"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function RecoBadge({ reco }: { reco?: string | null }) {
  if (!reco) return <span className="text-xs text-gray-300">—</span>;
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${RECO_COLOR[reco] ?? "bg-gray-100"}`}>
      {RECO_LABELS[reco] ?? reco}
    </span>
  );
}
