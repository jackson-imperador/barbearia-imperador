export interface PixProvider {
  generateQrCode(amount: number, description: string, referenceId: string): Promise<{ qrCode: string, copyPaste: string, txid: string }>;
  checkPaymentStatus(txid: string): Promise<'PENDING' | 'PAID' | 'EXPIRED'>;
  registerWebhook(url: string): Promise<boolean>;
}
