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
  deep_eval: "深评中",
  pending_review: "待评审会",
  poc_suggest: "POC建议",
  poc_running: "POC进行中",
  poc_success: "POC成功",
  poc_failed: "POC未通过",
  productizing: "产品化中",
  productized: "已产品化",
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

export interface DeepEval {
  id: string;
  scenario_id: string;
  business_process?: string | null;
  data_diligence?: string | null;
  ai_capability_fit?: string | null;
  closed_loop?: string | null;
  risks?: string | null;
  resources?: string | null;
  productization_potential?: string | null;
  baseline?: string | null;
  labor_saving: number;
  business_improvement: number;
  risk_reduction: number;
  revenue_increase: number;
  poc_investment: number;
  productization_investment: number;
  ops_cost: number;
  annual_benefit?: number | null;
  total_investment?: number | null;
  roi_multiple?: number | null;
  payback_months?: number | null;
}

export interface Poc {
  id: string;
  scenario_id: string;
  customer?: string | null;
  owner_id?: string | null;
  stage: string;
  start_date?: string | null;
  end_date?: string | null;
  baseline_locked: boolean;
  risk_level: string;
  result: string;
  roi_multiple?: number | null;
  payback_months?: number | null;
  progress?: string | null;
  next_plan?: string | null;
  blockers?: string | null;
  need_mgmt?: string | null;
}

export interface Milestone {
  id: string; poc_id: string; name: string; stage?: string | null;
  due_date?: string | null; done: boolean;
}
export interface ValueMetric {
  id: string; poc_id: string; category: string; name: string;
  baseline?: string | null; target?: string | null; actual?: string | null;
  unit?: string | null; period?: string | null; source?: string | null;
}
export interface Meeting {
  id: string; title: string; meeting_type: string; meeting_date?: string | null;
  attendees?: string | null; status: string; notes?: string | null; created_at: string;
}
export interface ReviewItem {
  id: string; meeting_id: string; scenario_id: string;
  presenter_id?: string | null; conclusion?: string | null; action_items?: string | null;
}
export interface ContributionProfile {
  user_id: string; display_name: string; total_points: number;
  submit_count: number; p0p1_count: number; poc_count: number;
  poc_success_count: number; productized_count: number;
}
export interface PointRecord {
  id: string; event: string; points: number;
  scenario_id?: string | null; note?: string | null; created_at: string;
}
export interface DashboardStats {
  total: number; by_status: Record<string, number>;
  by_industry: Record<string, number>; by_module: Record<string, number>;
  p0p1: number; screening_pass_rate: number; poc_count: number;
  poc_success_rate: number; productized: number;
  total_annual_benefit: number; avg_roi_multiple?: number | null;
}

export const POC_STAGE_LABELS: Record<string, string> = {
  kickoff: "立项", diagnose: "现场诊断", mvp: "MVP原型",
  closedloop: "流程闭环", validate: "业务验证", done: "完成",
};

export const METRIC_CAT_LABELS: Record<string, string> = {
  efficiency: "效率类", quality: "质量类", economic: "经济类", business: "业务KPI类",
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
