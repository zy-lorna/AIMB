import { useState, useMemo } from "react"
import EChartsMap, { type MapLevel, type LevelValues } from "./components/EChartsMap"
import logoSvg from "./imports/logo.svg"

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "pathway" | "effect"
type OverviewMetric = "高危占比" | "确诊占比"

// ─── Data (keyed by English id) ───────────────────────────────────────────────

interface AreaData {
  name: string          // Chinese name, used as DataV map key
  基档: number
  高危占比: number
  确诊占比: number
  专档在管: number
  未检测率: number
  未达标率: number
  未闭环率: number
  入径率: number
  节点执行率: number
  闭环率: number
  血压控制率: number
  HbA1c达标率: number
  LDL达标率: number
}

// Province → 11 prefecture-level cities
const citiesData: Record<string, AreaData> = {
  huzhou:   { name: "湖州市", 基档: 142800, 高危占比: 18.5, 确诊占比: 12.3, 专档在管:  52400, 未检测率: 15.2, 未达标率: 28.4, 未闭环率: 22.1, 入径率: 78.2, 节点执行率: 72.4, 闭环率: 65.8, 血压控制率: 74.5, HbA1c达标率: 60.8, LDL达标率: 55.2 },
  jiaxing:  { name: "嘉兴市", 基档: 198500, 高危占比: 21.3, 确诊占比: 14.8, 专档在管:  78200, 未检测率: 12.8, 未达标率: 25.6, 未闭环率: 19.3, 入径率: 81.5, 节点执行率: 75.8, 闭环率: 69.2, 血压控制率: 76.8, HbA1c达标率: 62.4, LDL达标率: 57.5 },
  hangzhou: { name: "杭州市", 基档: 485200, 高危占比: 19.8, 确诊占比: 13.5, 专档在管: 185600, 未检测率: 10.5, 未达标率: 22.3, 未闭环率: 17.8, 入径率: 86.2, 节点执行率: 80.4, 闭环率: 73.5, 血压控制率: 79.2, HbA1c达标率: 65.8, LDL达标率: 61.4 },
  shaoxing: { name: "绍兴市", 基档: 215400, 高危占比: 22.6, 确诊占比: 15.9, 专档在管:  85200, 未检测率: 18.4, 未达标率: 31.2, 未闭环率: 25.6, 入径率: 76.8, 节点执行率: 70.2, 闭环率: 63.5, 血压控制率: 72.8, HbA1c达标率: 58.4, LDL达标率: 52.8 },
  ningbo:   { name: "宁波市", 基档: 398600, 高危占比: 20.1, 确诊占比: 14.2, 专档在管: 152800, 未检测率: 11.2, 未达标率: 24.5, 未闭环率: 18.9, 入径率: 84.5, 节点执行率: 78.2, 闭环率: 71.8, 血压控制率: 78.2, HbA1c达标率: 64.5, LDL达标率: 60.2 },
  zhoushan: { name: "舟山市", 基档:  68400, 高危占比: 16.8, 确诊占比: 11.2, 专档在管:  24800, 未检测率:  8.6, 未达标率: 19.8, 未闭环率: 15.4, 入径率: 88.4, 节点执行率: 82.6, 闭环率: 76.2, 血压控制率: 81.5, HbA1c达标率: 67.2, LDL达标率: 63.8 },
  jinhua:   { name: "金华市", 基档: 285600, 高危占比: 23.8, 确诊占比: 16.4, 专档在管: 108400, 未检测率: 19.8, 未达标率: 33.5, 未闭环率: 27.2, 入径率: 74.5, 节点执行率: 68.4, 闭环率: 61.2, 血压控制率: 70.4, HbA1c达标率: 56.2, LDL达标率: 50.8 },
  quzhou:   { name: "衢州市", 基档: 128400, 高危占比: 25.2, 确诊占比: 17.8, 专档在管:  48600, 未检测率: 22.4, 未达标率: 36.8, 未闭环率: 29.5, 入径率: 71.2, 节点执行率: 65.8, 闭环率: 58.4, 血压控制率: 67.8, HbA1c达标率: 53.4, LDL达标率: 47.5 },
  taizhou:  { name: "台州市", 基档: 318500, 高危占比: 21.8, 确诊占比: 15.1, 专档在管: 118200, 未检测率: 14.6, 未达标率: 27.8, 未闭环率: 21.4, 入径率: 80.2, 节点执行率: 74.5, 闭环率: 67.8, 血压控制率: 75.6, HbA1c达标率: 61.5, LDL达标率: 56.8 },
  lishui:   { name: "丽水市", 基档: 152400, 高危占比: 26.4, 确诊占比: 18.6, 专档在管:  58200, 未检测率: 24.8, 未达标率: 38.5, 未闭环率: 31.2, 入径率: 68.5, 节点执行率: 62.4, 闭环率: 55.8, 血压控制率: 64.5, HbA1c达标率: 50.2, LDL达标率: 44.8 },
  wenzhou:  { name: "温州市", 基档: 425800, 高危占比: 20.9, 确诊占比: 14.6, 专档在管: 162400, 未检测率: 13.4, 未达标率: 26.2, 未闭环率: 20.8, 入径率: 82.8, 节点执行率: 76.5, 闭环率: 70.2, 血压控制率: 76.8, HbA1c达标率: 63.2, LDL达标率: 58.5 },
}

// 杭州市 → 13 districts (name matches DataV feature names exactly)
const hangzhouData: Record<string, AreaData> = {
  chunan:     { name: "淳安县", 基档:  22800, 高危占比: 27.2, 确诊占比: 19.5, 专档在管:  8600, 未检测率: 23.8, 未达标率: 38.2, 未闭环率: 30.5, 入径率: 65.2, 节点执行率: 58.4, 闭环率: 52.8, 血压控制率: 62.4, HbA1c达标率: 48.6, LDL达标率: 43.2 },
  linan:      { name: "临安区", 基档:  38200, 高危占比: 24.8, 确诊占比: 17.5, 专档在管: 14400, 未检测率: 18.2, 未达标率: 32.4, 未闭环率: 25.6, 入径率: 70.8, 节点执行率: 64.5, 闭环率: 58.2, 血压控制率: 68.5, HbA1c达标率: 54.2, LDL达标率: 48.8 },
  jiande:     { name: "建德市", 基档:  25600, 高危占比: 26.4, 确诊占比: 18.8, 专档在管:  9600, 未检测率: 22.2, 未达标率: 36.5, 未闭环率: 28.8, 入径率: 67.5, 节点执行率: 61.2, 闭环率: 55.4, 血压控制率: 65.2, HbA1c达标率: 51.5, LDL达标率: 46.2 },
  tonglu:     { name: "桐庐县", 基档:  28400, 高危占比: 25.6, 确诊占比: 18.2, 专档在管: 10600, 未检测率: 20.5, 未达标率: 34.8, 未闭环率: 27.2, 入径率: 69.2, 节点执行率: 63.5, 闭环率: 57.2, 血压控制率: 67.0, HbA1c达标率: 52.8, LDL达标率: 47.5 },
  fuyang:     { name: "富阳区", 基档:  45600, 高危占比: 23.5, 确诊占比: 16.2, 专档在管: 17200, 未检测率: 16.4, 未达标率: 29.5, 未闭环率: 22.8, 入径率: 73.5, 节点执行率: 68.2, 闭环率: 61.8, 血压控制率: 71.2, HbA1c达标率: 57.5, LDL达标率: 52.2 },
  yuhang:     { name: "余杭区", 基档:  68200, 高危占比: 21.6, 确诊占比: 14.9, 专档在管: 25800, 未检测率: 12.8, 未达标率: 24.5, 未闭环率: 18.9, 入径率: 82.4, 节点执行率: 76.8, 闭环率: 70.5, 血压控制率: 77.2, HbA1c达标率: 63.8, LDL达标率: 59.5 },
  linping:    { name: "临平区", 基档:  52800, 高危占比: 20.8, 确诊占比: 14.2, 专档在管: 19600, 未检测率: 11.6, 未达标率: 23.2, 未闭环率: 17.5, 入径率: 83.5, 节点执行率: 77.8, 闭环率: 71.5, 血压控制率: 78.2, HbA1c达标率: 64.5, LDL达标率: 60.2 },
  xihu:       { name: "西湖区", 基档:  72400, 高危占比: 18.8, 确诊占比: 12.6, 专档在管: 26800, 未检测率:  7.6, 未达标率: 18.9, 未闭环率: 13.8, 入径率: 88.2, 节点执行率: 82.5, 闭环率: 76.4, 血压控制率: 81.5, HbA1c达标率: 68.2, LDL达标率: 64.2 },
  gongshu:    { name: "拱墅区", 基档:  58200, 高危占比: 19.5, 确诊占比: 13.2, 专档在管: 21600, 未检测率:  9.8, 未达标率: 21.3, 未闭环率: 16.5, 入径率: 86.5, 节点执行率: 81.2, 闭环率: 74.8, 血压控制率: 79.8, HbA1c达标率: 66.5, LDL达标率: 62.4 },
  shangcheng: { name: "上城区", 基档:  42800, 高危占比: 17.2, 确诊占比: 11.8, 专档在管: 15400, 未检测率:  8.2, 未达标率: 19.5, 未闭环率: 14.2, 入径率: 89.5, 节点执行率: 84.2, 闭环率: 78.5, 血压控制率: 82.4, HbA1c达标率: 69.5, LDL达标率: 65.8 },
  qiantang:   { name: "钱塘区", 基档:  32400, 高危占比: 16.2, 确诊占比: 11.5, 专档在管: 11800, 未检测率:  8.8, 未达标率: 20.1, 未闭环率: 15.2, 入径率: 87.8, 节点执行率: 82.5, 闭环率: 75.8, 血压控制率: 80.5, HbA1c达标率: 67.2, LDL达标率: 63.5 },
  xiaoshan:   { name: "萧山区", 基档:  85400, 高危占比: 22.3, 确诊占比: 15.8, 专档在管: 32600, 未检测率: 13.5, 未达标率: 26.8, 未闭环率: 20.4, 入径率: 80.5, 节点执行率: 74.8, 闭环率: 68.2, 血压控制率: 75.8, HbA1c达标率: 62.5, LDL达标率: 58.2 },
  binjiang:   { name: "滨江区", 基档:  38600, 高危占比: 14.5, 确诊占比: 10.2, 专档在管: 12400, 未检测率:  6.4, 未达标率: 16.2, 未闭环率: 12.1, 入径率: 91.2, 节点执行率: 86.5, 闭环率: 81.2, 血压控制率: 85.2, HbA1c达标率: 72.4, LDL达标率: 68.5 },
}

// 余杭区 → 12 streets/towns (name matches embedded GeoJSON)
const yuhangData: Record<string, AreaData> = {
  wuchang:  { name: "五常街道", 基档:  7200, 高危占比: 19.5, 确诊占比: 13.5, 专档在管: 2800, 未检测率: 10.8, 未达标率: 23.2, 未闭环率: 18.1, 入径率: 83.2, 节点执行率: 77.5, 闭环率: 71.2, 血压控制率: 78.5, HbA1c达标率: 64.8, LDL达标率: 60.5 },
  renhe:    { name: "仁和街道", 基档:  5800, 高危占比: 24.2, 确诊占比: 17.2, 专档在管: 2200, 未检测率: 16.5, 未达标率: 29.8, 未闭环率: 23.5, 入径率: 72.4, 节点执行率: 66.8, 闭环率: 60.5, 血压控制率: 70.8, HbA1c达标率: 56.5, LDL达标率: 51.2 },
  xianlin:  { name: "闲林街道", 基档:  5400, 高危占比: 22.8, 确诊占比: 15.6, 专档在管: 2100, 未检测率: 14.2, 未达标率: 26.4, 未闭环率: 20.2, 入径率: 78.5, 节点执行率: 72.8, 闭环率: 66.5, 血压控制率: 74.2, HbA1c达标率: 61.0, LDL达标率: 56.8 },
  zhongtai: { name: "中泰街道", 基档:  4600, 高危占比: 25.8, 确诊占比: 18.5, 专档在管: 1750, 未检测率: 18.8, 未达标率: 33.2, 未闭环率: 26.4, 入径率: 68.5, 节点执行率: 62.2, 闭环率: 56.5, 血压控制率: 66.8, HbA1c达标率: 53.2, LDL达标率: 48.0 },
  yuhangJd: { name: "余杭街道", 基档:  8200, 高危占比: 20.5, 确诊占比: 14.2, 专档在管: 3100, 未检测率: 11.5, 未达标率: 22.8, 未闭环率: 17.4, 入径率: 82.5, 节点执行率: 76.2, 闭环率: 70.0, 血压控制率: 77.5, HbA1c达标率: 63.5, LDL达标率: 59.2 },
  liangzhu: { name: "良渚街道", 基档:  9200, 高危占比: 21.8, 确诊占比: 15.1, 专档在管: 3500, 未检测率: 13.2, 未达标率: 25.6, 未闭环率: 19.8, 入径率: 80.8, 节点执行率: 75.2, 闭环率: 68.8, 血压控制率: 75.5, HbA1c达标率: 62.2, LDL达标率: 58.0 },
  cangqian: { name: "仓前街道", 基档:  6800, 高危占比: 18.2, 确诊占比: 12.8, 专档在管: 2500, 未检测率:  9.8, 未达标率: 20.5, 未闭环率: 15.8, 入径率: 85.5, 节点执行率: 79.8, 闭环率: 73.5, 血压控制率: 80.2, HbA1c达标率: 66.5, LDL达标率: 62.5 },
  jingshan: { name: "径山镇",   基档:  3200, 高危占比: 27.5, 确诊占比: 19.8, 专档在管: 1200, 未检测率: 20.2, 未达标率: 36.5, 未闭环率: 28.8, 入径率: 65.8, 节点执行率: 59.5, 闭环率: 53.2, 血压控制率: 64.5, HbA1c达标率: 50.8, LDL达标率: 45.5 },
  pingyao:  { name: "瓶窑镇",   基档:  6500, 高危占比: 23.1, 确诊占比: 16.0, 专档在管: 2400, 未检测率: 17.4, 未达标率: 31.8, 未闭环率: 24.6, 入径率: 75.2, 节点执行率: 69.5, 闭环率: 63.1, 血压控制率: 72.5, HbA1c达标率: 59.2, LDL达标率: 54.8 },
  luniao:   { name: "鸬鸟镇",   基档:  2400, 高危占比: 31.2, 确诊占比: 22.5, 专档在管:  900, 未检测率: 26.4, 未达标率: 42.8, 未闭环率: 34.5, 入径率: 58.4, 节点执行率: 52.5, 闭环率: 46.8, 血压控制率: 57.2, HbA1c达标率: 44.5, LDL达标率: 39.8 },
  baixue:   { name: "百丈镇",   基档:  2800, 高危占比: 29.8, 确诊占比: 21.4, 专档在管: 1050, 未检测率: 24.5, 未达标率: 40.2, 未闭环率: 32.8, 入径率: 60.5, 节点执行率: 54.2, 闭环率: 48.5, 血压控制率: 59.2, HbA1c达标率: 46.2, LDL达标率: 41.2 },
  huanghu:  { name: "黄湖镇",   基档:  3800, 高危占比: 28.5, 确诊占比: 20.2, 专档在管: 1400, 未检测率: 22.8, 未达标率: 38.5, 未闭环率: 30.2, 入径率: 62.8, 节点执行率: 56.5, 闭环率: 50.2, 血压控制率: 61.5, HbA1c达标率: 47.8, LDL达标率: 42.5 },
}

// Trend data
const trendData = [
  { m: "1月", bp: 68.2, hba: 55.4, ldl: 48.6 },
  { m: "2月", bp: 69.5, hba: 56.2, ldl: 49.8 },
  { m: "3月", bp: 71.2, hba: 57.8, ldl: 51.4 },
  { m: "4月", bp: 72.8, hba: 58.5, ldl: 52.8 },
  { m: "5月", bp: 74.1, hba: 59.8, ldl: 54.2 },
  { m: "6月", bp: 75.6, hba: 61.2, ldl: 55.8 },
  { m: "7月", bp: 76.8, hba: 62.5, ldl: 57.2 },
  { m: "8月", bp: 77.2, hba: 63.1, ldl: 58.4 },
]

// ─── Name-keyed value builders ────────────────────────────────────────────────
// DataV map labels are Chinese names; build Record<chineseName, metricValue>

function toNamedValues(
  data: Record<string, AreaData>,
  key: keyof AreaData
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const d of Object.values(data)) {
    out[d.name] = d[key] as number
  }
  return out
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  return n.toLocaleString()
}

function sortAll(data: Record<string, AreaData>, key: keyof AreaData) {
  return Object.values(data)
    .sort((a, b) => (b[key] as number) - (a[key] as number))
    .map(d => ({ name: d.name, value: d[key] as number }))
}

// ─── UI Components ────────────────────────────────────────────────────────────

function KPICard({
  label, value, unit, change1, change2, valueColor, borderColor, icon,
}: {
  label: string; value: string; unit?: string; change1?: string; change2?: string
  valueColor: string; borderColor?: string; icon?: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl px-5 py-4 flex gap-4 items-center border"
      style={{ background: "rgba(11,30,61,0.92)", borderColor: borderColor || "rgba(30,80,180,0.4)" }}
    >
      {icon && (
        <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium mb-1" style={{ color: "rgba(148,163,184,0.7)" }}>{label}</div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold" style={{ color: valueColor, fontFamily: "var(--font-num)" }}>{value}</span>
          {unit && <span className="text-base font-medium" style={{ color: valueColor }}>{unit}</span>}
        </div>
        <div className="flex gap-3 mt-1.5 flex-wrap">
          {change1 && <span className="text-xs" style={{ color: change1.includes("↑") || change1.includes("+") ? "#f87171" : "#4ade80" }}>{change1}</span>}
          {change2 && <span className="text-xs" style={{ color: "rgba(148,163,184,0.55)" }}>{change2}</span>}
        </div>
      </div>
    </div>
  )
}

function Ring({ label, value, color }: { label: string; value: number; color: string }) {
  const r = 50, circ = 2 * Math.PI * r, dash = (value / 100) * circ
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 140 140" className="w-full h-full rotate-[-90deg]">
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(20,50,120,0.5)" strokeWidth="10"/>
          <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-num)" }}>{value}%</span>
        </div>
      </div>
      <span className="text-sm font-medium text-center" style={{ color: "rgba(148,163,184,0.85)" }}>{label}</span>
    </div>
  )
}

function HorizBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-28 text-right shrink-0" style={{ color: "rgba(148,163,184,0.8)" }}>{label}</span>
      <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: "rgba(20,50,120,0.35)" }}>
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }}/>
      </div>
      <span className="text-sm font-semibold w-12 shrink-0" style={{ color, fontFamily: "var(--font-num)" }}>{value}%</span>
    </div>
  )
}

const RANK_COLORS = ["#dc2626", "#ea580c", "#d97706", "#65a30d", "#0891b2"]

function AlertList({ title, metricLabel, items }: { title: string; metricLabel: string; items: { name: string; value: number }[] }) {
  const maxVal = Math.max(...items.map(d => d.value), 0.01)
  return (
    <div
      className="rounded-xl border overflow-hidden flex flex-col flex-1 min-h-0"
      style={{ background: "rgba(8,20,48,0.95)", borderColor: "rgba(220,38,38,0.2)" }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center justify-between shrink-0 border-b"
        style={{ borderColor: "rgba(220,38,38,0.15)", background: "rgba(220,38,38,0.07)" }}
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444"><path d="M12 2C8.5 6 6 9 6 13a6 6 0 0012 0c0-4-2.5-7-6-11z"/></svg>
          <span className="text-sm font-semibold text-red-400">{title}</span>
        </div>
        <span className="text-xs" style={{ color: "rgba(100,116,139,0.5)" }}>››</span>
      </div>
      {/* Column headers */}
      <div className="grid px-3 py-1.5 shrink-0" style={{ gridTemplateColumns: "30px 1fr 80px 60px", gap: "0 8px" }}>
        <span className="text-xs" style={{ color: "rgba(100,116,139,0.55)", width: 30 }}>排名</span>
        <span className="text-xs" style={{ color: "rgba(100,116,139,0.55)", width: 30 }}>地区</span>
        <span/>
        <span className="text-xs text-right" style={{ color: "rgba(100,116,139,0.55)", width: 60 }}>{metricLabel}</span>
      </div>
      {/* Rows — scrollable */}
      <div className="flex flex-col flex-1 overflow-y-auto">
        {items.map((item, i) => (
          <div
            key={item.name}
            className="grid items-center px-3 py-2 border-t"
            style={{ gridTemplateColumns: "30px 1fr 80px 60px", gap: "0 8px", borderColor: "rgba(30,60,120,0.2)" }}
          >
            <span
              className="text-xs font-bold w-5 h-5 rounded flex items-center justify-center"
              style={{ background: RANK_COLORS[i] + "28", color: RANK_COLORS[i], border: `1px solid ${RANK_COLORS[i]}50` }}
            >
              {i + 1}
            </span>
            <span className="text-xs text-slate-300 truncate">{item.name}</span>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(30,60,120,0.4)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${(item.value / maxVal) * 100}%`, background: `linear-gradient(to right, ${RANK_COLORS[i]}99, ${RANK_COLORS[i]})` }}
              />
            </div>
            <span className="text-xs font-semibold text-right" style={{ color: RANK_COLORS[i], fontFamily: "var(--font-num)" }}>
              {item.value.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Trend Chart ──────────────────────────────────────────────────────────────

function TrendChart() {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const W = 640, H = 260, pL = 42, pR = 16, pT = 16, pB = 36
  const cW = W - pL - pR, cH = H - pT - pB
  const yMin = 44, yMax = 82
  const xStep = cW / (trendData.length - 1)
  const toX = (i: number) => pL + i * xStep
  const toY = (v: number) => pT + cH - ((v - yMin) / (yMax - yMin)) * cH
  const series = [
    { key: "bp" as const,  label: "血压控制率",  color: "#60a5fa" },
    { key: "hba" as const, label: "HbA1c达标率", color: "#fbbf24" },
    { key: "ldl" as const, label: "LDL-C达标率", color: "#34d399" },
  ]
  const pathD = (key: "bp" | "hba" | "ldl") =>
    trendData.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(d[key]).toFixed(1)}`).join(" ")
  const areaD = (key: "bp" | "hba" | "ldl") =>
    trendData.map((d, i) => `${toX(i).toFixed(1)},${toY(d[key]).toFixed(1)}`).join(" ") +
    ` ${toX(trendData.length - 1).toFixed(1)},${(pT + cH).toFixed(1)} ${toX(0).toFixed(1)},${(pT + cH).toFixed(1)}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" onMouseLeave={() => setHoverIdx(null)}>
      <defs>
        {series.map(s => (
          <linearGradient key={s.key} id={`tg-${s.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.2"/>
            <stop offset="100%" stopColor={s.color} stopOpacity="0"/>
          </linearGradient>
        ))}
      </defs>
      {[50, 60, 70, 80].map(v => (
        <g key={v}>
          <line x1={pL} y1={toY(v)} x2={W - pR} y2={toY(v)} stroke="rgba(30,58,138,0.35)" strokeWidth="1" strokeDasharray="4,4"/>
          <text x={pL - 6} y={toY(v) + 4} textAnchor="end" fill="rgba(100,116,139,0.7)" fontSize="10" style={{ fontFamily: "var(--font-num)" }}>{v}</text>
        </g>
      ))}
      {series.map(s => <polygon key={s.key} points={areaD(s.key)} fill={`url(#tg-${s.key})`}/>)}
      {series.map(s => <path key={s.key} d={pathD(s.key)} fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"/>)}
      {hoverIdx !== null && (
        <line x1={toX(hoverIdx)} y1={pT} x2={toX(hoverIdx)} y2={pT + cH} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3,2"/>
      )}
      {hoverIdx !== null && series.map(s => (
        <circle key={s.key} cx={toX(hoverIdx)} cy={toY(trendData[hoverIdx][s.key])} r="4" fill={s.color} stroke="#050e1f" strokeWidth="2"/>
      ))}
      {trendData.map((d, i) => (
        <text key={i} x={toX(i)} y={H - 8} textAnchor="middle" fill="rgba(100,116,139,0.7)" fontSize="10">{d.m}</text>
      ))}
      {trendData.map((_, i) => (
        <rect key={i} x={toX(i) - xStep / 2} y={pT} width={xStep} height={cH} fill="transparent" onMouseEnter={() => setHoverIdx(i)}/>
      ))}
      {series.map((s, i) => (
        <g key={s.key} transform={`translate(${pL + i * 175},${H - 10})`}>
          <line x1="0" y1="-5" x2="14" y2="-5" stroke={s.color} strokeWidth="2" strokeLinecap="round"/>
          <text x="18" y="-1" fill="rgba(148,163,184,0.75)" fontSize="10">{s.label}</text>
        </g>
      ))}
    </svg>
  )
}

// ─── Color legend ─────────────────────────────────────────────────────────────

function MapLegend({ leftLabel, rightLabel }: { leftLabel: string; rightLabel: string }) {
  return (
    <div className="flex items-center gap-2" style={{ minWidth: 160 }}>
      <span className="text-xs" style={{ color: "rgba(100,116,139,0.6)" }}>{leftLabel}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "linear-gradient(to right,#0f2d6b,#1d4ed8,#3b82f6,#f97316,#dc2626)" }}/>
      <span className="text-xs" style={{ color: "rgba(100,116,139,0.6)" }}>{rightLabel}</span>
    </div>
  )
}

// ─── MapCard wrapper ──────────────────────────────────────────────────────────

function MapCard({
  title, children, metricToggle, legend,
}: {
  title: string
  children: React.ReactNode
  metricToggle?: React.ReactNode
  legend?: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl border flex flex-col overflow-hidden"
      style={{ background: "rgba(7,18,42,0.85)", borderColor: "rgba(30,80,180,0.3)" }}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-1 shrink-0">
        <span className="text-sm font-medium text-slate-300">{title}</span>
        {metricToggle}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
      {legend}
    </div>
  )
}

// ─── Tab 1: Overview ──────────────────────────────────────────────────────────

// KPI icon components
const IconArchive = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8"/><path d="M10 12h4"/>
  </svg>
)
const IconShield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L4 6v6c0 5.25 3.5 9.74 8 11 4.5-1.26 8-5.75 8-11V6l-8-4z"/><path d="M12 8v4m0 4h.01"/>
  </svg>
)
const IconHeart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    <polyline points="8 12 10 14 16 8"/>
  </svg>
)
const IconClipboard = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
)

function OverviewTab() {
  const [metric, setMetric] = useState<OverviewMetric>("高危占比")
  const [mapLevel, setMapLevel] = useState<MapLevel>("province")

  const totals = {
    province: { 基档: 28818000, 高危占比: 21.2, 确诊占比: 14.8, 专档在管: 10752000 },
    city:     { 基档: Object.values(hangzhouData).reduce((s, d) => s + d.基档, 0), 高危占比: 19.8, 确诊占比: 13.5, 专档在管: 185600 },
    streets:  { 基档: Object.values(yuhangData).reduce((s, d) => s + d.基档, 0), 高危占比: 21.6, 确诊占比: 14.9, 专档在管: 25800 },
  }
  const t = totals[mapLevel]

  const alertData = mapLevel === "province" ? citiesData : mapLevel === "city" ? hangzhouData : yuhangData

  const allVals = useMemo<LevelValues>(() => ({
    province: toNamedValues(citiesData, metric),
    city:     toNamedValues(hangzhouData, metric),
    streets:  toNamedValues(yuhangData, metric),
  }), [metric])

  const allMinMax = useMemo(() => {
    const all = [
      ...Object.values(citiesData),
      ...Object.values(hangzhouData),
      ...Object.values(yuhangData),
    ].map(d => d[metric] as number)
    return { min: Math.min(...all), max: Math.max(...all) }
  }, [metric])

  return (
    <div className="flex flex-col h-full gap-2.5 p-3 pb-2">
      {/* KPI row — ~17% height */}
      <div className="grid grid-cols-4 gap-3 shrink-0">
        <KPICard
          label="公卫基档管理人群数"
          value={fmtNum(t.基档)} unit="人"
          change1="环比 ↑ 2.35%"
          change2={`较上月 +${fmtNum(Math.round(t.基档 * 0.023))}人`}
          valueColor="#60a5fa"
          icon={<IconArchive/>}
        />
        <KPICard
          label="高危人群占比"
          value={`${t.高危占比.toFixed(2)}`} unit="%"
          change1="环比 ↑ 0.68 个百分点"
          valueColor="#fb923c"
          borderColor="rgba(194,65,12,0.45)"
          icon={<IconShield/>}
        />
        <KPICard
          label="两/三慢确诊占比"
          value={`${t.确诊占比.toFixed(2)}`} unit="%"
          change1="环比 ↑ 0.92 个百分点"
          valueColor="#f87171"
          borderColor="rgba(185,28,28,0.45)"
          icon={<IconHeart/>}
        />
        <KPICard
          label="专档在管人数"
          value={fmtNum(t.专档在管)} unit="人"
          change1="环比 ↓ 1.48%"
          change2={`较上月 -${fmtNum(Math.round(t.专档在管 * 0.015))}人`}
          valueColor="#4ade80"
          borderColor="rgba(21,128,61,0.45)"
          icon={<IconClipboard/>}
        />
      </div>

      {/* Map + Alert panel — flex-1, 55/45 split matching PathTab */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Map — 55% */}
        <div className="rounded-xl border flex flex-col overflow-hidden" style={{ flex: "0 0 55%", background: "rgba(7,18,42,0.88)", borderColor: "rgba(30,80,180,0.3)" }}>
          <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-blue-500 inline-block"/>
              <span className="text-sm font-semibold text-slate-200">人群占比热力地图</span>
              <span className="text-xs" style={{ color: "rgba(100,116,139,0.6)" }}>（默认高危占比，可切换确诊占比）</span>
            </div>
            <div className="flex gap-1 rounded-lg p-1" style={{ background: "rgba(11,30,61,0.8)", border: "1px solid rgba(30,80,180,0.25)" }}>
              {(["高危占比", "确诊占比"] as OverviewMetric[]).map(m => (
                <button key={m} className={`text-xs px-3 py-1 rounded-md transition-all font-medium ${metric === m ? "bg-blue-700 text-white" : "text-slate-400 hover:text-white"}`} onClick={() => setMetric(m)}>{m}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <EChartsMap
              values={allVals}
              metricLabel={metric}
              min={allMinMax.min}
              max={allMinMax.max}
              drillDown
              onLevelChange={setMapLevel}
            />
          </div>
          <div className="px-4 pb-2 shrink-0 flex items-center justify-between">
            <span className="text-xs" style={{ color: "rgba(71,85,105,0.6)" }}>数据说明：基于各地上报数据计算</span>
            <MapLegend leftLabel="低风险" rightLabel="高风险"/>
          </div>
        </div>

        {/* Alert panel — flex-1, 3 lists stacked */}
        <div className="flex-1 flex flex-col gap-2.5 min-h-0 min-w-0">
          <AlertList title="未检测率" metricLabel="未检测率" items={sortAll(alertData, "未检测率")}/>
          <AlertList title="未达标率" metricLabel="未达标率" items={sortAll(alertData, "未达标率")}/>
          <AlertList title="未闭环率" metricLabel="未闭环率" items={sortAll(alertData, "未闭环率")}/>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 text-right text-xs" style={{ color: "rgba(71,85,105,0.5)" }}>
        浙江省常住人口：6,677万人（统计局）
      </div>
    </div>
  )
}

// ─── Tab 2: Medical-Prevention Integration ────────────────────────────────────

const PATH_STEPS = [
  { label: "入径", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  { label: "检测", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11m0 0H5m4 0h4m4-11v11m0 0h-4m4 0h1a2 2 0 002-2V9"/></svg> },
  { label: "随访", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/></svg> },
  { label: "转诊", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6m-3-3l3 3-3 3"/></svg> },
  { label: "闭环", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
]

const RING_DEFS = [
  { label: "入径率",   value: 78.64, change: "↑ 2.18%", color: "#3b82f6", borderColor: "rgba(59,130,246,0.4)",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  { label: "节点执行率", value: 65.32, change: "↑ 1.47%", color: "#22c55e", borderColor: "rgba(34,197,94,0.35)",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg> },
  { label: "闭环率",   value: 52.18, change: "↑ 1.92%", color: "#f59e0b", borderColor: "rgba(245,158,11,0.45)",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
]

const DETECT_BARS = [
  { label: "血压检测率",   value: 82.36, color: "#3b82f6", valueColor: "#e2e8f0",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { label: "HbA1c检测率", value: 48.71, color: "#3b82f6", valueColor: "#f97316",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round"><path d="M12 22a7 7 0 007-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 007 7z"/></svg> },
  { label: "LDL-C检测率", value: 74.52, color: "#3b82f6", valueColor: "#e2e8f0",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8m-4-4v8"/></svg> },
]

function PathRingCard({ label, value, change, color, borderColor, icon }: typeof RING_DEFS[0]) {
  const r = 44, circ = 2 * Math.PI * r, dash = (value / 100) * circ
  return (
    <div className="rounded-xl border flex items-center gap-5 px-6 py-5" style={{ background: "rgba(8,20,52,0.95)", borderColor }}>
      {/* Ring with icon */}
      <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
        <svg viewBox="0 0 100 100" width="100" height="100">
          <circle cx="50" cy="50" r={r} fill="rgba(30,58,138,0.2)" stroke="rgba(30,58,138,0.35)" strokeWidth="8"/>
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 50 50)"/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center rounded-full"
             style={{ background: `${color}18` }}>
          {icon}
        </div>
      </div>
      {/* Text */}
      <div>
        <div className="text-sm font-medium mb-1" style={{ color: "rgba(148,163,184,0.8)" }}>{label}</div>
        <div className="text-4xl font-bold" style={{ color, fontFamily: "var(--font-num)" }}>
          {value.toFixed(2)}<span className="text-2xl">%</span>
        </div>
        <div className="text-xs mt-1.5" style={{ color: "rgba(148,163,184,0.6)" }}>
          环比 <span className="text-red-400 font-semibold">{change}</span>
        </div>
      </div>
    </div>
  )
}

function PathTab() {
  const [mapMetric, setMapMetric] = useState<"入径率" | "节点执行率" | "闭环率">("闭环率")

  const mapVals = useMemo<LevelValues>(() => ({
    province: toNamedValues(citiesData, mapMetric),
    city:     toNamedValues(hangzhouData, mapMetric),
    streets:  toNamedValues(yuhangData, mapMetric),
  }), [mapMetric])

  const minVal = Math.min(...Object.values(citiesData).map(d => d[mapMetric]))
  const maxVal = Math.max(...Object.values(citiesData).map(d => d[mapMetric]))

  return (
    <div className="flex flex-col h-full gap-0 overflow-hidden" style={{ padding: "10px 12px 8px" }}>

      {/* Sub-header: title + step flow */}
      <div className="flex items-center justify-between mb-2.5 shrink-0">
        <div className="flex items-baseline gap-3">
          <span className="text-base font-bold text-blue-400">医防融合路径执行</span>
          <span className="text-xs" style={{ color: "rgba(100,116,139,0.65)" }}>患者捞出来之后，管理路径到底走没走？卡在哪一步？</span>
        </div>
        {/* Step flow indicator */}
        <div className="flex items-center gap-1 shrink-0">
          {PATH_STEPS.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium"
                   style={{ background: "rgba(11,30,61,0.8)", borderColor: "rgba(59,130,246,0.35)", color: "rgba(148,163,184,0.85)" }}>
                <span style={{ color: "#60a5fa" }}>{s.icon}</span>
                {s.label}
              </div>
              {i < PATH_STEPS.length - 1 && (
                <span className="text-xs font-bold" style={{ color: "rgba(59,130,246,0.5)" }}>››</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3 ring cards */}
      <div className="grid grid-cols-3 gap-3 shrink-0 mb-2.5">
        {RING_DEFS.map(r => <PathRingCard key={r.label} {...r}/>)}
      </div>

      {/* Map (left 55%) + Right panel (45%) */}
      <div className="flex-1 flex gap-3 min-h-0">

        {/* Map */}
        <div className="rounded-xl border flex flex-col overflow-hidden" style={{ flex: "0 0 55%", background: "rgba(7,18,42,0.88)", borderColor: "rgba(30,80,180,0.3)" }}>
          <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-blue-500 inline-block"/>
              <span className="text-sm font-semibold text-slate-200">路径执行风险热力图</span>
            </div>
            <div className="flex gap-1 rounded-lg p-1" style={{ background: "rgba(11,30,61,0.8)", border: "1px solid rgba(30,80,180,0.25)" }}>
              {(["入径率", "节点执行率", "闭环率"] as const).map(m => (
                <button key={m} className={`text-xs px-3 py-1 rounded-md transition-all font-medium ${mapMetric === m ? "bg-blue-700 text-white" : "text-slate-400 hover:text-white"}`} onClick={() => setMapMetric(m)}>{m}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <EChartsMap values={mapVals} metricLabel={mapMetric} min={minVal} max={maxVal} inverse drillDown/>
          </div>
          <div className="px-4 pb-2 shrink-0 flex items-center justify-between">
            <span className="text-xs" style={{ color: "rgba(71,85,105,0.6)" }}>数据说明：基于各地医疗机构上报数据计算</span>
            <MapLegend leftLabel="执行佳" rightLabel="需督导"/>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">

          {/* 三项核心检测率 */}
          <div className="rounded-xl border px-5 py-4 shrink-0" style={{ background: "rgba(8,20,52,0.95)", borderColor: "rgba(30,80,180,0.3)" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-4 rounded-full bg-blue-500 inline-block"/>
              <span className="text-sm font-semibold text-slate-200">三项核心检测率</span>
            </div>
            <div className="flex flex-col gap-4">
              {DETECT_BARS.map(b => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="shrink-0">{b.icon}</span>
                  <span className="text-sm w-24 shrink-0" style={{ color: "rgba(148,163,184,0.85)" }}>{b.label}</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(30,58,138,0.35)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${b.value}%`, background: "linear-gradient(to right, #1d4ed8, #3b82f6)" }}/>
                  </div>
                  <span className="text-sm font-bold w-14 text-right shrink-0" style={{ color: b.valueColor, fontFamily: "var(--font-num)" }}>{b.value.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* 面对面随访人次数 + 健康处方打印人次数 */}
          <div className="rounded-xl border shrink-0 flex overflow-hidden" style={{ background: "rgba(8,20,52,0.95)", borderColor: "rgba(30,80,180,0.3)" }}>
            {/* 面对面随访 */}
            <div className="flex items-center gap-4 px-5 py-4 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium mb-1" style={{ color: "rgba(148,163,184,0.7)" }}>面对面随访人次数</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-num)" }}>125.87</span>
                  <span className="text-sm" style={{ color: "rgba(148,163,184,0.7)" }}>万人次</span>
                </div>
              </div>
            </div>
            {/* 健康处方打印 */}
            <div className="flex items-center gap-4 px-5 py-4 flex-1 min-w-0 border-l" style={{ borderColor: "rgba(30,80,180,0.25)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium mb-1" style={{ color: "rgba(148,163,184,0.7)" }}>健康处方打印人次数</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold" style={{ color: "#4ade80", fontFamily: "var(--font-num)" }}>98.43</span>
                  <span className="text-sm" style={{ color: "rgba(148,163,184,0.7)" }}>万人次</span>
                </div>
              </div>
            </div>
          </div>

          {/* 转诊情况 */}
          <div className="flex-1 rounded-xl border px-5 py-4 flex flex-col min-h-0" style={{ background: "rgba(8,20,52,0.95)", borderColor: "rgba(30,80,180,0.3)" }}>
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <span className="w-1 h-4 rounded-full bg-blue-500 inline-block"/>
              <span className="text-sm font-semibold text-slate-200">转诊情况</span>
            </div>
            <div className="flex-1 flex gap-0 min-h-0">
              {/* 有效转诊人次数 */}
              <div className="flex-1 flex items-center gap-4 pr-5 border-r" style={{ borderColor: "rgba(30,80,180,0.25)" }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>
                  </svg>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "rgba(148,163,184,0.65)" }}>有效转诊人次数</div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-num)" }}>456,812</span>
                    <span className="text-sm" style={{ color: "rgba(148,163,184,0.65)" }}>人次</span>
                  </div>
                </div>
              </div>
              {/* 有效转诊率 */}
              <div className="flex-1 flex items-center gap-4 pl-5">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.3)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="1.8" strokeLinecap="round">
                    <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/>
                    <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
                  </svg>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "rgba(148,163,184,0.65)" }}>有效转诊率</div>
                  <div className="text-2xl font-bold" style={{ color: "#2dd4bf", fontFamily: "var(--font-num)" }}>36.21%</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.55)" }}>
                    环比 <span className="text-red-400 font-semibold">↑ 1.36%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── Tab 3: Management Effect ─────────────────────────────────────────────────

const EFFECT_RING_DEFS = [
  { label: "血压控制率",  value: 77.2, change: "↑ +4.8pp", color: "#3b82f6", borderColor: "rgba(59,130,246,0.4)",
    sub: "最近一次 <140/90mmHg",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { label: "HbA1c 达标率", value: 63.1, change: "↑ +6.2pp", color: "#f59e0b", borderColor: "rgba(245,158,11,0.45)",
    sub: "最近一次 <7.0%",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.6" strokeLinecap="round"><path d="M12 22a7 7 0 007-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 007 7z"/></svg> },
  { label: "LDL-C 达标率", value: 58.4, change: "↑ +5.3pp", color: "#22c55e", borderColor: "rgba(34,197,94,0.35)",
    sub: "按风险分层达标",
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8m-4-4v8"/></svg> },
]

const EFFECT_BARS = [
  { label: "血压控制率",   value: 77.2, color: "#3b82f6",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  { label: "HbA1c 达标率", value: 63.1, color: "#f59e0b",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><path d="M12 22a7 7 0 007-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 007 7z"/></svg> },
  { label: "LDL-C 达标率", value: 58.4, color: "#22c55e",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8m-4-4v8"/></svg> },
]

function EffectRingCard({ label, value, change, color, borderColor, icon, sub }: typeof EFFECT_RING_DEFS[0]) {
  const r = 44, circ = 2 * Math.PI * r, dash = (value / 100) * circ
  return (
    <div className="rounded-xl border flex items-center gap-5 px-6 py-5" style={{ background: "rgba(8,20,52,0.95)", borderColor }}>
      <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
        <svg viewBox="0 0 100 100" width="100" height="100">
          <circle cx="50" cy="50" r={r} fill="rgba(30,58,138,0.2)" stroke="rgba(30,58,138,0.35)" strokeWidth="8"/>
          <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 50 50)"/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center rounded-full" style={{ background: `${color}18` }}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-sm font-medium mb-1" style={{ color: "rgba(148,163,184,0.8)" }}>{label}</div>
        <div className="text-4xl font-bold" style={{ color, fontFamily: "var(--font-num)" }}>
          {value.toFixed(1)}<span className="text-2xl">%</span>
        </div>
        <div className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.55)" }}>{sub}</div>
        <div className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.6)" }}>
          较去年 <span className="text-green-400 font-semibold">{change}</span>
        </div>
      </div>
    </div>
  )
}

function EffectTab() {
  const [mapMetric, setMapMetric] = useState<"血压控制率" | "HbA1c达标率" | "LDL达标率">("血压控制率")

  const mapVals = useMemo<LevelValues>(() => ({
    province: toNamedValues(citiesData, mapMetric),
    city:     toNamedValues(hangzhouData, mapMetric),
    streets:  toNamedValues(yuhangData, mapMetric),
  }), [mapMetric])

  const minVal = Math.min(...Object.values(citiesData).map(d => d[mapMetric]))
  const maxVal = Math.max(...Object.values(citiesData).map(d => d[mapMetric]))

  return (
    <div className="flex flex-col h-full gap-0 overflow-hidden" style={{ padding: "10px 12px 8px" }}>

      {/* Sub-header */}
      <div className="flex items-center justify-between mb-2.5 shrink-0">
        <div className="flex items-baseline gap-3">
          <span className="text-base font-bold text-blue-400">管理效果评估</span>
          <span className="text-xs" style={{ color: "rgba(100,116,139,0.65)" }}>慢病患者的核心指标是否真正得到了控制？</span>
        </div>
        <div className="flex items-center gap-2 text-xs shrink-0" style={{ color: "rgba(100,116,139,0.6)" }}>
          <span>数据周期：2026年1月—8月</span>
          <span style={{ color: "rgba(30,80,180,0.5)" }}>·</span>
          <span>来源：浙江省公卫信息系统</span>
        </div>
      </div>

      {/* 3 ring cards */}
      <div className="grid grid-cols-3 gap-3 shrink-0 mb-2.5">
        {EFFECT_RING_DEFS.map(r => <EffectRingCard key={r.label} {...r}/>)}
      </div>

      {/* Map (55%) + Right panel (45%) */}
      <div className="flex-1 flex gap-3 min-h-0">

        {/* Map */}
        <div className="rounded-xl border flex flex-col overflow-hidden" style={{ flex: "0 0 55%", background: "rgba(7,18,42,0.88)", borderColor: "rgba(30,80,180,0.3)" }}>
          <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-blue-500 inline-block"/>
              <span className="text-sm font-semibold text-slate-200">达标率分布热力图</span>
            </div>
            <div className="flex gap-1 rounded-lg p-1" style={{ background: "rgba(11,30,61,0.8)", border: "1px solid rgba(30,80,180,0.25)" }}>
              {(["血压控制率", "HbA1c达标率", "LDL达标率"] as const).map(m => (
                <button key={m}
                  className={`text-xs px-3 py-1 rounded-md transition-all font-medium ${mapMetric === m ? "bg-blue-700 text-white" : "text-slate-400 hover:text-white"}`}
                  onClick={() => setMapMetric(m)}>
                  {m === "血压控制率" ? "血压" : m === "HbA1c达标率" ? "HbA1c" : "LDL"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <EChartsMap values={mapVals} metricLabel={mapMetric} min={minVal} max={maxVal} inverse drillDown/>
          </div>
          <div className="px-4 pb-2 shrink-0 flex items-center justify-between">
            <span className="text-xs" style={{ color: "rgba(71,85,105,0.6)" }}>数据说明：基于各地医疗机构上报数据计算</span>
            <MapLegend leftLabel="达标优" rightLabel="需改善"/>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 min-w-0">

          {/* 三项达标率 bars */}
          <div className="rounded-xl border px-5 py-4 shrink-0" style={{ background: "rgba(8,20,52,0.95)", borderColor: "rgba(30,80,180,0.3)" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-4 rounded-full bg-blue-500 inline-block"/>
              <span className="text-sm font-semibold text-slate-200">三项核心达标率</span>
            </div>
            <div className="flex flex-col gap-4">
              {EFFECT_BARS.map(b => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="shrink-0">{b.icon}</span>
                  <span className="text-sm w-24 shrink-0" style={{ color: "rgba(148,163,184,0.85)" }}>{b.label}</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(30,58,138,0.35)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${b.value}%`, background: `linear-gradient(to right, #1d4ed8, ${b.color})` }}/>
                  </div>
                  <span className="text-sm font-bold w-14 text-right shrink-0" style={{ color: b.color, fontFamily: "var(--font-num)" }}>{b.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* 转诊后改善率 */}
          <div className="rounded-xl border px-5 py-4 flex items-center gap-5 shrink-0" style={{ background: "rgba(8,20,52,0.95)", borderColor: "rgba(30,80,180,0.3)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(192,132,252,0.15)", border: "1px solid rgba(192,132,252,0.3)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium mb-1" style={{ color: "rgba(148,163,184,0.7)" }}>转诊后改善率</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold" style={{ color: "#c084fc", fontFamily: "var(--font-num)" }}>84.6%</span>
                <span className="text-sm text-green-400 font-semibold">↑ 较去年 +2.1pp</span>
              </div>
              <div className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.5)" }}>关键指标综合改善</div>
            </div>
          </div>

          {/* 趋势 */}
          <div className="flex-1 rounded-xl border px-5 py-4 flex flex-col min-h-0" style={{ background: "rgba(8,20,52,0.95)", borderColor: "rgba(30,80,180,0.3)" }}>
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <span className="w-1 h-4 rounded-full bg-blue-500 inline-block"/>
              <span className="text-sm font-semibold text-slate-200">三项达标率趋势（2026年）</span>
              <span className="text-xs ml-1" style={{ color: "rgba(100,116,139,0.6)" }}>按月统计 · 单位：%</span>
            </div>
            <div className="flex-1 min-h-0">
              <TrendChart/>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState<Tab>("overview")

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "总览" },
    { id: "pathway",  label: "医防融合" },
    { id: "effect",   label: "管理效果" },
  ]

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ background: "#050e1f", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-2.5 shrink-0 border-b" style={{ borderColor: "rgba(30,80,180,0.3)", background: "rgba(5,12,30,0.95)" }}>
        <div className="flex items-center gap-3">
          <img src={logoSvg} alt="logo" className="w-7 h-7 shrink-0"/>
          <div className="text-lg font-bold text-white tracking-wide" style={{ fontFamily: "'Alimama ShuHeiTi', 'PingFang SC', sans-serif", fontWeight: 600 }}>浙江省慢病管理驾驶舱</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"/>
            </span>
            <span className="text-xs" style={{ color: "rgba(100,116,139,0.7)" }}>实时</span>
          </div>

          <div className="flex gap-1 rounded-xl p-1" style={{ background: "rgba(11,30,61,0.9)", border: "1px solid rgba(30,80,180,0.3)" }}>
            {tabs.map(t => (
              <button
                key={t.id}
                className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-blue-700 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
                onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-right" style={{ color: "rgba(100,116,139,0.6)" }}>
            <div>数据截至</div>
            <div className="text-slate-300 font-medium" style={{ fontFamily: "var(--font-num)" }}>2026-08-26</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === "overview" && <OverviewTab/>}
        {tab === "pathway" && <PathTab/>}
        {tab === "effect"  && <EffectTab/>}
      </div>
    </div>
  )
}
