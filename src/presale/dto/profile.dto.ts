export class BaseArticleDto {
  author: string;
  markdown: string;
  tags: string;
}

export class CreateArticleDto extends BaseArticleDto {
  thread: string;
  signature: string;
}
