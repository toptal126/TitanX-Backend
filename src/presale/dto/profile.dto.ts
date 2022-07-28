export class BaseProfileDto {
  wallet: string;
}

export class CreateProfileDto extends BaseProfileDto {}
export class VerifyProfileDto extends BaseProfileDto {
  signatureHash: string;
}
