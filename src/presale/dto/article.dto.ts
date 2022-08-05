export class BaseArticleDto {
  wallet: string;
  subject?: string;
  markdown: string;
  tags: string;
}

export class CreateArticleDto extends BaseArticleDto {
  thread: string;
  CreateArticleDto: string;
}

export class DraftArticleDto extends BaseArticleDto {
  _id: string;
}

export class PublishArticleDto extends BaseArticleDto {
  signatureHash: string;
}
