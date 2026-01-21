import { Stack, PrimaryButton, DefaultButton } from '@fluentui/react'
import { DownloadRegular, UploadRegular } from '@fluentui/react-icons'
import styles from './DocumentUploadWelcomeMessage.module.css'

interface DocumentUploadWelcomeMessageProps {
  onDownloadSample: () => void
  onUploadClick: () => void
}

export const DocumentUploadWelcomeMessage: React.FC<DocumentUploadWelcomeMessageProps> = ({
  onDownloadSample,
  onUploadClick
}) => {
  return (
    <div className={styles.welcomeMessageContainer}>
      <div className={styles.welcomeMessage}>
        <h3 className={styles.welcomeTitle}>Welcome to Document Upload</h3>
        <p className={styles.welcomeText}>
          Upload a Word document (.docx) to analyze its content. You can download a sample file to see the format, or upload your own document.
        </p>
        <Stack tokens={{ childrenGap: 12 }} className={styles.buttonContainer}>
          <DefaultButton
            text="Download Sample File"
            iconProps={{ iconName: 'Download' }}
            onClick={onDownloadSample}
            className={styles.downloadButton}
          />
          <PrimaryButton
            text="Upload Document"
            iconProps={{ iconName: 'Upload' }}
            onClick={onUploadClick}
            className={styles.uploadButton}
          />
        </Stack>
      </div>
    </div>
  )
}

