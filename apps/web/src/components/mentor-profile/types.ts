export interface MentorOffer {
  id: string;
  mentorId: string;
  title: string;
  description?: string;
  durationMinutes: number;
  price: number;
  currency?: string;
  isActive?: boolean;
}

export interface PublicMentorProfile {
  id: string;
  userId: string;
  name: string;
  headline?: string;
  bio?: string;
  specialties: string[];
  expertise: string[];
  topicIds: string[];
  languages: string[];
  hourlyRate?: number;
  availability?: {
    timezone: string;
    schedule: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  };
  certifications?: Array<{
    name: string;
    fileUrl: string;
    fileKey: string;
    uploadedAt: string | Date;
  }>;
  introVideoUrl?: string;
  rating?: number;
  totalMeetings: number;
  totalReviews: number;
  verified: boolean;
  isActive: boolean;
  onboardingStep?: string;
  approvalStatus?: string;
  approvalNote?: string;
  approvedAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  avatarUrl?: string | null;
}

export interface MentorProfilePageData {
  mentor: PublicMentorProfile;
  offers: MentorOffer[];
}
