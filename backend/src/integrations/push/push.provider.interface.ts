export interface PushProvider {
  sendPush(userId: string, title: string, body: string, data?: Record<string, any>): Promise<boolean>;
  sendToTopic(topic: string, title: string, body: string): Promise<boolean>;
  registerDeviceToken(userId: string, token: string): Promise<void>;
}
