// 场景填写案例样版：供顾问一键套用后再修改提交。
// 字段与新建提报表单一一对应（kpi_candidates 为逗号分隔字符串）。

export interface ScenarioTemplate {
  key: string;
  name: string; // 样版名（选择器展示）
  summary: string; // 一句话说明
  title: string;
  industry: string[];
  sap_modules: string[];
  ai_capabilities: string[];
  customer_name: string;
  pain_point: string;
  human_process: string;
  frequency: string;
  volume: string;
  kpi_candidates: string;
  data_basis: string;
  willingness_to_pay: string;
  estimated_value: string;
}

export const TEMPLATES: ScenarioTemplate[] = [
  {
    key: "aps",
    name: "APS · 智能计划排程",
    summary: "约束求解 + 需求预测，自动生成可执行排产计划",
    title: "APS 计划排程数智工程师",
    industry: ["离散制造", "装备制造"],
    sap_modules: ["PP", "MM"],
    ai_capabilities: ["优化", "预测"],
    customer_name: "某装备制造客户（脱敏）",
    pain_point:
      "多工厂多产线、换型成本高、插单频繁，计划员用 Excel 凭经验排产，计划稳定性差，齐套率与设备利用率低，交付经常延误。",
    human_process:
      "资深计划员每天 2-3 小时手工平衡订单优先级、产能、物料齐套与换型顺序，强依赖个人经验，难以复制与复盘。",
    frequency: "每日滚动排产 + 插单实时重排",
    volume: "约 800 个工单 / 30 条产线 / 5000+ 物料",
    kpi_candidates: "OTD, 设备利用率(OEE), 换型次数, 计划达成率",
    data_basis:
      "订单/工单/BOM/工艺路线/产能日历在 SAP PP 可得；设备状态来自 MES，可接口对接；约束规则需与计划部门共建。",
    willingness_to_pay: "strong",
    estimated_value: "交付准时率 +10~15%，换型成本下降，计划编制工时下降 70%",
  },
  {
    key: "fin_audit",
    name: "财务审单 · 智能稽核",
    summary: "凭证/单据合规与异常自动稽核，人工复核高风险项",
    title: "财务审单智能稽核数智工程师",
    industry: ["流程制造", "消费品"],
    sap_modules: ["FICO"],
    ai_capabilities: ["审核", "异常识别"],
    customer_name: "某消费品集团（脱敏）",
    pain_point:
      "月结期间大量凭证与报销单据靠人工逐笔稽核，规则多、口径杂，耗时且易漏，月结天数长，合规风险高。",
    human_process:
      "财务共享中心数十人按检查清单人工核对科目、税率、附件、预算与合同一致性，加班集中在月结日。",
    frequency: "每日单据稽核 + 月度结账集中稽核",
    volume: "每月数万张凭证/报销单",
    kpi_candidates: "月结天数, 稽核覆盖率, 差错率, 合规问题检出率",
    data_basis:
      "凭证、主数据、税码、预算、合同在 SAP FICO 可得；发票影像/附件在影像系统，可接口；稽核规则可结构化。",
    willingness_to_pay: "strong",
    estimated_value: "稽核工时下降 60%，月结缩短 1-2 天，合规问题检出率提升",
  },
  {
    key: "biz_qa",
    name: "经营分析 · 智能问数",
    summary: "自然语言问数（NL2SQL + RAG），自动出指标与归因",
    title: "经营分析智能问数数智工程师",
    industry: ["离散制造", "流程制造", "消费品"],
    sap_modules: ["FICO", "SD", "CO"],
    ai_capabilities: ["生成", "RAG", "Agent"],
    customer_name: "某制造集团总部（脱敏）",
    pain_point:
      "管理层临时取数需求多，依赖 IT/分析师写报表与 SQL，响应慢；口径不统一，同一指标多个版本，决策效率低。",
    human_process:
      "业务提需求→分析师理解口径→写 SQL/做报表→反复确认，平均 1-3 天，长尾问题无人响应。",
    frequency: "每日高频临时问数 + 月度经营分析",
    volume: "数百名管理者/分析师，月问数上千次",
    kpi_candidates: "取数响应时长, 自助分析占比, 指标口径一致率, 报表开发工时",
    data_basis:
      "经营数据在 SAP/BW/数仓可得；需建立指标语义层与口径字典；权限须按组织与数据分级控制。",
    willingness_to_pay: "medium",
    estimated_value: "取数响应从天级到分钟级，分析师人力释放 40%+，口径统一",
  },
  {
    key: "qms_cv",
    name: "QMS · 视觉质检",
    summary: "工业视觉缺陷检测，AI 初判 + 质检员复核",
    title: "QMS 视觉质检数智工程师",
    industry: ["离散制造", "新能源", "汽车"],
    sap_modules: ["QM", "PP"],
    ai_capabilities: ["异常识别", "多模态"],
    customer_name: "某新能源电池客户（脱敏）",
    pain_point:
      "外观/焊点/极片缺陷靠人工目检，疲劳漏检、标准不一、节拍跟不上产线，质量数据难追溯。",
    human_process:
      "质检员在产线逐件目视检查并手工记录缺陷类型，凭经验判级，培训周期长、一致性差。",
    frequency: "产线实时在线检测（按节拍）",
    volume: "单线每日数万件，多缺陷类别",
    kpi_candidates: "漏检率, 误检率, 检测节拍, 人均检验产能, 质量追溯完整率",
    data_basis:
      "需采集缺陷图像并标注（样本量与标注质量是关键）；检验结果写回 SAP QM 质检批；与 MES/相机系统对接。",
    willingness_to_pay: "strong",
    estimated_value: "漏检率显著下降，质检人力下降 50%+，缺陷数据可追溯",
  },
  {
    key: "data_clean",
    name: "数据清理 · 主数据治理",
    summary: "主数据查重/纠错/补全，治理规则 + 人工确认",
    title: "主数据清理与治理数智工程师",
    industry: ["离散制造", "流程制造"],
    sap_modules: ["MDG", "MM"],
    ai_capabilities: ["异常识别", "生成"],
    customer_name: "某集团共享中心（脱敏）",
    pain_point:
      "物料/供应商/客户主数据重复、字段缺失、命名不规范，导致采购/库存/报表口径混乱，系统集成频繁出错。",
    human_process:
      "数据专员凭经验人工查重、补全分类与描述、核对规范，工作量大、标准难统一、清理后又快速劣化。",
    frequency: "存量批量清理 + 新建实时校验",
    volume: "存量数十万条主数据，每月新增数千条",
    kpi_candidates: "重复率, 字段完整率, 规范符合率, 清理工时, 集成报错率",
    data_basis:
      "主数据在 SAP MDG/ECC 可得；需沉淀分类与命名规则、相似度阈值；高风险变更须人工确认与审批留痕。",
    willingness_to_pay: "medium",
    estimated_value: "重复率/报错率大幅下降，清理工时下降 60%，数据质量可持续",
  },
  {
    key: "procurement",
    name: "采购 · 智能寻源与到货预测",
    summary: "到货延迟预测 + 寻源建议，采购员决策辅助",
    title: "采购到货预测与智能寻源数智工程师",
    industry: ["离散制造", "装备制造"],
    sap_modules: ["MM", "MDG"],
    ai_capabilities: ["预测", "优化", "Agent"],
    customer_name: "某装备制造客户（脱敏）",
    pain_point:
      "供应商交付波动大，到货延迟常导致停线；询比价与寻源靠人工，采购员凭经验催货，缺乏前瞻预警。",
    human_process:
      "采购员人工跟踪在途订单、电话催货、Excel 比价，问题暴露时往往已影响生产，难以提前干预。",
    frequency: "每日到货风险预警 + 寻源按需",
    volume: "数千张采购订单/数百家供应商",
    kpi_candidates: "到货准时率, 缺料停线次数, 采购周期, 寻源成本节省",
    data_basis:
      "采购订单/收货/供应商主数据/历史交付在 SAP MM 可得；价格与评估数据需治理；预警须人工确认后行动。",
    willingness_to_pay: "medium",
    estimated_value: "到货准时率提升，缺料停线下降，采购跟单工时下降 50%",
  },
];
