export interface WhatsAppProvider {
  sendMessage(to: string, message: string): Promise<boolean>;
  sendTemplate(to: string, templateId: string, variables: Record<string, any>): Promise<boolean>;
  checkNumberStatus(phone: string): Promise<boolean>;
}
