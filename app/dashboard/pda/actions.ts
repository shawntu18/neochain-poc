"use server"

import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"

import { createClient } from "@/utils/supabase/server"

const STATUS_PATH = "/dashboard/status"

type ActionResult = {
  success: boolean
  error?: string
}

function toStringValue(value: FormDataEntryValue | null): string | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  return value.toString().trim() || undefined
}

function toNumberValue(value: FormDataEntryValue | null): number | undefined {
  if (value === null || value === undefined) {
    return undefined
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : undefined
}

async function resolveLocationId(
  supabase: SupabaseClient,
  locationCode: string
): Promise<number | string> {
  const { data, error } = await supabase
    .from("locations")
    .select("id, location_id")
    .eq("location_code", locationCode)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load location '${locationCode}': ${error.message}`)
  }

  const locationId = data?.id ?? data?.location_id

  if (!locationId) {
    throw new Error(`Location '${locationCode}' not found`)
  }

  return locationId
}

function handleError(error: unknown): ActionResult {
  if (error instanceof Error) {
    console.error(error)
    return { success: false, error: error.message }
  }

  console.error(error)
  return { success: false, error: "Unknown error" }
}

export async function handleReceiving(formData: FormData): Promise<ActionResult> {
  const containerCode = toStringValue(formData.get("containerCode"))
  const sku = toStringValue(formData.get("sku"))
  const quantity = toNumberValue(formData.get("quantity"))

  if (!containerCode || !sku || quantity === undefined) {
    return { success: false, error: "Missing container, SKU, or quantity" }
  }

  try {
    const supabase = await createClient()
    const locationId = await resolveLocationId(supabase, "RECEIVING")

    const { error } = await supabase.from("containers").insert({
      container_code: containerCode,
      sku,
      quantity,
      location_id: locationId,
      status: "Pending_QC",
    })

    if (error) {
      throw new Error(`Failed to create container: ${error.message}`)
    }

    revalidatePath(STATUS_PATH)
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

export async function handleQC(formData: FormData): Promise<ActionResult> {
  const containerCode = toStringValue(formData.get("containerCode"))
  const decision = toStringValue(formData.get("decision"))

  if (!containerCode || !decision) {
    return { success: false, error: "Missing container code or decision" }
  }

  const newStatus = decision === "pass" ? "Stored" : "QC_Hold"

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("containers")
      .update({ status: newStatus })
      .eq("container_code", containerCode)

    if (error) {
      throw new Error(`Failed to update container: ${error.message}`)
    }

    revalidatePath(STATUS_PATH)
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

export async function handlePutaway(formData: FormData): Promise<ActionResult> {
  const containerCode = toStringValue(formData.get("containerCode"))
  const locationCode = toStringValue(formData.get("locationCode"))

  if (!containerCode || !locationCode) {
    return { success: false, error: "Missing container code or location code" }
  }

  try {
    const supabase = await createClient()
    const locationId = await resolveLocationId(supabase, locationCode)

    const { error } = await supabase
      .from("containers")
      .update({ location_id: locationId })
      .eq("container_code", containerCode)

    if (error) {
      throw new Error(`Failed to update container location: ${error.message}`)
    }

    revalidatePath(STATUS_PATH)
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

export async function handlePicking(formData: FormData): Promise<ActionResult> {
  const containerCode = toStringValue(formData.get("containerCode"))

  if (!containerCode) {
    return { success: false, error: "Missing container code" }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("containers")
      .update({ status: "In_Transit" })
      .eq("container_code", containerCode)

    if (error) {
      throw new Error(`Failed to update container status: ${error.message}`)
    }

    revalidatePath(STATUS_PATH)
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

export async function handleAssembly(formData: FormData): Promise<ActionResult> {
  const materialContainer = toStringValue(formData.get("materialContainer"))
  const productContainer = toStringValue(formData.get("productContainer"))
  const productSku = toStringValue(formData.get("productSku"))
  const productQty = toNumberValue(formData.get("productQty"))

  if (!materialContainer || !productContainer || !productSku || productQty === undefined) {
    return { success: false, error: "Missing assembly inputs" }
  }

  try {
    const supabase = await createClient()

    const { error: materialError } = await supabase
      .from("containers")
      .update({ status: "Empty", sku: null, quantity: null })
      .eq("container_code", materialContainer)

    if (materialError) {
      throw new Error(`Failed to update material container: ${materialError.message}`)
    }

    const locationId = await resolveLocationId(supabase, "ASSEMBLY-LINE-1")

    const { error: productError } = await supabase.from("containers").insert({
      container_code: productContainer,
      sku: productSku,
      quantity: productQty,
      location_id: locationId,
      status: "Pending_QC",
    })

    if (productError) {
      throw new Error(`Failed to create product container: ${productError.message}`)
    }

    revalidatePath(STATUS_PATH)
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}

export async function handleReturn(formData: FormData): Promise<ActionResult> {
  const containerCode = toStringValue(formData.get("containerCode"))

  if (!containerCode) {
    return { success: false, error: "Missing container code" }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from("containers")
      .update({ status: "Idle", sku: null, quantity: null })
      .eq("container_code", containerCode)

    if (error) {
      throw new Error(`Failed to update container: ${error.message}`)
    }

    revalidatePath(STATUS_PATH)
    return { success: true }
  } catch (error) {
    return handleError(error)
  }
}


