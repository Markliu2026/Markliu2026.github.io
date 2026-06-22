"use client";

import * as echarts from "echarts";
import { useEffect, useRef } from "react";

// 轻量 ECharts React 封装（与团队 APS 一致的图表栈）。
export default function Chart({
  option,
  height = 320,
}: {
  option: echarts.EChartsCoreOption;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inst = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    inst.current = echarts.init(ref.current);
    const onResize = () => inst.current?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      inst.current?.dispose();
      inst.current = null;
    };
  }, []);

  useEffect(() => {
    inst.current?.setOption(option, true);
  }, [option]);

  return <div ref={ref} style={{ width: "100%", height }} />;
}

// Arco 调色板
export const ARCO_PALETTE = [
  "#165DFF",
  "#14C9C9",
  "#722ED1",
  "#F7BA1E",
  "#F53F3F",
  "#00B42A",
  "#FF7D00",
  "#3491FA",
];
