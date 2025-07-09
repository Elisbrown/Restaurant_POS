import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { logAdminActivity, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("platinum-lounge-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["Super Admin", "Manager", "Stock Manager"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = await getDatabase()
    const stockMovements = db.collection("stock_movements")

    const movements = await stockMovements.find({ productId: params.id }).sort({ timestamp: -1 }).toArray()

    return NextResponse.json(movements)
  } catch (error) {
    console.error("Error fetching stock movements:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("platinum-lounge-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["Super Admin", "Manager", "Stock Manager"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { type, quantity, reason, reference, notes } = await request.json()

    if (!type || !quantity || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const products = db.collection("products")
    const stockMovements = db.collection("stock_movements")
    const users = db.collection("users")

    // Get current product
    const product = await products.findOne({ _id: new ObjectId(params.id) })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const currentStock = product.stockQuantity
    let newStock: number

    // Calculate new stock based on movement type
    switch (type) {
      case "IN":
      case "RETURN":
        newStock = currentStock + Number.parseInt(quantity)
        break
      case "OUT":
      case "SALE":
      case "WASTE":
        newStock = Math.max(0, currentStock - Number.parseInt(quantity))
        break
      case "ADJUSTMENT":
        newStock = Number.parseInt(quantity)
        break
      default:
        return NextResponse.json({ error: "Invalid movement type" }, { status: 400 })
    }

    // Update product stock
    await products.updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          stockQuantity: newStock,
          updatedAt: new Date(),
          updatedBy: decoded.userId,
        },
      },
    )

    // Create stock movement record
    const movement = {
      productId: params.id,
      type,
      quantity: Number.parseInt(quantity),
      previousStock: currentStock,
      newStock,
      reason,
      reference: reference || "",
      notes: notes || "",
      performedBy: decoded.userId,
      timestamp: new Date(),
    }

    await stockMovements.insertOne(movement)

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: adminUser?.username || "Unknown",
      adminEmail: adminUser?.email || "Unknown",
      action: "STOCK_MOVEMENT",
      details: `${type} ${quantity} units of ${product.nameEn} (${product.sku}). Stock: ${currentStock} → ${newStock}`,
      ipAddress: clientIP,
    })

    return NextResponse.json({ success: true, newStock })
  } catch (error) {
    console.error("Error creating stock movement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
