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
    if (!decoded) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = await getDatabase()
    const products = db.collection("products")

    const product = await products.findOne({ _id: new ObjectId(params.id) })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    if (!nameEn || !nameFr || !categoryId || price === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const products = db.collection("products")
    const users = db.collection("users")

    // Get current product for comparison
    const currentProduct = await products.findOne({ _id: new ObjectId(params.id) })
    if (!currentProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Check if SKU already exists (excluding current product)
    if (sku && sku !== currentProduct.sku) {
      const existingProduct = await products.findOne({
        $and: [{ _id: { $ne: new ObjectId(params.id) } }, { sku }],
      })
      if (existingProduct) {
        return NextResponse.json({ error: "SKU already exists" }, { status: 400 })
      }
    }

    // Check if barcode already exists (excluding current product)
    if (barcode && barcode !== currentProduct.barcode) {
      const existingBarcode = await products.findOne({
        $and: [{ _id: { $ne: new ObjectId(params.id) } }, { barcode }],
      })
      if (existingBarcode) {
        return NextResponse.json({ error: "Barcode already exists" }, { status: 400 })
      }
    }

    const updateData = {
      nameEn,
      nameFr,
      descriptionEn: descriptionEn || "",
      descriptionFr: descriptionFr || "",
      sku: sku || currentProduct.sku,
      barcode: barcode || "",
      categoryId,
      price: Number.parseFloat(price),
      costPrice: Number.parseFloat(costPrice) || 0,
      minStockLevel: Number.parseInt(minStockLevel) || 0,
      maxStockLevel: Number.parseInt(maxStockLevel) || 0,
      unit: unit || "piece",
      isActive: isActive !== false,
      isAvailable: isAvailable !== false,
      tags: Array.isArray(tags) ? tags : [],
      updatedAt: new Date(),
      updatedBy: decoded.userId,
    }

    // Handle stock quantity change
    if (stockQuantity !== undefined && Number.parseInt(stockQuantity) !== currentProduct.stockQuantity) {
      const newStockQuantity = Number.parseInt(stockQuantity)
      const stockDifference = newStockQuantity - currentProduct.stockQuantity

      updateData.stockQuantity = newStockQuantity

      // Create stock movement record
      const stockMovements = db.collection("stock_movements")
      await stockMovements.insertOne({
        productId: params.id,
        type: stockDifference > 0 ? "IN" : "OUT",
        quantity: Math.abs(stockDifference),
        previousStock: currentProduct.stockQuantity,
        newStock: newStockQuantity,
        reason: "Stock adjustment via product edit",
        performedBy: decoded.userId,
        timestamp: new Date(),
      })
    }

    const result = await products.updateOne({ _id: new ObjectId(params.id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: adminUser?.username || "Unknown",
      adminEmail: adminUser?.email || "Unknown",
      action: "UPDATE_PRODUCT",
      details: `Updated product: ${nameEn} / ${nameFr} (SKU: ${sku || currentProduct.sku})`,
      ipAddress: clientIP,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token =
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      request.cookies.get("platinum-lounge-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || !["Super Admin", "Manager"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = await getDatabase()
    const products = db.collection("products")
    const users = db.collection("users")

    // Get product info before deletion for logging
    const product = await products.findOne({ _id: new ObjectId(params.id) })

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const result = await products.deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: adminUser?.username || "Unknown",
      adminEmail: adminUser?.email || "Unknown",
      action: "DELETE_PRODUCT",
      details: `Deleted product: ${product.nameEn} / ${product.nameFr} (SKU: ${product.sku})`,
      ipAddress: clientIP,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
