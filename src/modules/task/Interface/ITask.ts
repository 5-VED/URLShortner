// Create interface for Task

export interface ITask {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    isDeleted?: boolean;
    userId: string;
    createdAt?: Date;
    completedAt?: Date | null;
}


