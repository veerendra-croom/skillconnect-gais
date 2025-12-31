
import { supabase } from './supabase';

export const StorageService = {
  uploadFile: async (bucket: 'avatars' | 'verification-docs' | 'job-images', file: File, userId: string) => {
    // Generate a unique file path: folder/timestamp-filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) throw error;

    // Return the full path key used by Supabase Storage
    return data.path;
  },

  getPublicUrl: (bucket: 'avatars' | 'job-images', path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  createSignedUrl: async (bucket: 'verification-docs', path: string) => {
    // Create a signed URL valid for 60 seconds
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60);

    if (error) throw error;
    return data.signedUrl;
  }
};
