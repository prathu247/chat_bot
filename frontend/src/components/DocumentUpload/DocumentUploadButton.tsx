import { CommandBarButton, IButtonProps } from '@fluentui/react'
import styles from '../common/Button.module.css'

interface DocumentUploadButtonProps extends IButtonProps {
  onClick: () => void
  text?: string
}

export const DocumentUploadButton: React.FC<DocumentUploadButtonProps> = ({ onClick, text }) => {
  return (
    <CommandBarButton
      className={styles.shareButtonRoot}
      iconProps={{ iconName: 'Document' }}
      onClick={onClick}
      text={text}
    />
  )
}

