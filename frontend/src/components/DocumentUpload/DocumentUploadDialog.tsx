import { useState, useRef } from 'react'
import { Dialog, DialogType, Stack, PrimaryButton, DefaultButton, TextField, Spinner, SpinnerSize, MessageBar, MessageBarType } from '@fluentui/react'
import mammoth from 'mammoth'

interface DocumentUploadDialogProps {
  isOpen: boolean
  onDismiss: () => void
  onDocumentProcessed: (documentText: string) => Promise<void>
}

const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({ isOpen, onDismiss, onDocumentProcessed }) => {
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [characterCount, setCharacterCount] = useState<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Maximum file size: 10MB
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
  // Maximum character count: 100,000 characters (adjust based on your needs)
  const MAX_CHARACTERS = 100000

  const normalizeExtractedDocText = (text: string): string => {
    // Mammoth's raw text often contains lots of whitespace/newlines due to Word layout.
    // Normalize for nicer chat display + cleaner prompt sent to backend.
    const normalized = text
      .replace(/\u00A0/g, ' ') // nbsp -> space
      .replace(/\r\n/g, '\n')
      // turn lines that are only whitespace into empty lines
      .replace(/^[ \t]+$/gm, '')
      // trim trailing whitespace on each line (prevents huge visual gaps with `white-space: pre-wrap`)
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      // collapse excessive blank lines
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    return normalized
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file type
      if (!(file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            file.name.endsWith('.docx'))) {
        setErrorMessage('Please select a Word document (.docx file)')
        setSelectedFile(null)
        setExtractedText(null)
        setCharacterCount(0)
        return
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(`File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of ${formatFileSize(MAX_FILE_SIZE)}`)
        setSelectedFile(null)
        setExtractedText(null)
        setCharacterCount(0)
        return
      }

      setSelectedFile(file)
      setErrorMessage(null)
      setSuccessMessage(null)
      setExtractedText(null)
      setCharacterCount(0)

      // Pre-extract text to show preview and character count
      try {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        const normalizedText = normalizeExtractedDocText(result.value)
        
        if (!normalizedText || normalizedText.trim().length === 0) {
          setErrorMessage('The document appears to be empty or could not be read')
          setSelectedFile(null)
          return
        }

        setExtractedText(normalizedText)
        setCharacterCount(normalizedText.length)

        // Warn if document is very long
        if (normalizedText.length > MAX_CHARACTERS) {
          setErrorMessage(`Warning: Document is very long (${normalizedText.length.toLocaleString()} characters). Only the first ${MAX_CHARACTERS.toLocaleString()} characters will be processed.`)
        }
      } catch (error: any) {
        setErrorMessage(`Error reading document: ${error.message}`)
        setSelectedFile(null)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !extractedText) {
      setErrorMessage('Please select a file first')
      return
    }

    setIsUploading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      // Truncate if too long
      const documentText = extractedText.length > MAX_CHARACTERS 
        ? extractedText.substring(0, MAX_CHARACTERS) + '\n\n[... Document truncated due to length ...]'
        : extractedText

      // Append system prompt to document text
      const systemPrompt = "You are an AI assistant. Please analyze and respond to the following document content:\n\n"
      const documentWithPrompt = `${systemPrompt}${documentText}`

      // Call the callback to process the document using existing chat API
      await onDocumentProcessed(documentWithPrompt)
      
      setSuccessMessage('Document uploaded and processed successfully!')
      setTimeout(() => {
        handleDismiss()
      }, 1500)
    } catch (error: any) {
      setErrorMessage(error.message || 'An error occurred while processing the document')
      console.error('Error uploading document:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDismiss = () => {
    if (!isUploading) {
      setSelectedFile(null)
      setErrorMessage(null)
      setSuccessMessage(null)
      setExtractedText(null)
      setCharacterCount(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onDismiss()
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const dialogContentProps = {
    type: DialogType.normal,
    title: 'Upload Word Document',
    closeButtonAriaLabel: 'Close'
  }

  const modalProps = {
    titleAriaId: 'upload-dialog-title',
    subtitleAriaId: 'upload-dialog-subtitle',
    isBlocking: false,
    styles: { main: { maxWidth: 500 } }
  }

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={handleDismiss}
      dialogContentProps={dialogContentProps}
      modalProps={modalProps}
    >
      <Stack tokens={{ childrenGap: 16 }}>
        {errorMessage && (
          <MessageBar messageBarType={MessageBarType.error} isMultiline>
            {errorMessage}
          </MessageBar>
        )}
        {successMessage && (
          <MessageBar messageBarType={MessageBarType.success} isMultiline>
            {successMessage}
          </MessageBar>
        )}
        
        <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <DefaultButton
            text="Browse"
            onClick={handleBrowseClick}
            disabled={isUploading}
            iconProps={{ iconName: 'FolderOpen' }}
          />
          <TextField
            value={selectedFile?.name || ''}
            placeholder="No file selected"
            readOnly
            styles={{ root: { flex: 1 } }}
          />
        </Stack>

        {selectedFile && (
          <Stack tokens={{ childrenGap: 4 }}>
            <Stack horizontal horizontalAlign="space-between">
              <span style={{ fontSize: '12px', color: '#605e5c' }}>
                File size: {formatFileSize(selectedFile.size)}
              </span>
              {characterCount > 0 && (
                <span style={{ fontSize: '12px', color: characterCount > MAX_CHARACTERS ? '#d13438' : '#605e5c' }}>
                  Characters: {characterCount.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()}
                </span>
              )}
            </Stack>
            {extractedText && (
              <div style={{ 
                maxHeight: '150px', 
                overflow: 'auto', 
                padding: '8px', 
                backgroundColor: '#f3f2f1', 
                borderRadius: '4px',
                fontSize: '12px',
                border: '1px solid #edebe9'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Preview (first 500 characters):</div>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {extractedText.substring(0, 500)}
                  {extractedText.length > 500 && '...'}
                </div>
              </div>
            )}
          </Stack>
        )}

        {isUploading && (
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Spinner size={SpinnerSize.small} />
            <span>Processing document...</span>
          </Stack>
        )}

        <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="end">
          <DefaultButton text="Cancel" onClick={handleDismiss} disabled={isUploading} />
          <PrimaryButton
            text="Upload"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            iconProps={{ iconName: 'Upload' }}
          />
        </Stack>
      </Stack>
    </Dialog>
  )
}

export default DocumentUploadDialog

