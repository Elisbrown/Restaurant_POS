import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { amount, processedBy, reason } = await request.json()

    // Get original payment
    const originalPayment = await db.collection("payments").findOne({ _id: new ObjectId(params.id) })
    if (!originalPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (originalPayment.status !== "COMPLETED") {
      return NextResponse.json({ error: "Can only refund completed payments" }, { status: 400 })
    }

    if (amount > originalPayment.amount) {
      return NextResponse.json({ error: "Refund amount cannot exceed original payment" }, { status: 400 })
    }

    // Create refund record
    const refund = {
      orderId: originalPayment.orderId,
      originalPaymentId: params.id,
      amount: -amount, // Negative amount for refund
      method: originalPayment.method,
      status: "COMPLETED",
      processedBy,
      timestamp: new Date(),
      notes: `Refund: ${reason}`,
    }

    const result = await db.collection("payments").insertOne(refund)

    // Update original payment status if fully refunded
    if (amount === originalPayment.amount) {
      await db
        .collection("payments")
        .updateOne({ _id: new ObjectId(params.id) }, { $set: { status: "REFUNDED", updatedAt: new Date() } })
    }

    // Recalculate order payment status
    const allPayments = await db
      .collection("payments")
      .find({ orderId: originalPayment.orderId, status: "COMPLETED" })
      .toArray()

    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0)
    const order = await db.collection("orders").findOne({ _id: new ObjectId(originalPayment.orderId) })

    let paymentStatus = "PENDING"
    if (totalPaid >= order.total) {
      paymentStatus = "PAID"
    } else if (totalPaid > 0) {
      paymentStatus = "PARTIAL"
    } else if (totalPaid < 0) {
      paymentStatus = "REFUNDED"
    }

    await db.collection("orders").updateOne(
      { _id: new ObjectId(originalPayment.orderId) },
      {
        $set: {
          paymentStatus,
          updatedAt: new Date(),
        },
      },
    )

    return NextResponse.json({ _id: result.insertedId, ...refund }, { status: 201 })
  } catch (error) {
    console.error("Error processing refund:", error)
    return NextResponse.json({ error: "Failed to process refund" }, { status: 500 })
  }
}
