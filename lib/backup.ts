import fs from "fs/promises"
import path from "path"
import { spawn } from "child_process"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/platinum-lounge"
const BACKUP_DIR = process.env.BACKUP_DIR || "./backups"

export class BackupManager {
  private static instance: BackupManager

  private constructor() {}

  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager()
    }
    return BackupManager.instance
  }

  // Create backup
  async createBackup(name?: string): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      // Ensure backup directory exists
      await fs.mkdir(BACKUP_DIR, { recursive: true })

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const backupName = name || `backup-${timestamp}`
      const backupPath = path.join(BACKUP_DIR, backupName)

      // Create MongoDB dump
      const result = await this.createMongoDump(backupPath)

      if (result.success) {
        // Create metadata file
        await this.createBackupMetadata(backupPath, {
          name: backupName,
          timestamp: new Date(),
          size: await this.getDirectorySize(backupPath),
        })

        // Clean old backups (keep last 30)
        await this.cleanOldBackups()

        return { success: true, path: backupPath }
      }

      return { success: false, error: result.error }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // Restore backup
  async restoreBackup(backupPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const fullPath = path.join(BACKUP_DIR, backupPath)

      // Check if backup exists
      try {
        await fs.access(fullPath)
      } catch {
        return { success: false, error: "Backup not found" }
      }

      // Restore MongoDB dump
      const result = await this.restoreMongoDump(fullPath)
      return result
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  // List available backups
  async listBackups(): Promise<Array<{ name: string; timestamp: Date; size: number; path: string }>> {
    try {
      const backups: Array<any> = []
      const entries = await fs.readdir(BACKUP_DIR, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const metadataPath = path.join(BACKUP_DIR, entry.name, "metadata.json")
          try {
            const metadata = JSON.parse(await fs.readFile(metadataPath, "utf-8"))
            backups.push({
              ...metadata,
              timestamp: new Date(metadata.timestamp),
              path: entry.name,
            })
          } catch {
            // If no metadata, create basic info
            const stats = await fs.stat(path.join(BACKUP_DIR, entry.name))
            backups.push({
              name: entry.name,
              timestamp: stats.ctime,
              size: await this.getDirectorySize(path.join(BACKUP_DIR, entry.name)),
              path: entry.name,
            })
          }
        }
      }

      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    } catch (error) {
      console.error("Error listing backups:", error)
      return []
    }
  }

  // Schedule automatic backup
  scheduleAutomaticBackup(): void {
    // Run backup daily at 2 AM
    const scheduleBackup = () => {
      const now = new Date()
      const scheduledTime = new Date()
      scheduledTime.setHours(2, 0, 0, 0)

      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }

      const timeUntilBackup = scheduledTime.getTime() - now.getTime()

      setTimeout(async () => {
        console.log("Running scheduled backup...")
        const result = await this.createBackup(`auto-backup-${new Date().toISOString().split("T")[0]}`)

        if (result.success) {
          console.log("Scheduled backup completed successfully")
        } else {
          console.error("Scheduled backup failed:", result.error)
        }

        // Schedule next backup
        scheduleBackup()
      }, timeUntilBackup)
    }

    scheduleBackup()
  }

  // Private methods
  private async createMongoDump(backupPath: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const mongodump = spawn("mongodump", ["--uri", MONGODB_URI, "--out", backupPath])

      let errorOutput = ""

      mongodump.stderr.on("data", (data) => {
        errorOutput += data.toString()
      })

      mongodump.on("close", (code) => {
        if (code === 0) {
          resolve({ success: true })
        } else {
          resolve({ success: false, error: errorOutput || `mongodump exited with code ${code}` })
        }
      })

      mongodump.on("error", (error) => {
        resolve({ success: false, error: error.message })
      })
    })
  }

  private async restoreMongoDump(backupPath: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const mongorestore = spawn("mongorestore", ["--uri", MONGODB_URI, "--drop", backupPath])

      let errorOutput = ""

      mongorestore.stderr.on("data", (data) => {
        errorOutput += data.toString()
      })

      mongorestore.on("close", (code) => {
        if (code === 0) {
          resolve({ success: true })
        } else {
          resolve({ success: false, error: errorOutput || `mongorestore exited with code ${code}` })
        }
      })

      mongorestore.on("error", (error) => {
        resolve({ success: false, error: error.message })
      })
    })
  }

  private async createBackupMetadata(backupPath: string, metadata: any): Promise<void> {
    const metadataPath = path.join(backupPath, "metadata.json")
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2))
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    let size = 0
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        if (entry.isDirectory()) {
          size += await this.getDirectorySize(fullPath)
        } else {
          const stats = await fs.stat(fullPath)
          size += stats.size
        }
      }
    } catch (error) {
      console.error("Error calculating directory size:", error)
    }
    return size
  }

  private async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups()

      // Keep only the last 30 backups
      if (backups.length > 30) {
        const backupsToDelete = backups.slice(30)

        for (const backup of backupsToDelete) {
          const backupPath = path.join(BACKUP_DIR, backup.path)
          await fs.rm(backupPath, { recursive: true, force: true })
        }
      }
    } catch (error) {
      console.error("Error cleaning old backups:", error)
    }
  }
}
