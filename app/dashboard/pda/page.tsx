"use client"

import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useAutoFocus } from "../../hooks/useAutoFocus"

import {
  handleAssembly,
  handlePicking,
  handlePutaway,
  handleQC,
  handleReceiving,
  handleReturn,
} from "./actions"

type Mode = "Receiving" | "QC" | "Putaway" | "Picking" | "Assembly" | "Return"

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

export default function PDAPage() {
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

  const formFieldClass = "grid w-full max-w-sm items-center gap-1.5"
  const helpTextClass = "text-xs text-slate-500"
  const sectionCardClass =
    "rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm transition hover:shadow-lg"

  const modeCardTitles: Record<Mode, string> = {
    Receiving: "入库操作",
    QC: "质检操作",
    Putaway: "上架操作",
    Picking: "拣货操作",
    Assembly: "装配操作",
    Return: "回收操作",
  }

  const receivingAction = handleReceiving as unknown as (formData: FormData) => Promise<void>
  const qcAction = handleQC as unknown as (formData: FormData) => Promise<void>
  const putawayAction = handlePutaway as unknown as (formData: FormData) => Promise<void>
  const pickingAction = handlePicking as unknown as (formData: FormData) => Promise<void>
  const assemblyAction = handleAssembly as unknown as (formData: FormData) => Promise<void>
  const returnAction = handleReturn as unknown as (formData: FormData) => Promise<void>

  return (
    <Tabs
      defaultValue="Receiving"
      value={mode}
      onValueChange={(value) => setMode(value as Mode)}
      className="min-h-full"
    >
      <main className="min-h-full bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[280px_1fr]">
          <section className={sectionCardClass}>
            <div className="flex flex-col gap-6 p-6">
              <header className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">操作中心</p>
                <h1 className="text-xl font-semibold text-slate-900">PDA 作业台</h1>
                <p className="text-sm text-slate-500">
                  根据当前作业流程选择模式，填写信息后提交，系统将自动同步状态。
                </p>
              </header>
              <TabsList className="flex flex-wrap gap-2 bg-transparent p-0 text-slate-600">
                {modes.map((currentMode, index) => (
                  <TabsTrigger
                    key={currentMode}
                    value={currentMode}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium transition hover:text-indigo-600 focus-visible:ring-indigo-500 data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600"
                  >
                    {`${index + 1}. ${modeLabels[currentMode]}`}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </section>
          <div className="space-y-6">
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
        </div>
      </main>
    </Tabs>
  )
}

