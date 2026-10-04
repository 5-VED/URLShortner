import {
    IsString,
    IsNotEmpty,
    MinLength,
    MaxLength,
    IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
    @ApiProperty({
        description: 'The title of the task',
        example: 'Complete NestJS assignment',
        minLength: 2,
        maxLength: 50,
    })
    @IsString()
    @IsNotEmpty({ message: 'Title is required' })
    @MinLength(2, { message: 'Title must be at least 2 characters' })
    @MaxLength(50, { message: 'Title must not exceed 50 characters' })
    title!: string;

    @ApiPropertyOptional({
        description: 'Detailed description of the task',
        example: 'Add Swagger documentation and authentication to task endpoints',
        minLength: 2,
        maxLength: 50,
    })
    @IsString()
    @IsOptional()
    @MinLength(2, { message: 'Description must be at least 2 characters' })
    @MaxLength(50, { message: 'Description must not exceed 50 characters' })
    description?: string;

    @ApiProperty({
        description: 'The ID of the user who owns the task',
        example: 'c1234567-89ab-cdef-0123-456789abcdef',
    })
    @IsString()
    @IsNotEmpty({ message: 'User ID is required' })
    userId!: string;
}
