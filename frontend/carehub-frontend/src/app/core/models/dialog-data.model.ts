export interface ResultDialogData {
  titolo: string;
  messaggio: string;
  resultClass?: string;
}

export interface ConfirmDialogData {
  titolo?: string;
  messaggio?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}
