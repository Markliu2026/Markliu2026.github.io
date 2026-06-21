export interface User {
  id: string;
  username: string;
  display_name: string;
  email?: string | null;
  roles: string[];
  department?: string | null;
}

export interface Scenario {
  id: string;
  title: string;
  status: string;
  industry: string[];
  sap_modules: string[];
  process_domain: string[];
  ai_capabilities: string[];
  customer_name?: string | null;
  pain_point?: string | null;
  human_process?: string | null;
  frequency?: string | null;
  volume?: string | null;
  kpi_candidates: string[];
  data_basis?: string | null;
  willingness_to_pay: string;
  estimated_value?: string | null;
  confidentiality_level: string;
  submitter_id: string;
  owner_id?: string | null;
  latest_weighted_score?: number | null;
  latest_recommendation?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewScore {
  id: string;
  scenario_id: string;
  reviewer_id: string;
  score_type: string;
  business_value_score: number;
  feasibility_score: number;
  replicability_score: number;
  strategic_fit_score: number;
  weighted_score: number;
  recommendation: string;
  veto_flags: string[];
  comment?: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  scenario_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  scenario_id: string;
  uploader_id: string;
  filename: string;
  file_url: string;
  confidentiality_level: string;
  created_at: string;
}

export interface Notification {
  id: string;
  event: string;
  title: string;
  body?: string | null;
  scenario_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export const STATUS_LABELS: Record<string, string> = {
  draft: "草稿",
  submitted: "已提交",
  need_info: "待补充",
  screening: "初筛中",
  observing: "入库观察",
  recommend_deep: "推荐深评",
  rejected: "已淘汰",
  merged: "已合并",
};

export const RECO_LABELS: Record<string, string> = {
  P0: "P0 优先立项",
  P1: "P1 深度评估",
  P2: "P2 入库观察",
  reject: "淘汰",
  need_info: "补充",
  merge: "合并",
};

export const VETO_FLAGS: Record<string, string> = {
  no_business_owner: "无明确业务Owner",
  no_data_in_3m: "三个月内无法获得数据样本",
  demo_only: "只能做演示，无法进入真实流程",
  roi_undefinable: "ROI无法定义",
  compliance_risk: "安全/合规/隐私/数据风险不可控",
  full_auto_no_human: "关键动作完全自动化且无人工确认",
};

export const WTP_LABELS: Record<string, string> = {
  strong: "强",
  medium: "中",
  weak: "弱",
  unknown: "未知",
};

export const CONFIDENTIALITY_LABELS: Record<string, string> = {
  public: "公开",
  internal: "内部",
  sensitive: "敏感",
  confidential: "客户机密",
};
