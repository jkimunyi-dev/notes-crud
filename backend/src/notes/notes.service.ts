import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(private prisma: PrismaService) {}

  async create(createNoteDto: CreateNoteDto, userId: string) {
    try {
      const note = await this.prisma.note.create({
        data: {
          ...createNoteDto,
          userId,
        },
      });
      this.logger.log(`Note created: ${note.id} by user: ${userId}`);
      return note;
    } catch (error) {
      this.logger.error(`Error creating note: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(userId: string) {
    try {
      return await this.prisma.note.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(`Error fetching notes: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const note = await this.prisma.note.findUnique({
        where: { id },
      });

      if (!note) {
        throw new NotFoundException('Note not found');
      }

      if (note.userId !== userId) {
        this.logger.warn(`User ${userId} attempted to access note ${id} belonging to ${note.userId}`);
        throw new ForbiddenException('You do not have permission to access this note');
      }

      return note;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error fetching note ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, updateNoteDto: UpdateNoteDto, userId: string) {
    try {
      // First check if note exists and belongs to user
      await this.findOne(id, userId);

      // Update the note
      const updatedNote = await this.prisma.note.update({
        where: { id },
        data: updateNoteDto,
      });

      this.logger.log(`Note updated: ${id} by user: ${userId}`);
      return updatedNote;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error updating note ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    try {
      // First check if note exists and belongs to user
      await this.findOne(id, userId);

      // Delete the note
      await this.prisma.note.delete({
        where: { id },
      });

      this.logger.log(`Note deleted: ${id} by user: ${userId}`);
      return { message: 'Note deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      this.logger.error(`Error deleting note ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
