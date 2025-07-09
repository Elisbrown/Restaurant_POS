import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import type { Table } from "@/lib/models"

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const floor = searchParams.get("floor")

    const query: any = { isActive: true }

    if (status) {
      query.status = status
    }

    if (floor) {
      query.floor = floor
    }

    const tables = await db.collection("tables").find(query).sort({ floor: 1, number: 1 }).toArray()

    return NextResponse.json(tables)
  } catch (error) {
    console.error("Error fetching tables:", error)
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase()
    const tableData = await request.json()

    // Check if table number already exists on the same floor
    const existingTable = await db.collection("tables").findOne({ number: tableData.number, floor: tableData.floor })

    if (existingTable) {
      return NextResponse.json({ error: "Table number already exists on this floor" }, { status: 400 })
    }

    const newTable: Table = {
      ...tableData,
      status: "AVAILABLE",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("tables").insertOne(newTable)

    return NextResponse.json({ _id: result.insertedId, ...newTable }, { status: 201 })
  } catch (error) {
    console.error("Error creating table:", error)
    return NextResponse.json({ error: "Failed to create table" }, { status: 500 })
  }
}
