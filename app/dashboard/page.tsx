"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAutoFocus } from "../hooks/useAutoFocus"
import { createClient as createSupabaseClient } from "@/utils/supabase/client"
import {
  handleAssembly,
  handlePicking,
  handlePutaway,
  handleQC,
  handleReceiving,
  handleReturn,
} from "./pda/actions"

type Mode = "Receiving" | "QC" | "Putaway" | "Picking" | "Assembly" | "Return"

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

type StatusBadge = {
  label: string
  className: string
}

const modeLabels: Record<Mode, string> = {
  Receiving: "入库",
  QC: "质检",
  Putaway: "上架",
  Picking: "拣货",
  Assembly: "装配",
  Return: "回收",
}

const modeDescriptions: Record<Mode, string> = {
  Receiving: "扫描容器完成入库登记，并录入SKU及数量。",
  QC: "对入库容器进行质检，判定合格或不合格。",
  Putaway: "将容器引导至目标库位并更新位置信息。",
  Picking: "确认拣货任务，容器将进入出库流程。",
  Assembly: "将原料消耗并生成新的成品容器。",
  Return: "将容器退回闲置状态，清空物料信息。",
}

const modes: Mode[] = ["Receiving", "QC", "Putaway", "Picking", "Assembly", "Return"]

const formFieldClass = "grid w-full max-w-sm items-center gap-1.5"
const helpTextClass = "text-xs text-slate-500"
const sectionCardClass =
  "rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm transition hover:shadow-lg"
const operationsCardClass = `${sectionCardClass} min-h-[400px] lg:min-h-[460px]`

const modeCardTitles: Record<Mode, string> = {
  Receiving: "入库操作",
  QC: "质检操作",
  Putaway: "上架操作",
  Picking: "拣货操作",
  Assembly: "装配操作",
  Return: "回收操作",
}

function normalizeContainers(containers: RawContainer[]): Container[] {
  return containers.map((container) => ({
    ...container,
    items: Array.isArray(container.items) ? container.items[0] ?? null : container.items ?? null,
    locations: Array.isArray(container.locations)
      ? container.locations[0] ?? null
      : container.locations ?? null,
  }))
}

function formatStatus(status: string | null): StatusBadge {
  if (!status) {
    return {
      label: "-",
      className:
        "inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200",
    }
  }

  const statusMap: Record<string, StatusBadge> = {
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

export default function DashboardPage() {
  const [mode, setMode] = useState<Mode>("Receiving")

  const receivingInputRef = useAutoFocus<HTMLInputElement>(mode)
  const qcInputRef = useAutoFocus<HTMLInputElement>(mode)
  const putawayInputRef = useAutoFocus<HTMLInputElement>(mode)
  const pickingInputRef = useAutoFocus<HTMLInputElement>(mode)
  const assemblyInputRef = useAutoFocus<HTMLInputElement>(mode)
  const returnInputRef = useAutoFocus<HTMLInputElement>(mode)

  const modeFirstInputRefs = useRef<Record<Mode, typeof receivingInputRef>>({
    Receiving: receivingInputRef,
    QC: qcInputRef,
    Putaway: putawayInputRef,
    Picking: pickingInputRef,
    Assembly: assemblyInputRef,
    Return: returnInputRef,
  })

  modeFirstInputRefs.current = {
    Receiving: receivingInputRef,
    QC: qcInputRef,
    Putaway: putawayInputRef,
    Picking: pickingInputRef,
    Assembly: assemblyInputRef,
    Return: returnInputRef,
  }

  const [containers, setContainers] = useState<Container[]>([])
  const [isLoadingContainers, setIsLoadingContainers] = useState(true)
  const [containerError, setContainerError] = useState<string | null>(null)

  const supabaseRef = useRef<ReturnType<typeof createSupabaseClient> | null>(null)
  if (!supabaseRef.current) {
    supabaseRef.current = createSupabaseClient()
  }

  useEffect(() => {
    let isSubscribed = true
    const supabase = supabaseRef.current
    if (!supabase) {
      return
    }

    const loadContainers = async () => {
      setIsLoadingContainers(true)
      setContainerError(null)

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

      if (!isSubscribed) {
        return
      }

      if (error) {
        setContainerError(error.message)
        setContainers([])
      } else {
        const rawContainers = (data ?? []) as RawContainer[]
        setContainers(normalizeContainers(rawContainers))
      }

      setIsLoadingContainers(false)
    }

    loadContainers()

    return () => {
      isSubscribed = false
    }
  }, [])

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

  const currentYear = new Date().getFullYear()
  const receivingAction = handleReceiving as unknown as (formData: FormData) => Promise<void>
  const qcAction = handleQC as unknown as (formData: FormData) => Promise<void>
  const putawayAction = handlePutaway as unknown as (formData: FormData) => Promise<void>
  const pickingAction = handlePicking as unknown as (formData: FormData) => Promise<void>
  const assemblyAction = handleAssembly as unknown as (formData: FormData) => Promise<void>
  const returnAction = handleReturn as unknown as (formData: FormData) => Promise<void>

  return (
    <main className="flex min-h-screen flex-col bg-slate-50">
      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <Tabs
        defaultValue="Receiving"
        value={mode}
        onValueChange={(value) => setMode(value as Mode)}
        className="flex flex-col gap-6"
      >
        <section className={`${operationsCardClass} mx-auto w-full max-w-6xl`}>
          <div className="flex flex-col gap-6 p-6">
            <header className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">操作中心</p>
              <h1 className="text-xl font-semibold text-slate-900">数字ID作业台</h1>
            </header>
            <TabsList className="flex flex-wrap gap-2 bg-transparent p-0 text-slate-600">
              {modes.map((currentMode, index) => (
                <TabsTrigger
                  key={currentMode}
                  value={currentMode}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition hover:text-indigo-600 focus-visible:ring-indigo-500 break-words break-all data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
                >
                  {`${index + 1}. ${modeLabels[currentMode]}`}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </section>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row lg:items-start">
          <section id="pda-workbench" className="flex flex-1 flex-col">
            <div className="flex-1 space-y-6 overflow-auto pt-2">
              <TabsContent value="Receiving" className="mt-0">
                <Card className={sectionCardClass}>
                  <CardHeader className="space-y-1">
                    <CardTitle>{modeCardTitles.Receiving}</CardTitle>
                    <p className="text-sm text-slate-500">{modeDescriptions.Receiving}</p>
                  </CardHeader>
                  <CardContent>
                    <form action={receivingAction} className="grid gap-5">
                      <div className={formFieldClass}>
                        <Label htmlFor="receiving-container-code">容器编码</Label>
                        <Input
                          id="receiving-container-code"
                          name="containerCode"
                          placeholder="如：C-1001"
                          required
                          ref={modeFirstInputRefs.current.Receiving}
                        />
                      </div>
                      <div className={formFieldClass}>
                        <Label htmlFor="receiving-sku">SKU</Label>
                        <Input id="receiving-sku" name="sku" placeholder="产品 SKU" required />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="receiving-quantity">数量</Label>
                          <span className={helpTextClass}>输入正整数</span>
                        </div>
                        <Input id="receiving-quantity" name="quantity" type="number" min={0} required />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" className="min-w-32">
                          提交入库
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="QC" className="mt-0">
                <Card className={sectionCardClass}>
                  <CardHeader className="space-y-1">
                    <CardTitle>{modeCardTitles.QC}</CardTitle>
                    <p className="text-sm text-slate-500">{modeDescriptions.QC}</p>
                  </CardHeader>
                  <CardContent>
                    <form action={qcAction} className="grid gap-5">
                      <div className={formFieldClass}>
                        <Label htmlFor="qc-container-code">容器编码</Label>
                        <Input
                          id="qc-container-code"
                          name="containerCode"
                          placeholder="待检容器编码"
                          required
                          ref={modeFirstInputRefs.current.QC}
                        />
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="submit"
                          name="decision"
                          value="pass"
                          className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                          合格
                        </Button>
                        <Button
                          type="submit"
                          name="decision"
                          value="fail"
                          className="flex-1 bg-rose-600 text-white hover:bg-rose-500"
                        >
                          不合格
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="Putaway" className="mt-0">
                <Card className={sectionCardClass}>
                  <CardHeader className="space-y-1">
                    <CardTitle>{modeCardTitles.Putaway}</CardTitle>
                    <p className="text-sm text-slate-500">{modeDescriptions.Putaway}</p>
                  </CardHeader>
                  <CardContent>
                    <form action={putawayAction} className="grid gap-5">
                      <div className={formFieldClass}>
                        <Label htmlFor="putaway-container-code">容器编码</Label>
                        <Input
                          id="putaway-container-code"
                          name="containerCode"
                          placeholder="待上架容器"
                          required
                          ref={modeFirstInputRefs.current.Putaway}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="putaway-location-code">库位编码</Label>
                          <span className={helpTextClass}>例如 A-01-01</span>
                        </div>
                        <Input id="putaway-location-code" name="locationCode" placeholder="目标库位" required />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" className="min-w-32">
                          提交上架
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="Picking" className="mt-0">
                <Card className={sectionCardClass}>
                  <CardHeader className="space-y-1">
                    <CardTitle>{modeCardTitles.Picking}</CardTitle>
                    <p className="text-sm text-slate-500">{modeDescriptions.Picking}</p>
                  </CardHeader>
                  <CardContent>
                    <form action={pickingAction} className="grid gap-5">
                      <div className={formFieldClass}>
                        <Label htmlFor="picking-container-code">容器编码</Label>
                        <Input
                          id="picking-container-code"
                          name="containerCode"
                          placeholder="需要拣货的容器"
                          required
                          ref={modeFirstInputRefs.current.Picking}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" className="min-w-32">
                          提交拣货
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="Assembly" className="mt-0">
                <Card className={sectionCardClass}>
                  <CardHeader className="space-y-1">
                    <CardTitle>{modeCardTitles.Assembly}</CardTitle>
                    <p className="text-sm text-slate-500">{modeDescriptions.Assembly}</p>
                  </CardHeader>
                  <CardContent>
                    <form action={assemblyAction} className="grid gap-5">
                      <div className={formFieldClass}>
                        <Label htmlFor="assembly-material-container">原料容器</Label>
                        <Input
                          id="assembly-material-container"
                          name="materialContainer"
                          placeholder="原料容器编码"
                          required
                          ref={modeFirstInputRefs.current.Assembly}
                        />
                      </div>
                      <div className={formFieldClass}>
                        <Label htmlFor="assembly-product-container">成品容器</Label>
                        <Input
                          id="assembly-product-container"
                          name="productContainer"
                          placeholder="成品容器编码"
                          required
                        />
                      </div>
                      <div className={formFieldClass}>
                        <Label htmlFor="assembly-product-sku">成品 SKU</Label>
                        <Input
                          id="assembly-product-sku"
                          name="productSku"
                          placeholder="生成产品 SKU"
                          required
                        />
                      </div>
                      <div className={formFieldClass}>
                        <Label htmlFor="assembly-product-qty">成品数量</Label>
                        <Input
                          id="assembly-product-qty"
                          name="productQty"
                          type="number"
                          min={0}
                          required
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" className="min-w-32">
                          提交装配
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="Return" className="mt-0">
                <Card className={sectionCardClass}>
                  <CardHeader className="space-y-1">
                    <CardTitle>{modeCardTitles.Return}</CardTitle>
                    <p className="text-sm text-slate-500">{modeDescriptions.Return}</p>
                  </CardHeader>
                  <CardContent>
                    <form action={returnAction} className="grid gap-5">
                      <div className={formFieldClass}>
                        <Label htmlFor="return-container-code">容器编码</Label>
                        <Input
                          id="return-container-code"
                          name="containerCode"
                          placeholder="回收容器编码"
                          required
                          ref={modeFirstInputRefs.current.Return}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button type="submit" className="min-w-32">
                          提交回收
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
        </section>
        <section id="status-dashboard" className="flex flex-1 flex-col gap-6 lg:flex-[2]">
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
              <Table className="min-w-full">
                <TableHeader className="bg-slate-100/70">
                  <TableRow>
                    <TableHead className="whitespace-nowrap px-4">Container</TableHead>
                    <TableHead className="whitespace-nowrap px-4">SKU</TableHead>
                    <TableHead className="whitespace-nowrap px-4">Name</TableHead>
                    <TableHead className="whitespace-nowrap px-4">Qty</TableHead>
                    <TableHead className="whitespace-nowrap px-4">Status</TableHead>
                    <TableHead className="whitespace-nowrap px-4">Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 bg-white">
                  {isLoadingContainers ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                        正在加载数据...
                      </TableCell>
                    </TableRow>
                  ) : containerError ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-4 py-12 text-center text-sm text-rose-500">
                        {`数据加载失败：${containerError}`}
                      </TableCell>
                    </TableRow>
                  ) : containers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    containers.map((container) => {
                      const { label, className } = formatStatus(container.status)

                      return (
                        <TableRow key={container.container_code} className="hover:bg-slate-50/70">
                          <TableCell className="px-4 py-3 text-sm font-medium text-slate-900 break-words break-all">
                            {container.container_code}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-slate-600 break-words break-all">
                            {container.sku ?? "N/A"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-slate-600 break-words break-all">
                            {container.items?.name ?? "N/A"}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-slate-600 break-words break-all">
                            {container.quantity ?? "N/A"}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <span className={className}>{label}</span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-sm text-slate-600 break-words break-all">
                            {container.locations?.location_code ?? "N/A"}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </section>
      </div>
    </Tabs>
      </div>
    <footer className="mx-auto w-full max-w-6xl rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-4 text-center text-xs text-slate-500">
      © 2025 NeoChain Co., Limited. 保留所有权利。
    </footer>
  </main>
  )
}


