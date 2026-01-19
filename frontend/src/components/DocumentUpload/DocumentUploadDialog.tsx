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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check if file is a Word document
      if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
          file.name.endsWith('.docx')) {
        setSelectedFile(file)
        setErrorMessage(null)
        setSuccessMessage(null)
      } else {
        setErrorMessage('Please select a Word document (.docx file)')
        setSelectedFile(null)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file first')
      return
    }

    setIsUploading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      // Read the Word document
      const arrayBuffer = await selectedFile.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      const documentText = result.value

      if (!documentText || documentText.trim().length === 0) {
        throw new Error('The document appears to be empty or could not be read')
      }

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

