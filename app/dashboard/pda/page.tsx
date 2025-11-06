"use client"

import { useRef, useState } from "react"

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
  Assembly: "组装",
  Return: "退库",
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

  const inputLabelClass = "text-sm font-medium text-slate-700"
  const helpTextClass = "text-xs text-slate-500"
  const inputClass =
    "block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
  const baseButtonClass =
    "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
  const primaryButtonClass = `${baseButtonClass} border border-transparent bg-indigo-600 text-white hover:bg-indigo-500`
  const positiveButtonClass = `${baseButtonClass} border border-transparent bg-emerald-600 text-white hover:bg-emerald-500`
  const negativeButtonClass = `${baseButtonClass} border border-transparent bg-rose-600 text-white hover:bg-rose-500`
  const sectionCardClass =
    "rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-sm shadow-sm transition hover:shadow-lg"

  const receivingAction = handleReceiving as unknown as (formData: FormData) => Promise<void>
  const qcAction = handleQC as unknown as (formData: FormData) => Promise<void>
  const putawayAction = handlePutaway as unknown as (formData: FormData) => Promise<void>
  const pickingAction = handlePicking as unknown as (formData: FormData) => Promise<void>
  const assemblyAction = handleAssembly as unknown as (formData: FormData) => Promise<void>
  const returnAction = handleReturn as unknown as (formData: FormData) => Promise<void>

  const renderForm = () => {
    switch (mode) {
      case "Receiving":
        return (
          <form action={receivingAction} className="grid gap-5">
            <label className="grid gap-1">
              <span className={inputLabelClass}>容器编码</span>
              <input
                name="containerCode"
                required
                className={inputClass}
                placeholder="如：C-1001"
                ref={modeFirstInputRefs.current.Receiving}
              />
            </label>
            <label className="grid gap-1">
              <span className={inputLabelClass}>SKU</span>
              <input name="sku" required className={inputClass} placeholder="产品 SKU" />
            </label>
            <label className="grid gap-1">
              <div className="flex items-center justify-between">
                <span className={inputLabelClass}>数量</span>
                <span className={helpTextClass}>输入正整数</span>
              </div>
              <input name="quantity" type="number" required className={inputClass} min={0} />
            </label>
            <div className="flex justify-end">
              <button type="submit" className={`${primaryButtonClass} min-w-32`}>
                提交入库
              </button>
            </div>
          </form>
        )
      case "QC":
        return (
          <form action={qcAction} className="grid gap-5">
            <label className="grid gap-1">
              <span className={inputLabelClass}>容器编码</span>
              <input
                name="containerCode"
                required
                className={inputClass}
                placeholder="待检容器编码"
                ref={modeFirstInputRefs.current.QC}
              />
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                name="decision"
                value="pass"
                className={`${positiveButtonClass} flex-1`}
              >
                合格
              </button>
              <button
                type="submit"
                name="decision"
                value="fail"
                className={`${negativeButtonClass} flex-1`}
              >
                不合格
              </button>
            </div>
          </form>
        )
      case "Putaway":
        return (
          <form action={putawayAction} className="grid gap-5">
            <label className="grid gap-1">
              <span className={inputLabelClass}>容器编码</span>
              <input
                name="containerCode"
                required
                className={inputClass}
                placeholder="待上架容器"
                ref={modeFirstInputRefs.current.Putaway}
              />
            </label>
            <label className="grid gap-1">
              <div className="flex items-center justify-between">
                <span className={inputLabelClass}>库位编码</span>
                <span className={helpTextClass}>例如 A-01-01</span>
              </div>
              <input name="locationCode" required className={inputClass} placeholder="目标库位" />
            </label>
            <div className="flex justify-end">
              <button type="submit" className={`${primaryButtonClass} min-w-32`}>
                提交上架
              </button>
            </div>
          </form>
        )
      case "Picking":
        return (
          <form action={pickingAction} className="grid gap-5">
            <label className="grid gap-1">
              <span className={inputLabelClass}>容器编码</span>
              <input
                name="containerCode"
                required
                className={inputClass}
                placeholder="需要拣货的容器"
                ref={modeFirstInputRefs.current.Picking}
              />
            </label>
            <div className="flex justify-end">
              <button type="submit" className={`${primaryButtonClass} min-w-32`}>
                提交拣货
              </button>
            </div>
          </form>
        )
      case "Assembly":
        return (
          <form action={assemblyAction} className="grid gap-5">
            <label className="grid gap-1">
              <span className={inputLabelClass}>原料容器</span>
              <input
                name="materialContainer"
                required
                className={inputClass}
                placeholder="原料容器编码"
                ref={modeFirstInputRefs.current.Assembly}
              />
            </label>
            <label className="grid gap-1">
              <span className={inputLabelClass}>成品容器</span>
              <input name="productContainer" required className={inputClass} placeholder="成品容器编码" />
            </label>
            <label className="grid gap-1">
              <span className={inputLabelClass}>成品 SKU</span>
              <input name="productSku" required className={inputClass} placeholder="生成产品 SKU" />
            </label>
            <label className="grid gap-1">
              <span className={inputLabelClass}>成品数量</span>
              <input name="productQty" type="number" required className={inputClass} min={0} />
            </label>
            <div className="flex justify-end">
              <button type="submit" className={`${primaryButtonClass} min-w-32`}>
                提交组装
              </button>
            </div>
          </form>
        )
      case "Return":
        return (
          <form action={returnAction} className="grid gap-5">
            <label className="grid gap-1">
              <span className={inputLabelClass}>容器编码</span>
              <input
                name="containerCode"
                required
                className={inputClass}
                placeholder="退库容器编码"
                ref={modeFirstInputRefs.current.Return}
              />
            </label>
            <div className="flex justify-end">
              <button type="submit" className={`${primaryButtonClass} min-w-32`}>
                提交退库
              </button>
            </div>
          </form>
        )
      default:
        return null
    }
  }

  return (
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
            <div className="grid grid-cols-2 gap-2">
              {modes.map((currentMode) => (
                <button
                  key={currentMode}
                  type="button"
                  onClick={() => setMode(currentMode)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    mode === currentMode
                      ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                      : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  {modeLabels[currentMode]}
                </button>
              ))}
            </div>
          </div>
        </section>
        <section className={sectionCardClass}>
          <div className="flex flex-col gap-6 p-6">
            <header className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                <span>当前模式 · {modeLabels[mode]}</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-500">{modeDescriptions[mode]}</p>
            </header>
            <div className="border-t border-slate-200" />
            {renderForm()}
          </div>
        </section>
      </div>
    </main>
  )
}

