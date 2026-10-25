import { Controller, Post, Get, Body, Param, Headers, Req, Res, HttpStatus } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('pix')
  async createPix(@Body() body: { amount: number; description: string; email: string; externalReference: string }) {
    const pix = await this.paymentsService.generatePix(
      body.amount, 
      body.description || 'PIX Payment', 
      body.email, 
      body.externalReference || 'direct_pix_' + Date.now()
    );
    return {
      paymentId: pix.paymentId,
      qrCode: pix.qrCode,
      qrCodeBase64: pix.qrCodeBase64,
      copiaCola: pix.qrCode,
      expirationDate: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min
    };
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Headers('x-signature') signature: string, @Res() res: any) {
    // MercadoPago usually sends action="payment.created" or "payment.updated"
    // and data.id = paymentId.
    if (body.type === 'payment' && body.data?.id) {
      // Background processing, send 200 OK immediately
      this.paymentsService.processWebhook(body.data.id).catch(console.error);
    }
    return res.status(HttpStatus.OK).send('OK');
  }

  @Get(':paymentId/status')
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    const status = await this.paymentsService.getPaymentStatus(paymentId);
    return { status };
  }
}
