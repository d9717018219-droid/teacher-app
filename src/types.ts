export interface JobLead {
  'Order ID': string;
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
}

export interface TutorProfile {
  'Name': string;
  'Tutor ID': string;
  'Preferred City': string;
  'Fee/Month': string;
  'Gender': string;
  'Age': string;
  'Qualification(s)': string;
  'Experience': string;
  'School Exp.': string;
  'Preferred Subject(s)': string;
  'Preferred Class Group': string;
  'Mode of Teaching': string;
  'Preferred Time': string;
  'Preferred Location(s)': string;
  'Address': string;
  'Have own Vehicle': string;
  'Record Added': string;
  'Verified': string;
  'Status': string;
  'About'?: string;
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
