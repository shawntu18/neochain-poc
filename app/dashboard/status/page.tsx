export const revalidate = 0

import { createClient } from "@/utils/supabase/server"

type RawContainer = {
  container_code: string
  sku: string | null
  quantity: number | null
  status: string | null
  items?: { name: string | null } | { name: string | null }[] | null
  locations?: { location_code: string | null } | { location_code: string | null }[] | null
}

type Container = {
  container_code: string
  sku: string | null
  quantity: number | null
  status: string | null
  items?: { name: string | null } | null
  locations?: { location_code: string | null } | null
}

async function loadContainers(): Promise<Container[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("containers")
    .select(
      `
        container_code,
        sku,
        quantity,
        status,
        items ( name ),
        locations ( location_code )
      `
    )
    .order("container_code")

  if (error) {
    throw new Error(`Failed to load containers: ${error.message}`)
  }

  const containers = (data ?? []) as RawContainer[]

  return containers.map((container) => ({
    ...container,
    items: Array.isArray(container.items) ? container.items[0] ?? null : container.items ?? null,
    locations: Array.isArray(container.locations)
      ? container.locations[0] ?? null
      : container.locations ?? null,
  }))
}

function formatStatus(status: string | null) {
  if (!status) {
    return {
      label: "-",
      className: "inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200",
    }
  }

  const statusMap: Record<
    string,
    {
      label: string
      className: string
    }
  > = {
    Pending_QC: {
      label: "待质检",
      className:
        "inline-flex items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20",
    },
    Stored: {
      label: "已上架",
      className:
        "inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    },
    In_Transit: {
      label: "运输中",
      className:
        "inline-flex items-center rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20",
    },
    QC_Hold: {
      label: "质检待处理",
      className:
        "inline-flex items-center rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20",
    },
    Idle: {
      label: "闲置",
      className:
        "inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-300",
    },
  }

  return (
    statusMap[status] ?? {
      label: status,
      className:
        "inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-300",
    }
  )
}

export default async function StatusPage() {
  const containers = await loadContainers()

  const statusSummary = containers.reduce<Record<string, number>>((acc, container) => {
    const key = container.status ?? "未知"
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})

  const overviewItems = [
    { label: "总容器", value: containers.length },
    { label: "待质检", value: statusSummary.Pending_QC ?? 0 },
    { label: "已上架", value: statusSummary.Stored ?? 0 },
    { label: "运输中", value: statusSummary.In_Transit ?? 0 },
  ]

  return (
    <main className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
          <header className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <span>仓储概览</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">实时看板</h1>
            <p className="text-sm text-slate-500">
              追踪容器的库存流转状态，了解物料去向与库位分布。
            </p>
          </header>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overviewItems.map((item) => (
              <div
                key={item.label}
                className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm"
              >
                <span className="text-sm font-medium text-slate-500">{item.label}</span>
                <span className="text-3xl font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100/70">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    容器编码
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    SKU
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    数量
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    状态
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    物料名称
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    库位编码
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {containers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  containers.map((container) => {
                    const { label, className } = formatStatus(container.status)

                    return (
                      <tr key={container.container_code} className="hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                          {container.container_code}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {container.sku ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {container.quantity ?? "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={className}>{label}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {container.items?.name ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {container.locations?.location_code ?? "-"}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

