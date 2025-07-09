import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { status } = await request.json()

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid table ID" }, { status: 400 })
    }

    const validStatuses = ["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // If setting to AVAILABLE, clear currentOrderId
    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    if (status === "AVAILABLE") {
      updateData.currentOrderId = null
    }

    const result = await db.collection("tables").updateOne({ _id: new ObjectId(params.id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    const updatedTable = await db.collection("tables").findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json(updatedTable)
  } catch (error) {
    console.error("Error updating table status:", error)
    return NextResponse.json({ error: "Failed to update table status" }, { status: 500 })
  }
}
