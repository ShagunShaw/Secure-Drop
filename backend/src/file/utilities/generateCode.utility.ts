import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export const generateUniqueCode = async (model: Model<any>): Promise<string> => {
    const code = uuidv4().split('-')[0];
  
    const exists = await model.findOne({ accessCode: code });
    if (exists) {
      return generateUniqueCode(model);
    }

    return code;
  }