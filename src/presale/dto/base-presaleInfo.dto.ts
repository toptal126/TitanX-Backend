export class BasePresaleInfoDto {
  address: string;
  owner: string;
  external_links: Array<{
    name: string;
    link: string;
  }>;
  description?: string;
  update?: string;
  signature?: string;
}
