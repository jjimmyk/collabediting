import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type {
  HubDashboardBarChartWidget,
  HubDashboardCategoryBarsWidget,
  HubDashboardKpiWidget,
  HubDashboardTableWidget,
  HubDashboardWidget,
} from '@/features/hub/cisa-dashboards/types'
import { cn } from '@/lib/utils'

function KpiWidget({ widget }: { widget: HubDashboardKpiWidget }) {
  return (
    <div className="min-w-0 rounded-md border bg-muted/20 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{widget.label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{widget.value}</p>
      {widget.hint ? (
        <p className="mt-0.5 text-[10px] text-muted-foreground">{widget.hint}</p>
      ) : null}
    </div>
  )
}

function BarChartWidget({ widget }: { widget: HubDashboardBarChartWidget }) {
  const chartConfig = {
    value: {
      label: widget.title,
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig

  return (
    <section className="rounded-md border bg-muted/10 p-3">
      <p className="text-xs font-medium">{widget.title}</p>
      {widget.description ? (
        <p className="text-[10px] text-muted-foreground">{widget.description}</p>
      ) : null}
      <ChartContainer config={chartConfig} className="mt-3 h-48 w-full">
        <BarChart data={widget.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </section>
  )
}

function CategoryBarsWidget({ widget }: { widget: HubDashboardCategoryBarsWidget }) {
  const maxCount = Math.max(...widget.rows.map((row) => row.count), 1)

  return (
    <section className="rounded-md border bg-muted/10 p-3">
      <p className="text-xs font-medium">{widget.title}</p>
      {widget.description ? (
        <p className="text-[10px] text-muted-foreground">{widget.description}</p>
      ) : null}
      <div className="mt-3 space-y-2">
        {widget.rows.map((row) => (
          <div key={row.category} className="flex items-center gap-2">
            <span className="w-36 shrink-0 truncate text-xs">{row.category}</span>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-primary/80"
                style={{ width: `${(row.count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {row.count}
            </span>
            {row.detail ? (
              <span className="w-16 shrink-0 text-right text-[10px] text-muted-foreground">
                {row.detail}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}

function TableWidget({ widget }: { widget: HubDashboardTableWidget }) {
  return (
    <section className="overflow-hidden rounded-md border bg-muted/10">
      <div className="border-b px-3 py-2.5">
        <p className="text-xs font-medium">{widget.title}</p>
        {widget.description ? (
          <p className="text-[10px] text-muted-foreground">{widget.description}</p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[11px]">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-muted-foreground">
              {widget.columns.map((column) => (
                <th key={column} className="px-2 py-2 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {widget.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-2 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function renderWidget(widget: HubDashboardWidget) {
  switch (widget.kind) {
    case 'kpi':
      return <KpiWidget key={widget.id} widget={widget} />
    case 'bar-chart':
      return <BarChartWidget key={widget.id} widget={widget} />
    case 'category-bars':
      return <CategoryBarsWidget key={widget.id} widget={widget} />
    case 'table':
      return <TableWidget key={widget.id} widget={widget} />
    default:
      return null
  }
}

export function HubDashboardWidgetRenderer({
  widgets,
  glassItemBorderClasses = '',
}: {
  widgets: HubDashboardWidget[]
  glassItemBorderClasses?: string
}) {
  const kpiWidgets = widgets.filter((widget): widget is HubDashboardKpiWidget => widget.kind === 'kpi')
  const otherWidgets = widgets.filter((widget) => widget.kind !== 'kpi')

  return (
    <div className="space-y-4">
      {kpiWidgets.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {kpiWidgets.map((widget) => (
            <div key={widget.id} className={cn(glassItemBorderClasses && 'rounded-md')}>
              {renderWidget(widget)}
            </div>
          ))}
        </div>
      ) : null}
      {otherWidgets.map((widget) => (
        <div key={widget.id} className={glassItemBorderClasses}>
          {renderWidget(widget)}
        </div>
      ))}
    </div>
  )
}
