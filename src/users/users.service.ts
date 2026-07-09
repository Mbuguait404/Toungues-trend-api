import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, Role } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(data: Partial<User>): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async createByAdmin(data: Partial<User>): Promise<UserDocument> {
    const exists = await this.userModel.findOne({ email: data.email });
    if (exists) throw new ConflictException('Email already registered');
    
    // Hash password if provided, otherwise you might generate one
    const password = data.password ? await bcrypt.hash(data.password, 12) : undefined;
    
    return this.userModel.create({
      ...data,
      password,
      isActive: true
    });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findAll(query: any = {}): Promise<UserDocument[]> {
    const { role, isActive, page = 1, limit = 20 } = query;
    const filter: any = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    return this.userModel.find(filter).skip((page - 1) * limit).limit(Number(limit)).exec();
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateRole(id: string, role: Role): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(id, { role }, { new: true });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateStatus(id: string, isActive: boolean): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { refreshToken: token });
  }

  async findByRefreshToken(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId).select('+refreshToken').exec();
  }
}
