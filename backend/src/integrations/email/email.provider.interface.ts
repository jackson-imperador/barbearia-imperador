export interface EmailProvider {
  sendEmail(to: string, subject: string, body: string, isHtml?: boolean): Promise<boolean>;
  sendTemplateEmail(to: string, templateId: string, variables: Record<string, any>): Promise<boolean>;
}
