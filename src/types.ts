export type Language = 'en' | 'fr' | 'ar';

export interface User {
  id: string;
  name: string;
  role: 'employer' | 'worker';
  skills?: string[];
  location?: string;
}

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: string;
  employerId: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
}
