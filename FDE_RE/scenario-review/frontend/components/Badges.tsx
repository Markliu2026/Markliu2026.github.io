"use client";

import { Tag } from "@arco-design/web-react";
import { RECO_LABELS, STATUS_LABELS } from "@/lib/types";

const STATUS_COLOR: Record<string, string> = {
  draft: "gray",
  submitted: "arcoblue",
  need_info: "orange",
  screening: "purple",
  observing: "gray",
  recommend_deep: "green",
  rejected: "red",
  merged: "purple",
  deep_eval: "cyan",
  pending_review: "blue",
  poc_suggest: "lime",
  poc_running: "orangered",
  poc_success: "green",
  poc_failed: "red",
  productizing: "gold",
  productized: "green",
};

const RECO_COLOR: Record<string, string> = {
  P0: "green",
  P1: "lime",
  P2: "gray",
  reject: "red",
  need_info: "orange",
  merge: "purple",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Tag color={STATUS_COLOR[status] ?? "gray"} size="small">
      {STATUS_LABELS[status] ?? status}
    </Tag>
  );
}

export function RecoBadge({ reco }: { reco?: string | null }) {
  if (!reco) return <span style={{ color: "var(--color-text-4)" }}>—</span>;
  return (
    <Tag color={RECO_COLOR[reco] ?? "gray"} size="small" bordered>
      {RECO_LABELS[reco] ?? reco}
    </Tag>
  );
}
