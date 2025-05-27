
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, User as UserIcon } from 'lucide-react';
import { toast as sonnerToast } from "sonner";

interface AvatarUploadProps {
  userId?: string | undefined; // User ID for direct upload mode
  initialAvatarUrl: string | null; // Existing avatar URL to display
  onUpload?: (filePath: string) => void; // Callback with file path after direct upload
  onFileSelected?: (file: File | null) => void; // Callback with selected file for deferred upload
  size?: number;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ userId, initialAvatarUrl, onUpload, onFileSelected, size = 150 }) => {
  const [displayUrl, setDisplayUrl] = useState<string | null>(initialAvatarUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Handles previewing selected file or showing initial avatar
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile);
      setDisplayUrl(objectUrl);
      // Cleanup object URL when component unmounts or selectedFile/initialAvatarUrl changes
      return () => URL.revokeObjectURL(objectUrl);
    } else if (initialAvatarUrl) {
      setDisplayUrl(initialAvatarUrl);
    } else {
      setDisplayUrl(null);
    }
  }, [selectedFile, initialAvatarUrl]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      setSelectedFile(null);
      if (onFileSelected) {
        onFileSelected(null);
      }
      event.target.value = ''; // Reset file input
      return;
    }

    const file = files[0];
    setSelectedFile(file); // Triggers useEffect for preview

    if (userId && onUpload) {
      // Direct upload mode: User ID is available, and onUpload callback is provided
      setUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }
        
        onUpload(filePath); // Pass the storage path
        sonnerToast.success("Avatar updated successfully!");
      } catch (error: any) {
        sonnerToast.error("Error uploading avatar", { description: error.message });
        setSelectedFile(null); // Clear selection on error
        event.target.value = ''; // Reset file input
      } finally {
        setUploading(false);
      }
    } else if (onFileSelected) {
      // Deferred upload mode: Pass the selected file to parent
      onFileSelected(file);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <Avatar style={{ height: size, width: size }}>
        <AvatarImage src={displayUrl || undefined} alt="User avatar" />
        <AvatarFallback style={{ height: size, width: size }}>
          <UserIcon style={{ height: size / 2, width: size / 2 }} className="text-gray-400" />
        </AvatarFallback>
      </Avatar>
      <div>
        <Label htmlFor={`avatar-upload-${userId || 'new'}`} className="cursor-pointer">
          <Button variant="outline" asChild>
            <span>
              <UploadCloud className="mr-2 h-4 w-4" /> 
              {uploading ? 'Processing...' : (userId && onUpload ? 'Change Avatar' : 'Select Avatar')}
            </span>
          </Button>
        </Label>
        <Input
          id={`avatar-upload-${userId || 'new'}`} // Ensure unique ID if multiple instances
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading} // Only disable when actively processing
          className="hidden"
        />
      </div>
    </div>
  );
};

export default AvatarUpload;
