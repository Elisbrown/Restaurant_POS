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
    if (!decoded || !["Super Admin", "Manager", "Stock Manager"].includes(decoded.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = await getDatabase()
    const suppliers = db.collection("suppliers")

    const supplierList = await suppliers.find({}).sort({ name: 1 }).toArray()

    return NextResponse.json(supplierList)
  } catch (error) {
    console.error("Error fetching suppliers:", error)
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

    const { name, contactPerson, email, phone, address, city, country, paymentTerms, isActive } = await request.json()

    if (!name || !contactPerson || !email || !phone || !city || !country) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const suppliers = db.collection("suppliers")
    const users = db.collection("users")

    // Check if supplier email already exists
    const existingSupplier = await suppliers.findOne({ email })
    if (existingSupplier) {
      return NextResponse.json({ error: "Supplier with this email already exists" }, { status: 400 })
    }

    const newSupplier = {
      name,
      contactPerson,
      email,
      phone,
      address: address || "",
      city,
      country,
      paymentTerms: paymentTerms || "",
      isActive: isActive !== false,
      createdAt: new Date(),
    }

    const result = await suppliers.insertOne(newSupplier)

    // Log the activity
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const adminUser = await users.findOne({ _id: new ObjectId(decoded.userId) })

    await logAdminActivity({
      timestamp: new Date(),
      adminUser: adminUser?.username || "Unknown",
      adminEmail: adminUser?.email || "Unknown",
      action: "CREATE_SUPPLIER",
      details: `Created supplier: ${name}`,
      ipAddress: clientIP,
    })

    return NextResponse.json({ success: true, id: result.insertedId })
  } catch (error) {
    console.error("Error creating supplier:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
