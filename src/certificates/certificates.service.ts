import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Certificate, CertificateDocument } from './schemas/certificate.schema';

@Injectable()
export class CertificatesService {
  constructor(@InjectModel(Certificate.name) private model: Model<CertificateDocument>) {}

  async generate(data: {
    userId: string; courseId: string; enrollmentId: string;
    level: string; downloadUrl: string;
  }) {
    const verificationCode = uuidv4();
    return this.model.create({ ...data, verificationCode, issuedAt: new Date() });
  }

  findMyCertificates(userId: string) {
    return this.model.find({ userId })
      .populate('courseId', 'title language')
      .sort({ issuedAt: -1 });
  }

  async verify(code: string) {
    const cert = await this.model.findOne({ verificationCode: code })
      .populate('userId', 'name').populate('courseId', 'title language');
    if (!cert) throw new NotFoundException('Certificate not found or invalid code');
    return cert;
  }

  findAll() { return this.model.find().populate('userId courseId', 'name email title language'); }
}
