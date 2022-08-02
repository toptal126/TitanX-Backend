export class BaseProfileDto {
  wallet: string;
}

export class CreateProfileDto extends BaseProfileDto {}
export class UpdateProfileDto extends BaseProfileDto {
  username?: string;
  bio?: string;
  avatarLink?: string;
  bannerLink?: string;
  signatureHash: string;
}
export class VerifyProfileDto extends BaseProfileDto {
  signatureHash: string;
}

export class UpdateClientLocationDto extends BaseProfileDto {
  clientInfo: any;
  signatureHash: string;
}
