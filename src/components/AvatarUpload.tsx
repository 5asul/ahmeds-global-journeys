
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, User as UserIcon } from 'lucide-react';
import { toast as sonnerToast } from "sonner";

interface AvatarUploadProps {
  userId: string | undefined;
  initialAvatarUrl: string | null;
  onUpload: (filePath: string) => void;
  size?: number;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ userId, initialAvatarUrl, onUpload, size = 150 }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setAvatarUrl(initialAvatarUrl);
  }, [initialAvatarUrl]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) {
      sonnerToast.error("User not identified. Cannot upload avatar.");
      return;
    }
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL (assuming bucket is public or RLS allows access)
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setAvatarUrl(publicUrl);
      onUpload(filePath); // Pass the path, not the public URL, for DB storage
      sonnerToast.success("Avatar updated successfully!");

    } catch (error: any) {
      sonnerToast.error("Error uploading avatar", { description: error.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar style={{ height: size, width: size }}>
        <AvatarImage src={avatarUrl || undefined} alt="User avatar" />
        <AvatarFallback style={{ height: size, width: size }}>
          <UserIcon style={{ height: size / 2, width: size / 2 }} className="text-gray-400" />
        </AvatarFallback>
      </Avatar>
      <div>
        <Label htmlFor="avatar-upload" className="cursor-pointer">
          <Button variant="outline" asChild>
            <span>
              <UploadCloud className="mr-2 h-4 w-4" /> {uploading ? 'Uploading...' : 'Upload Avatar'}
            </span>
          </Button>
        </Label>
        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading || !userId}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default AvatarUpload;
