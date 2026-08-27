import { useEffect, useRef, useState, useCallback } from "react"
import * as echarts from "echarts"
import yuhangGeo from "../data/yuhangStreets.json"

// ─── Types ────────────────────────────────────────────────────────────────────

export type MapLevel = "province" | "city" | "streets"

interface NavItem {
  name: string
  level: MapLevel
}

// ─── DataV fetch with cache ───────────────────────────────────────────────────

const DATAV = "https://geo.datav.aliyun.com/areas_v3/bound"
const geoCache: Record<string, unknown> = {
  streets: yuhangGeo,
}

async function fetchGeo(adcode: string, full = false): Promise<unknown> {
  const url = `${DATAV}/${adcode}${full ? "_full" : ""}.json`
  if (geoCache[url]) return geoCache[url]
  const res = await fetch(url)
  if (!res.ok) throw new Error(`DataV HTTP ${res.status} (${url})`)
  const data = await res.json()
  geoCache[url] = data
  return data
}

// ─── Name → value lookup ──────────────────────────────────────────────────────

export interface LevelValues {
  province: Record<string, number>
  city: Record<string, number>
  streets: Record<string, number>
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EChartsMapProps {
  values: LevelValues
  metricLabel: string
  min: number
  max: number
  inverse?: boolean
  drillDown?: boolean
  onLevelChange?: (level: MapLevel) => void
}

const HEAT_COLORS = ["#0f2d6b", "#1d4ed8", "#3b82f6", "#fbbf24", "#f97316", "#dc2626"]
const HEAT_COLORS_INV = [...HEAT_COLORS].reverse()

export default function EChartsMap({
  values,
  metricLabel,
  min,
  max,
  inverse = false,
  drillDown = false,
  onLevelChange,
}: EChartsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const [stack, setStack] = useState<NavItem[]>([{ name: "浙江省", level: "province" }])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Keep latest refs to avoid stale closures
  const stackRef = useRef(stack)
  stackRef.current = stack
  const valuesRef = useRef(values)
  valuesRef.current = values
  const metricLabelRef = useRef(metricLabel)
  metricLabelRef.current = metricLabel
  const minRef = useRef(min)
  minRef.current = min
  const maxRef = useRef(max)
  maxRef.current = max
  const inverseRef = useRef(inverse)
  inverseRef.current = inverse

  // Cancellation token: incremented on every new render call to abort stale ones
  const renderTokenRef = useRef(0)

  // ─── Build ECharts option ──────────────────────────────────────────────────

  function buildOption(
    mapName: string,
    geojson: { features: { properties: { name: string } }[] },
    levelValues: Record<string, number>,
    label: string,
    mn: number,
    mx: number,
    inv: boolean
  ) {
    const seriesData = geojson.features.map(f => ({
      name: f.properties.name,
      value: levelValues[f.properties.name] ?? null,
    }))

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(5,14,35,0.95)",
        borderColor: "rgba(59,130,246,0.4)",
        borderWidth: 1,
        padding: [8, 12],
        textStyle: { color: "#fff", fontSize: 13, fontFamily: "Inter, sans-serif" },
        formatter: (params: { name: string; value: number | null }) => {
          if (params.value == null) return `<b>${params.name}</b><br/>暂无数据`
          return `<div style="font-weight:600;margin-bottom:4px">${params.name}</div>
                  <div style="color:#93c5fd;font-size:12px">${label}：<span style="color:#fb923c;font-weight:700">${params.value.toFixed(1)}%</span></div>`
        },
      },
      visualMap: {
        type: "continuous",
        min: mn,
        max: mx,
        left: 12,
        bottom: 28,
        text: inv ? ["优", "差"] : ["低", "高"],
        textStyle: { color: "rgba(148,163,184,0.75)", fontSize: 10 },
        inRange: { color: inv ? HEAT_COLORS_INV : HEAT_COLORS },
        calculable: true,
        itemWidth: 12,
        itemHeight: 90,
        handleStyle: { color: "#3b82f6", borderColor: "#1d4ed8" },
        indicatorStyle: { color: "#3b82f6" },
      },
      series: [
        {
          type: "map",
          map: mapName,
          roam: true,
          zoom: 1.1,
          scaleLimit: { min: 0.8, max: 8 },
          label: {
            show: true,
            fontSize: 10,
            color: "rgba(255,255,255,0.88)",
            textBorderColor: "rgba(0,0,0,0.65)",
            textBorderWidth: 2.5,
          },
          emphasis: {
            label: { show: true, fontSize: 12, fontWeight: "bold", color: "#fff" },
            itemStyle: {
              areaColor: "#fbbf24",
              shadowBlur: 14,
              shadowColor: "rgba(251,191,36,0.35)",
              borderColor: "#fbbf24",
              borderWidth: 2,
            },
          },
          select: {
            label: { show: true, fontWeight: "bold", color: "#fff" },
            itemStyle: { areaColor: "#fbbf24" },
          },
          itemStyle: {
            borderColor: "rgba(30,100,220,0.55)",
            borderWidth: 1.2,
            areaColor: "#0f2d6b",
          },
          data: seriesData,
        },
      ],
    }
  }

  // ─── Render a level ────────────────────────────────────────────────────────

  const renderLevel = useCallback(async (node: NavItem) => {
    // Mint a new token; any prior in-flight call will see its token is stale
    const token = ++renderTokenRef.current

    const chart = chartRef.current
    if (!chart || chart.isDisposed()) return

    setError(null)
    setLoading(true)

    try {
      let geojson: { features: { properties: { name: string } }[] }

      if (node.level === "streets") {
        geojson = yuhangGeo as typeof geojson
      } else if (node.level === "province") {
        geojson = (await fetchGeo("330000", true)) as typeof geojson
      } else {
        geojson = (await fetchGeo("330100", true)) as typeof geojson
      }

      // Abort if a newer call superseded this one, or chart was disposed during fetch
      if (token !== renderTokenRef.current) return
      if (!chartRef.current || chartRef.current.isDisposed()) return

      const mapName = `ecmap_${node.level}`
      echarts.registerMap(mapName, geojson as Parameters<typeof echarts.registerMap>[1])

      const levelValues = valuesRef.current[node.level]
      chartRef.current.setOption(
        buildOption(mapName, geojson, levelValues, metricLabelRef.current, minRef.current, maxRef.current, inverseRef.current),
        true
      )
    } catch (e) {
      if (token === renderTokenRef.current) {
        setError(e instanceof Error ? e.message : String(e))
      }
    } finally {
      if (token === renderTokenRef.current) {
        setLoading(false)
      }
    }
  }, []) // no deps — reads everything through refs

  // ─── Init chart (deferred until container has non-zero size) ─────────────────

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let initialized = false

    function initChart() {
      if (initialized || !containerRef.current) return
      if (containerRef.current.clientWidth === 0 || containerRef.current.clientHeight === 0) return
      initialized = true

      const chart = echarts.init(containerRef.current)
      chartRef.current = chart

      chart.on("click", (params: { name: string }) => {
        if (!drillDown) return
        const currentStack = stackRef.current
        const current = currentStack[currentStack.length - 1]

        if (current.level === "province" && params.name === "杭州市") {
          const next: NavItem = { name: "杭州市", level: "city" }
          setStack([...currentStack, next])
          renderLevel(next)
          onLevelChange?.("city")
        } else if (current.level === "city" && params.name === "余杭区") {
          const next: NavItem = { name: "余杭区街道", level: "streets" }
          setStack([...currentStack, next])
          renderLevel(next)
          onLevelChange?.("streets")
        }
      })

      renderLevel({ name: "浙江省", level: "province" })
    }

    const ro = new ResizeObserver(() => {
      if (!initialized) {
        initChart()
      } else if (chartRef.current && !chartRef.current.isDisposed()) {
        chartRef.current.resize()
      }
    })
    ro.observe(el)

    initChart()

    return () => {
      ro.disconnect()
      renderTokenRef.current++ // cancel any in-flight renders
      if (chartRef.current && !chartRef.current.isDisposed()) {
        chartRef.current.dispose()
      }
      chartRef.current = null
    }
  }, []) // intentionally only on mount

  // ─── Re-render when metric/values change ──────────────────────────────────

  useEffect(() => {
    // Skip on initial mount — init effect triggers the first render
    if (!chartRef.current || chartRef.current.isDisposed()) return
    const current = stackRef.current[stackRef.current.length - 1]
    renderLevel(current)
  }, [values, min, max, inverse, renderLevel])

  // ─── Drill up ─────────────────────────────────────────────────────────────

  function drillUp(idx: number) {
    if (idx >= stack.length - 1) return
    const newStack = stack.slice(0, idx + 1)
    setStack(newStack)
    const node = newStack[newStack.length - 1]
    renderLevel(node)
    onLevelChange?.(node.level)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Breadcrumb */}
      {drillDown && (
        <div className="flex items-center gap-1 px-3 py-1.5 shrink-0">
          {stack.map((item, i) => (
            <span key={i} className="flex items-center gap-1 text-xs">
              {i > 0 && <span style={{ color: "rgba(100,116,139,0.45)" }}>›</span>}
              <button
                className={
                  i === stack.length - 1
                    ? "text-blue-400 font-medium cursor-default"
                    : "text-slate-400 hover:text-white transition-colors cursor-pointer"
                }
                onClick={() => drillUp(i)}
              >
                {item.name}
              </button>
            </span>
          ))}
          {stack.length < 3 && (
            <span className="text-xs ml-2" style={{ color: "rgba(100,116,139,0.4)" }}>
              · 点击杭州市下钻
            </span>
          )}
        </div>
      )}

      {/* Chart container */}
      <div ref={containerRef} className="flex-1 min-h-0"/>

      {/* Loading overlay */}
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center text-sm"
          style={{ background: "rgba(5,14,35,0.75)", color: "rgba(148,163,184,0.85)" }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin"/>
            正在加载地图数据…
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && !loading && (
        <div
          className="absolute inset-0 flex items-center justify-center p-6"
          style={{ background: "rgba(5,14,35,0.88)" }}
        >
          <div className="text-center max-w-xs">
            <div className="text-red-400 font-medium mb-2 text-sm">地图加载失败</div>
            <div className="text-xs" style={{ color: "rgba(100,116,139,0.7)" }}>{error}</div>
            <button
              className="mt-3 text-xs px-4 py-1.5 rounded-lg bg-blue-700 text-white hover:bg-blue-600 transition-colors"
              onClick={() => renderLevel(stack[stack.length - 1])}
            >
              重试
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
