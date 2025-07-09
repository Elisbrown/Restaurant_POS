import { type NextRequest, NextResponse } from "next/server"
import { BackupManager } from "@/lib/backup"

const backupManager = BackupManager.getInstance()

export async function GET() {
  try {
    const backups = await backupManager.listBackups()
    return NextResponse.json({ backups })
  } catch (error) {
    console.error("Error listing backups:", error)
    return NextResponse.json({ error: "Failed to list backups" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, name, backupPath } = body

    if (action === "create") {
      const result = await backupManager.createBackup(name)

      if (result.success) {
        return NextResponse.json({
          message: "Backup created successfully",
          path: result.path,
        })
      } else {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    } else if (action === "restore") {
      if (!backupPath) {
        return NextResponse.json({ error: "Backup path is required for restore" }, { status: 400 })
      }

      const result = await backupManager.restoreBackup(backupPath)

      if (result.success) {
        return NextResponse.json({
          message: "Backup restored successfully",
        })
      } else {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Backup operation error:", error)
    return NextResponse.json({ error: "Backup operation failed" }, { status: 500 })
  }
}
