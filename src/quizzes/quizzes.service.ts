import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz, QuizDocument } from './schemas/quiz.schema';
import { QuizAttempt, QuizAttemptDocument } from './schemas/quiz-attempt.schema';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { CourseModule, ModuleDocument } from '../modules/schemas/module.schema';
import { CourseAccessService } from '../common/course-access.service';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
    @InjectModel(QuizAttempt.name) private attemptModel: Model<QuizAttemptDocument>,
    @InjectModel(CourseModule.name) private modules: Model<ModuleDocument>,
    private courseAccess: CourseAccessService,
  ) {}

  async findByModule(moduleId: string, userId: string, role: string) {
    const quizzes = await this.quizModel.find({ moduleId });
    return Promise.all(quizzes.map(async (quiz) => {
      if (!await this.canAccessQuiz(quiz, userId, role)) {
        return { _id: quiz._id, moduleId: quiz.moduleId, title: quiz.title, accessType: quiz.accessType, locked: true, questions: [] };
      }
      const data = quiz.toObject();
      for (const question of data.questions ?? []) {
        delete (question as any).correctIndex;
        delete (question as any).explanation;
      }
      return { ...data, locked: false };
    }));
  }

  findById(id: string) {
    return this.quizModel.findById(id);
  }

  async findByIdForLearner(id: string, userId: string, role: string) {
    const quiz = await this.quizModel.findById(id);
    if (!quiz) return null;
    if (!await this.canAccessQuiz(quiz, userId, role)) {
      return { _id: quiz._id, moduleId: quiz.moduleId, title: quiz.title, accessType: quiz.accessType, locked: true, questions: [] };
    }
    const data = quiz.toObject();
    for (const question of data.questions ?? []) {
      delete (question as any).correctIndex;
      delete (question as any).explanation;
    }
    return { ...data, locked: false };
  }

  private async canAccessQuiz(quiz: QuizDocument, userId: string, role: string) {
    if (role === 'ADMIN' || role === 'TEACHER') return true;
    const module = await this.modules.findById(quiz.moduleId).select('courseId level accessType').lean();
    if (!module) return false;
    if (!module.isPublished) return false;
    if (quiz.accessType === 'free') return true;
    if (module.accessType === 'free') return true;
    const access = await this.courseAccess.getAccess(userId, role, module.courseId.toString(), module.level);
    return access.level === 'full';
  }

  create(dto: CreateQuizDto, createdBy: string) {
    return this.quizModel.create({ ...dto, createdBy });
  }

  update(id: string, dto: Partial<CreateQuizDto>) {
    return this.quizModel.findByIdAndUpdate(id, dto, { new: true });
  }

  delete(id: string) {
    return this.quizModel.findByIdAndDelete(id);
  }

  async submitAttempt(userId: string, quizId: string, dto: SubmitAttemptDto, role: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (!await this.canAccessQuiz(quiz, userId, role)) throw new ForbiddenException('This quiz is locked');
    if (!quiz.questions || quiz.questions.length === 0) throw new BadRequestException('Quiz has no questions');

    const { answers } = dto;
    if (answers.length !== quiz.questions.length) {
      throw new BadRequestException(`Expected ${quiz.questions.length} answers, got ${answers.length}`);
    }

    let correct = 0;
    for (let i = 0; i < quiz.questions.length; i++) {
      if (answers[i] === quiz.questions[i].correctIndex) correct++;
    }

    const score = Math.round((correct / quiz.questions.length) * 100);
    const passScore = quiz.passScore ?? 70;

    return this.attemptModel.create({
      userId: new Types.ObjectId(userId),
      quizId: new Types.ObjectId(quizId),
      answers,
      score,
      passed: score >= passScore,
    });
  }

  async getAttempts(userId: string, quizId: string, role: string) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (!await this.canAccessQuiz(quiz, userId, role)) throw new ForbiddenException('This quiz is locked');
    return this.attemptModel.find({
      userId: new Types.ObjectId(userId),
      quizId: new Types.ObjectId(quizId),
    }).sort({ attemptedAt: -1 });
  }

  async getBestAttempt(userId: string, quizId: string) {
    return this.attemptModel.findOne({
      userId: new Types.ObjectId(userId),
      quizId: new Types.ObjectId(quizId),
      passed: true,
    }).sort({ score: -1 });
  }
}
