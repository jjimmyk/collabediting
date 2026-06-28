import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  aggregateWorkspaceSpendByDay,
  aggregateWorkspaceSpendSummary,
  formatWorkspaceSpendCurrency,
  formatWorkspaceSpendCurrencyExact,
  formatWorkspaceSpendDateTime,
  type WorkspaceAssetRequestSpendRow,
} from '@/features/analytics/workspace-asset-request-spend'
import { cn } from '@/lib/utils'

const spendChartConfig = {
  totalSpend: {
    label: 'Spend',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig

type WorkspaceAssetRequestSpendSectionProps = {
  rows: WorkspaceAssetRequestSpendRow[]
  allWorkspaceRowCount: number
  isLoading: boolean
  workspaceName: string | null
  glassItemBorderClasses?: string
  onOpenRequest?: (requestId: number) => void
}

function requestStatusVariant(
  status: WorkspaceAssetRequestSpendRow['requestStatus']
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'Approved' || status === 'Filled') return 'default'
  if (status === 'Denied') return 'destructive'
  return 'secondary'
}

export function WorkspaceAssetRequestSpendSection({
  rows,
  allWorkspaceRowCount,
  isLoading,
  workspaceName,
  glassItemBorderClasses = '',
  onOpenRequest,
}: WorkspaceAssetRequestSpendSectionProps) {
  const summary = useMemo(() => aggregateWorkspaceSpendSummary(rows), [rows])
  const dailySpend = useMemo(() => aggregateWorkspaceSpendByDay(rows), [rows])

  return (
    <section
      className={cn(
        'w-full min-w-0 overflow-hidden rounded-lg border',
        glassItemBorderClasses
      )}
    >
      <div className="border-b px-3 py-2.5">
        <p className="text-sm font-medium">Asset Request Spend</p>
        <p className="text-xs text-muted-foreground">
          Requested-item costs for {workspaceName?.trim() || 'this workspace'}. Spend totals use
          the date range above; region filters apply only to incident and event analytics below.
        </p>
      </div>

      <div className="space-y-4 px-3 py-3">
        {isLoading ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Loading asset requests…</p>
        ) : allWorkspaceRowCount === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No asset requests in this workspace yet.
          </p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            No requested items were updated in this date range.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="min-w-0 rounded-md border bg-muted/20 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Total spend
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {summary.pricedRowCount > 0
                    ? formatWorkspaceSpendCurrency(summary.totalSpend)
                    : '—'}
                </p>
              </div>
              <div className="min-w-0 rounded-md border bg-muted/20 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Priced items
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{summary.pricedRowCount}</p>
              </div>
              <div className="min-w-0 rounded-md border bg-muted/20 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Unpriced items
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {summary.unpricedRowCount}
                </p>
              </div>
              <div className="min-w-0 rounded-md border bg-muted/20 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Total units
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{summary.totalQuantity}</p>
              </div>
            </div>

            <div className="rounded-md border bg-muted/10 p-3">
              <p className="text-xs font-medium">Daily spend</p>
              <p className="text-[10px] text-muted-foreground">
                Totals grouped by asset request last updated date
              </p>
              {dailySpend.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  No priced items with a last updated date in this range.
                </p>
              ) : (
                <ChartContainer config={spendChartConfig} className="mt-3 h-48 w-full">
                  <BarChart data={dailySpend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="dateLabel"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={24}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={48}
                      tickFormatter={(value: number) => formatWorkspaceSpendCurrency(value)}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) =>
                            formatWorkspaceSpendCurrencyExact(Number(value))
                          }
                        />
                      }
                    />
                    <Bar
                      dataKey="totalSpend"
                      fill="var(--color-totalSpend)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </div>

            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[960px] border-collapse text-[11px]">
                <thead>
                  <tr className="border-b bg-muted/30 text-left text-muted-foreground">
                    <th className="px-2 py-2 font-semibold">Request #</th>
                    <th className="min-w-[12rem] px-2 py-2 font-semibold">Item</th>
                    <th className="px-2 py-2 font-semibold">Units</th>
                    <th className="px-2 py-2 font-semibold">Per unit</th>
                    <th className="px-2 py-2 font-semibold">Total</th>
                    <th className="min-w-[9rem] px-2 py-2 font-semibold">Last updated</th>
                    <th className="min-w-[8rem] px-2 py-2 font-semibold">Assignee</th>
                    <th className="px-2 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const totalLabel =
                      row.resolvedTotalCost === null
                        ? '—'
                        : row.totalCostIsDerived
                          ? `${formatWorkspaceSpendCurrencyExact(row.resolvedTotalCost)} (calc.)`
                          : formatWorkspaceSpendCurrencyExact(row.resolvedTotalCost)

                    return (
                      <tr
                        key={row.rowKey}
                        className={cn(
                          'border-b',
                          onOpenRequest && 'cursor-pointer hover:bg-muted/20'
                        )}
                        onClick={
                          onOpenRequest
                            ? () => {
                                onOpenRequest(row.requestId)
                              }
                            : undefined
                        }
                      >
                        <td className="px-2 py-2 font-medium tabular-nums">{row.requestNumber}</td>
                        <td className="px-2 py-2">{row.description}</td>
                        <td className="px-2 py-2 tabular-nums">{row.quantity}</td>
                        <td className="px-2 py-2 tabular-nums">
                          {row.costPerUnit === null
                            ? '—'
                            : formatWorkspaceSpendCurrencyExact(row.costPerUnit)}
                        </td>
                        <td className="px-2 py-2 tabular-nums">{totalLabel}</td>
                        <td className="px-2 py-2">
                          {formatWorkspaceSpendDateTime(row.lastUpdatedAt)}
                        </td>
                        <td className="px-2 py-2">{row.assignee ?? '—'}</td>
                        <td className="px-2 py-2">
                          <Badge
                            variant={requestStatusVariant(row.requestStatus)}
                            className="text-[10px]"
                          >
                            {row.requestStatus}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
