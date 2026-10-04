import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/datasource/postgres/postgres.service';
import { TaskStatus } from '../../../prisma/generated/prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { DeleteTaskDto } from './dto/delete-task.dto';
import { GetAllTaskDto } from './dto/getall-task.dto';
import { GetTaskDto } from './dto/get-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ITask } from './Interface/ITask';

@Injectable()
export class TaskService {
    private readonly logger = new Logger(TaskService.name);

    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async createTask(
        dto: CreateTaskDto,
    ): Promise<ITask> {
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
            select: { id: true },
        });

        if (!user) {
            throw new NotFoundException(`User with ID '${dto.userId}' not found`);
        }

        const task = await this.prisma.task.create({
            data: {
                title: dto.title,
                description: dto.description,
                userId: dto.userId,
            },
        });

        this.logger.log(`Task created: ${task.title} (id=${task.id}) for user id=${task.userId}`);

        return task;
    }

    async getTask(dto: GetTaskDto) {
        const task = await this.prisma.task.findFirst({
            where: {
                id: dto.id,
                isDeleted: false,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        if (!task) {
            throw new NotFoundException(`Task with ID '${dto.id}' not found`);
        }

        return {
            message: 'Task details fetched successfully',
            task,
        };
    }

    async getAllTasks(dto: GetAllTaskDto) {
        const page = dto.page && dto.page > 0 ? Number(dto.page) : 1;
        const limit = dto.limit && dto.limit > 0 ? Number(dto.limit) : 10;
        const skip = (page - 1) * limit;

        const where: any = {
            isDeleted: false,
        };

        if (dto.userId) {
            where.userId = dto.userId;
        }

        if (dto.status) {
            where.status = dto.status;
        }

        if (dto.search) {
            where.OR = [
                { title: { contains: dto.search, mode: 'insensitive' } },
                { description: { contains: dto.search, mode: 'insensitive' } },
            ];
        }

        const [tasks, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
            }),
            this.prisma.task.count({ where }),
        ]);

        return {
            message: 'Tasks fetched successfully',
            data: tasks,
            total: total,
        };
    }

    async updateTask(id: string, dto: UpdateTaskDto) {
        const existing = await this.prisma.task.findFirst({
            where: {
                id,
                isDeleted: false,
            },
        });

        if (!existing) {
            throw new NotFoundException(`Task with ID '${id}' not found`);
        }

        const data: {
            title?: string;
            description?: string;
            status?: TaskStatus;
            completedAt?: Date | null;
        } = {
            ...(dto.title !== undefined && { title: dto.title }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.status !== undefined && {
                status: dto.status,
                completedAt: dto.status === TaskStatus.COMPLETED ? new Date() : null,
            }),
        };

        const updatedTask = await this.prisma.task.update({
            where: { id },
            data,
        });

        this.logger.log(`Task updated: id=${updatedTask.id}`);

        return {
            message: 'Task updated successfully',
            task: updatedTask,
        };
    }

    async deleteTask(dto: DeleteTaskDto) {
        const existing = await this.prisma.task.findUnique({
            where: { id: dto.id },
        });

        if (!existing || existing.isDeleted) {
            throw new NotFoundException(`Task with ID '${dto.id}' not found`);
        }

        const task = await this.prisma.task.update({
            where: { id: dto.id },
            data: {
                isDeleted: true,
            },
        });

        this.logger.log(`Task deleted: id=${task.id}`);

        return {
            message: 'Task deleted successfully',
            task,
        };
    }
}
