import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quiz, QuizDocument } from './schemas/quiz.schema';
import { QuizAttempt, QuizAttemptDocument } from './schemas/quiz-attempt.schema';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz.name) private quizModel: Model<QuizDocument>,
    @InjectModel(QuizAttempt.name) private attemptModel: Model<QuizAttemptDocument>,
  ) {}

  findByModule(moduleId: string) {
    return this.quizModel.find({ moduleId }).select('-questions.correctIndex -questions.explanation');
  }

  findById(id: string) {
    return this.quizModel.findById(id);
  }

  findByIdForLearner(id: string) {
    return this.quizModel.findById(id).select('-questions.correctIndex -questions.explanation');
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

  async submitAttempt(userId: string, quizId: string, dto: SubmitAttemptDto) {
    const quiz = await this.quizModel.findById(quizId);
    if (!quiz) throw new NotFoundException('Quiz not found');
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

  async getAttempts(userId: string, quizId: string) {
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
