export class BasePresaleInfoDto {
  address: string;
  owner: string;
  tokenOwner: string;
  tokenAddress?: string;
  name?: string;
  symbol?: string;
  decimals?: number;

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
