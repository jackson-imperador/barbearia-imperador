export interface PaymentProvider {
  createCharge(amount: number, currency: string, source: string, description?: string): Promise<any>;
  refundCharge(chargeId: string, amount?: number): Promise<any>;
  getChargeStatus(chargeId: string): Promise<any>;
}