export class BasePresaleInfoDto {
  address: string;
  owner: string;
  tokenAddress?: string;
  hardCap?: number;
  presaleRate?: number;
  listingRate?: number;
  minContribution?: number;
  maxContribution?: number;
  liquidityPercentage?: number;
  liquidityLockupTime?: number;
  presaleStartTime?: number;
  presaleEndTime?: number;

  kycLink?: string;
  auditLink?: string;
  external_links: Array<{
    name: string;
    link: string;
  }>;
  description?: string;
  update?: string;
}
