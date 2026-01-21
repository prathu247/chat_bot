import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sourceFile = path.join(__dirname, 'public', 'sample-document.docx')
const destDir = path.join(__dirname, '..', 'static', 'assets')
const destFile = path.join(destDir, 'sample-document.docx')

if (fs.existsSync(sourceFile)) {
  // Ensure assets directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }
  fs.copyFileSync(sourceFile, destFile)
  console.log('✓ Copied sample-document.docx to static/assets folder')
} else {
  console.warn('⚠ sample-document.docx not found in public folder')
  process.exit(0) // Don't fail the build if file doesn't exist
}

