import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetAllTaskDto } from './dto/getall-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';
import { AuthGuard } from 'src/common/guards/roles/auth.guard';
import { DeleteTaskDto } from './dto/delete-task.dto';
import { GetTaskDto } from './dto/get-task.dto';

@ApiTags('Tasks')
@Controller('task')
export class TaskController {
    constructor(private readonly taskService: TaskService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createTask(@Body() createTaskDto: CreateTaskDto) {
        return this.taskService.createTask(createTaskDto);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @Get('all')
    @HttpCode(HttpStatus.OK)
    async getAllTasks(@Query() getAllTaskDto: GetAllTaskDto) {
        return this.taskService.getAllTasks(getAllTaskDto);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async getTask(@Param() params: GetTaskDto) {
        return this.taskService.getTask({ id: params.id });
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @Patch(':id')
    @HttpCode(HttpStatus.OK)
    async updateTask(
        @Param('id') id: string,
        @Body() updateTaskDto: UpdateTaskDto,
    ) {
        return this.taskService.updateTask(id, updateTaskDto);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async deleteTask(@Param() params: DeleteTaskDto) {
        return this.taskService.deleteTask({ id: params.id });
    }
}
