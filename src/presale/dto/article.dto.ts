export class BaseArticleDto {
  wallet: string;
  subject?: string;
  giphyLink?: string;
  markdown: string;
  tags: string;
}

export class CreateArticleDto extends BaseArticleDto {
  thread: string;
  signatureHash: string;
}

export class DraftArticleDto extends BaseArticleDto {
  _id: string;
}

export class PublishArticleDto extends BaseArticleDto {
  signatureHash: string;
}
