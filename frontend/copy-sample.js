const fs = require('fs')
const path = require('path')

const sourceFile = path.join(__dirname, 'public', 'sample-document.docx')
const destFile = path.join(__dirname, '..', 'static', 'sample-document.docx')

if (fs.existsSync(sourceFile)) {
  fs.copyFileSync(sourceFile, destFile)
  console.log('✓ Copied sample-document.docx to static folder')
} else {
  console.warn('⚠ sample-document.docx not found in public folder')
  process.exit(0) // Don't fail the build if file doesn't exist
}

