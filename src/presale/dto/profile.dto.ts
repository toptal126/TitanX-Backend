export class BaseProfileDto {
  wallet: string;
}

export class CreateProfileDto extends BaseProfileDto {
  signature: string;
}
