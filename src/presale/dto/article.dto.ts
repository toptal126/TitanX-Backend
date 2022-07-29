export class BaseArticleDto {
  wallet: string;
  subject?: string;
  markdown: string;
  tags: string;
}

export class CreateArticleDto extends BaseArticleDto {
  thread: string;
  signature: string;
}
