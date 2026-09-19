import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from '@nestjs/common';

import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from 'bcrypt';
import { UserResponse, UsersResponse } from './interfaces/users-response.interface';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
    ) {}

    async findAll(): Promise<UsersResponse> {
        const user = await this.prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return {
            message: 'All users found successfully',
            data: user
        };
    }

    async findOne(
        id: number,
        userId: number,
        role: string
    ): Promise<UserResponse> {
        if (id !== userId && role !== 'ADMIN') {
            throw new ForbiddenException(
                'You are not allowed to access this user',
            );
        }

        const user = await this.prisma.user.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} was not found`);
        }

        return {
            message: `User ID ${id} found successfully`,
            data: user
        };
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: {
                email,
            },
        });
    }

    async create(
        createUserDto: CreateUserDto
    ): Promise<UserResponse> {
        const passwordHash = await bcrypt.hash(
            createUserDto.password,
            10,
        );

        const user = await this.prisma.user.create({
            data: {
                fullName: createUserDto.fullName,
                email: createUserDto.email,
                passwordHash: passwordHash,
                phoneNumber: createUserDto.phoneNumber,
                role: createUserDto.role,
                createdAt: new Date(),
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                role: true,
                createdAt: true,
            },
        });

        return {
            message: 'New user created successfully',
            data: user
        };
    }

    async update(
        id: number,
        updateUserDto: UpdateUserDto,
        userId: number,
        role: string
    ): Promise<UserResponse> {
        const user = await this.prisma.user.findUnique({
            where: {
                id,
            },
        });

        if (!user) {
            throw new NotFoundException(
            `User ID ${id} was not found`,
            );
        }

        if (role !== 'ADMIN' && id !== userId) {
            throw new ForbiddenException(
                'You are not allowed to update this user'
            );
        }

        if (role !== 'ADMIN' && updateUserDto.role !== undefined) {
            throw new ForbiddenException(
                'Only admins can change user roles'
            );
        }

        const updatedUser = await this.prisma.user.update({
            where: {
                id,
            },
            data: {
                ...updateUserDto,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                role: true,
                updatedAt: true,
            },
        });

        return {
            message: `User ID ${id} updated successfully`,
            data: updatedUser
        };
    }

    async changePassword(
        userId: number,
        changePasswordDto: ChangePasswordDto,
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(
            changePasswordDto.currentPassword,
            user.passwordHash,
        );

        if (!isPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        const hashedPassword = await bcrypt.hash(
            changePasswordDto.newPassword,
            10,
        );

        await this.prisma.user.update({
            where: { id: userId },
            data: {
            passwordHash: hashedPassword,
            },
        });

        return {
            message: 'Password updated successfully',
        };
    }

    async remove(
        id: number,     
        userId: number, 
        role: string
    ): Promise<UserResponse> {
        const user = await this.prisma.user.findUnique({
            where: {
                id,
            },
        });

        if (!user) {
            throw new NotFoundException(
            `User ID ${id} was not found`,
            );
        }

        // Users can only delete themselves
        if (id !== userId && role !== 'ADMIN') {
            throw new ForbiddenException(
                'You can only delete your own account',
            );
        }

        // Prevent an admin from deleting themselves
        if (role === 'ADMIN' && id === userId) {
            throw new ForbiddenException(
                'Admin cannot delete their own account',
            );
        }

        const deletedUser = await this.prisma.user.delete({
            where: {
                id,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                role: true,
            },
        });

        return {
            message: `User ID ${id} deleted successfully`,
            data: deletedUser,
        };
    }
}
