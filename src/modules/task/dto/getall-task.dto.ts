import { Type } from 'class-transformer';
import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { TaskStatus } from '../../../../prisma/generated/prisma/client';

export class GetAllTaskDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @IsOptional()
    page?: number = 1;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    limit?: number = 10;

    @IsString()
    @IsOptional()
    userId?: string;

    @IsEnum(TaskStatus, { message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED' })
    @IsOptional()
    status?: TaskStatus;

    @IsString()
    @IsOptional()
    search?: string;
}
