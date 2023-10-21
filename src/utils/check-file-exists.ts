import { existsSync } from 'fs'

export function checkFilesExists (filePaths: string[]) {
  for (const filePath of filePaths) {
    if (!existsSync(filePath)) {
      console.log(`File does not exists ${filePath}`)
      throw new Error()
    }
  }
}
