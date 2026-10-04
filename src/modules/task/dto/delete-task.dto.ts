import { IsUUID } from 'class-validator';

export class DeleteTaskDto {
    @IsUUID()
    id: string;
}