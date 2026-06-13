export interface JobLead {
  'Order ID': string;
  id?: string;
  order_id?: string;
  'Internal Remark': string | null;
  'Updated Time': string;
  'Record Added'?: string;
  City: string;
  Name?: string;
  'Class / Board'?: string;
  Class?: string;
  Board?: string;
  Locations?: string;
  Gender?: string;
  Fee?: string;
  Notes?: string;
  subjects?: string;
  residency?: string;
  duration?: string;
  days?: string;
  time?: string;
  mode?: string;
  status?: string;
  email?: string;
  phone?: string;
  address?: string;
  locality?: string;
}

export interface TutorProfile {
  tutor_id: string;
  name: string;
  email: string;
  phone: string;
  internal_phone: string;
  gender: string;
  age: string;
  dob: string;
  qualification: string[];
  experience: string;
  school_teacher: string;
  days: string;
  time: string;
  class_group: string[];
  subjects: string[];
  city: string;
  location: string[];
  have_vehicle: string;
  communication: string;
  mode: string;
  fee: string;
  about: string;
  status: string;
  photo: string;
  verified: string;
  created_time: string;
  selfie?: string;
  
  // Legacy fields (optional)
  id?: string;
  Verified?: string;
  Status?: string;
}

export interface ApiResponse<T> {
  status: string;
  data: T[];
  message?: string;
}

export interface Alert {
  id: string;
  message: string;
  city: string;
  localities?: string[];
  gender?: string;
  targetClass?: string;
  targetUserType?: UserType | 'all';
  type: 'urgent' | 'info' | 'success' | 'broadcast';
  timestamp: any;
  sender: string;
  link?: string;
}

export type UserType = 'parent' | 'teacher';
export type UserGender = 'Male' | 'Female' | 'All';

export interface ConnectionRequest {
  id: string;
  parentId: string;
  tutorId: string;
  parentName: string;
  tutorName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt: any;
  updatedAt: any;
  lastMessage?: string;
  lastMessageTime?: any;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: any;
  read: boolean;
}
