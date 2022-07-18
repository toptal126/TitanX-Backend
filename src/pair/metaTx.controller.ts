import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TxObject } from './interfaces/coinPrice.interface';
import { MetaTxService } from './metaTx.service';

@Controller('meta-tx')
export class MetaTxController {
  constructor(private readonly service: MetaTxService) {}

  @Get()
  async index() {
    return 'Meta Transaction Contoller';
  }

  @Get('approve-sign-code/:ownerAddress')
  async signCode(@Param('ownerAddress') ownerAddress: string) {
    return await this.service.getApproveCode(ownerAddress);
  }

  @Post('perform-meta-tx/:signedCode')
  async perform(
    @Param('signedCode') signedCode: string,
    @Body() txObject: TxObject,
  ) {
    return await this.service.performMetaTx(signedCode, txObject);
  }

  @Get('approve/:ownerAddress')
  async responseToApproval(@Param('ownerAddress') ownerAddress: string) {
    const result = await this.service.actionForApproveTest(ownerAddress);
    return result;
  }
}
