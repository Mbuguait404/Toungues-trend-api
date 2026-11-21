import { Model } from 'mongoose';
import { ModulesService } from './modules.service';
import { CourseModule, ModuleDocument } from './schemas/module.schema';

describe('ModulesService course access', () => {
  const moduleData = {
    _id: 'module-id',
    courseId: 'course-id',
    level: 'A1',
    isPublished: true,
    accessType: 'premium',
    content: 'legacy full lesson body',
    notes: 'teacher-only notes',
    parts: [
      { _id: 'free-part', title: 'Preview', content: 'Free introduction', accessType: 'free', order: 0 },
      { _id: 'paid-part', title: 'Grammar', content: 'Premium grammar lesson', accessType: 'premium', order: 1 },
    ],
  };
  const model = {
    findById: jest.fn(),
  };
  const courseAccess = {
    getAccess: jest.fn(),
  };
  let service: ModulesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ModulesService(
      model as unknown as Model<ModuleDocument>,
      courseAccess as any,
    );
    model.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        ...moduleData,
        toObject: () => moduleData,
      }),
    });
  });

  it('returns only free part content to preview learners', async () => {
    courseAccess.getAccess.mockResolvedValue({ level: 'preview' });

    const result = await service.findById('module-id', 'learner-id', 'LEARNER') as any;

    expect(result.parts[0].content).toBe('Free introduction');
    expect(result.parts[1].content).toBeUndefined();
    expect(result.content).toBeUndefined();
    expect(result.notes).toBeUndefined();
    expect(result.locked).toBe(false);
  });

  it('hides all lesson content from locked learners when no part is free', async () => {
    courseAccess.getAccess.mockResolvedValue({ level: 'locked' });
    const lockedModule = {
      ...moduleData,
      parts: moduleData.parts.map((part) => ({ ...part, accessType: 'premium' })),
    };
    model.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        ...lockedModule,
        toObject: () => lockedModule,
      }),
    });

    const result = await service.findById('module-id', 'learner-id', 'LEARNER') as any;

    expect(result.parts.every((part: any) => part.content === undefined)).toBe(true);
    expect(result.content).toBeUndefined();
    expect(result.locked).toBe(true);
  });
});