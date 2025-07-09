import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid table ID" }, { status: 400 })
    }

    const table = await db.collection("tables").findOne({ _id: new ObjectId(params.id) })

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    return NextResponse.json(table)
  } catch (error) {
    console.error("Error fetching table:", error)
    return NextResponse.json({ error: "Failed to fetch table" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const updateData = await request.json()

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid table ID" }, { status: 400 })
    }

    // If updating number or floor, check for duplicates
    if (updateData.number || updateData.floor) {
      const existingTable = await db.collection("tables").findOne({
        number: updateData.number,
        floor: updateData.floor,
        _id: { $ne: new ObjectId(params.id) },
      })

      if (existingTable) {
        return NextResponse.json({ error: "Table number already exists on this floor" }, { status: 400 })
      }
    }

    const result = await db.collection("tables").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    const updatedTable = await db.collection("tables").findOne({ _id: new ObjectId(params.id) })

    return NextResponse.json(updatedTable)
  } catch (error) {
    console.error("Error updating table:", error)
    return NextResponse.json({ error: "Failed to update table" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid table ID" }, { status: 400 })
    }

    // Check if table has active orders
    const activeOrder = await db.collection("orders").findOne({
      tableId: params.id,
      status: { $in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] },
    })

    if (activeOrder) {
      return NextResponse.json({ error: "Cannot delete table with active orders" }, { status: 400 })
    }

    // Soft delete by setting isActive to false
    const result = await db.collection("tables").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Table deleted successfully" })
  } catch (error) {
    console.error("Error deleting table:", error)
    return NextResponse.json({ error: "Failed to delete table" }, { status: 500 })
  }
}
