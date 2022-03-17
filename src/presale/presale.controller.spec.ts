import { Test, TestingModule } from '@nestjs/testing';
import { PresaleController } from './presale.controller';

describe('PresaleController', () => {
  let controller: PresaleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PresaleController],
    }).compile();

    controller = module.get<PresaleController>(PresaleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
