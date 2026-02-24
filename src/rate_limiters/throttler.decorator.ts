import { Throttle } from '@nestjs/throttler';

// Profile 1: 
export const UploadLimit = () => Throttle({ default: { limit: 3, ttl: 60000 } });

// Profile 2: 
export const DownloadLimit = () => Throttle({ default: { limit: 20, ttl: 60000 } });