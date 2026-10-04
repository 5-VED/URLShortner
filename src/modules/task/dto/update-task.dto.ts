import {
    IsString,
    IsOptional,
    MinLength,
    MaxLength,
    IsEnum,
} from 'class-validator';
import { TaskStatus } from '../../../../prisma/generated/prisma/client';

export class UpdateTaskDto {
    @IsString()
    @IsOptional()
    @MinLength(2, { message: 'Title must be at least 2 characters' })
    @MaxLength(50, { message: 'Title must not exceed 50 characters' })
    title?: string;

    @IsString()
    @IsOptional()
    @MinLength(2, { message: 'Description must be at least 2 characters' })
    @MaxLength(50, { message: 'Description must not exceed 50 characters' })
    description?: string;

    @IsEnum(TaskStatus, { message: 'Status must be PENDING, IN_PROGRESS, or COMPLETED' })
    @IsOptional()
    status?: TaskStatus;
}
