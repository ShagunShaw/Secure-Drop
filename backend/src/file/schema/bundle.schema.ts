import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';
import ms from 'ms';

@Schema()
export class Bundle extends Document {
  @Prop({ required: true, unique: true })
  accessCode: string; // A short, unique ID for the URL (e.g., 'abc-123')

  @Prop({ required: true })
  cloudinaryUrl: string;

  @Prop({ required: true })
  cloudinaryPublicId: string; // Needed for when we want to delete it later

  @Prop({ required: true, default: () => new Date(Date.now() + ms('6h')) })
  expiresAt: Date; 
}


export const BundleSchema = SchemaFactory.createForClass(Bundle);