import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { logAdminActivity, verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("platinum-lounge-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (
      !decoded ||
      !["Super Admin", "Manager", "Stock Manager", "Waitress", "Cashier", "Cook"].includes(decoded.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = await getDatabase()
    const products = db.collection("products")

    const productList = await products.find({}).sort({ nameEn: 1 }).toArray()

    return NextResponse.json(productList)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const {
      nameEn,
      nameFr,
      descriptionEn,
      descriptionFr,
      sku,
      barcode,
      categoryId,
      price,
      costPrice,
      stockQuantity,
      minStockLevel,
      maxStockLevel,
      unit,
      isActive,
      isAvailable,
      tags,
    } = await request.json()

    if (!nameEn || !nameFr || !categoryId || price === undefined || stockQuantity === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const products = db.collection("products")
    const users = db.collection("users")

    // Generate SKU if not provided
    const finalSku =
      sku || `PL${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`

    // Check if SKU already exists
    const existingProduct = await products.findOne({ sku: finalSku })
    if (existingProduct) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
    }

    // Check if barcode already exists (if provided)
    if (barcode) {
      const existingBarcode = await products.findOne({ barcode })
      if (existingBarcode) {
        return NextResponse.json({ error: "Barcode already exists" }, { status: 400 })
      }
    }

    const newProduct = {
      nameEn,
      nameFr,
      descriptionEn: descriptionEn || "",
      descriptionFr: descriptionFr || "",
      sku: finalSku,
      barcode: barcode || "",
      categoryId,
      price: Number.parseFloat(price),
      costPrice: Number.parseFloat(costPrice) || 0,
      images: [],
      stockQuantity: Number.parseInt(stockQuantity),
      minStockLevel: Number.parseInt(minStockLevel) || 0,
      maxStockLevel: Number.parseInt(maxStockLevel) || 0,
      unit: unit || "piece",
      isActive: isActive !== false,
      isAvailable: isAvailable !== false,
      tags: Array.isArray(tags) ? tags : [],
      createdAt: new Date(),
      createdBy: decoded.userId,
    }

    const result = await products.insertOne(newProduct)

    // Create initial stock movement record
    const stockMovements = db.collection("stock_movements")
    await stockMovements.insertOne({
      productId: result.insertedId.toString(),
      type: "IN",
      quantity: Number.parseInt(stockQuantity),
      previousStock: 0,
      newStock: Number.parseInt(stockQuantity),
      reason: "Initial stock",
      performedBy: decoded.userId,
      timestamp: new Date(),
    })

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: adminUser?.username || "Unknown",
      adminEmail: adminUser?.email || "Unknown",
      action: "CREATE_PRODUCT",
      details: `Created product: ${nameEn} / ${nameFr} (SKU: ${finalSku})`,
      ipAddress: clientIP,
    })

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
