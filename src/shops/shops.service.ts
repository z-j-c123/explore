import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { QueryShopDto } from './dto/query-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class ShopsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
  ) {}

  async create(dto: CreateShopDto) {
    return this.prisma.shop.create({ data: dto });
  }

  async createWithImage(dto: CreateShopDto, file?: Express.Multer.File) {
    const imageUrl = file
      ? await this.upload.saveImage(file.buffer, file.mimetype, file.originalname)
      : dto.imageUrl;
    return this.prisma.shop.create({
      data: { ...dto, imageUrl },
    });
  }

  async findAll(query: QueryShopDto) {
    const where: Prisma.ShopWhereInput = {};

    if (query.q?.trim()) {
      where.OR = [
        { name: { contains: query.q.trim(), mode: 'insensitive' } },
        { notes: { contains: query.q.trim(), mode: 'insensitive' } },
        { address: { contains: query.q.trim(), mode: 'insensitive' } },
      ];
    }
    if (query.minRating != null || query.maxRating != null) {
      where.rating = {};
      if (query.minRating != null) where.rating.gte = query.minRating;
      if (query.maxRating != null) where.rating.lte = query.maxRating;
    }
    if (query.wouldRetry != null) {
      where.wouldRetry = query.wouldRetry;
    }
    if (query.platform) {
      where.platform = { equals: query.platform, mode: 'insensitive' };
    }

    return this.prisma.shop.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const shop = await this.prisma.shop.findUnique({ where: { id } });
    if (!shop) throw new NotFoundException('店铺不存在');
    return shop;
  }

  async update(id: string, dto: UpdateShopDto) {
    await this.findOne(id);
    return this.prisma.shop.update({ where: { id }, data: dto });
  }

  async updateWithImage(
    id: string,
    dto: UpdateShopDto,
    file?: Express.Multer.File,
  ) {
    await this.findOne(id);
    const imageUrl = file
      ? await this.upload.saveImage(file.buffer, file.mimetype, file.originalname)
      : undefined;
    return this.prisma.shop.update({
      where: { id },
      data: imageUrl ? { ...dto, imageUrl } : dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.shop.delete({ where: { id } });
  }

  async stats() {
    const [total, avgResult, blacklist] = await Promise.all([
      this.prisma.shop.count(),
      this.prisma.shop.aggregate({ _avg: { rating: true } }),
      this.prisma.shop.count({ where: { rating: { lte: 2 } } }),
    ]);
    return {
      total,
      averageRating: avgResult._avg.rating
        ? Number(avgResult._avg.rating.toFixed(1))
        : 0,
      blacklist,
    };
  }
}
