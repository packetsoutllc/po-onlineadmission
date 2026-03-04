
import React from 'react';

export interface ChatMessage {
    id: string | number;
    text: string;
    sender?: 'user' | 'ai' | 'system' | 'model';
    role?: 'user' | 'model';
    timestamp: string | number;
    imageUrl?: string;
    image?: string;
    fromHuman?: boolean;
    isStreaming?: boolean;
    groundingMetadata?: { uri: string; title?: string }[];
}

export interface GeminiContent {
    role: string;
    parts: ({ text: string } | { inlineData: { mimeType: string; data: string } })[];
}

export interface Attachment {
  file: File;
  previewUrl: string;
  base64?: string;
  mimeType?: string;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  attachments?: Attachment[];
  isError?: boolean;
  isThinking?: boolean;
  groundingMetadata?: { web?: { uri: string; title?: string } }[];
}

export interface AIResponse {
    improvedText: string;
    feedback: string;
}

export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'checkbox' | 'textarea' | 'select';
    required?: boolean;
    value: string | boolean;
    placeholder?: string;
    options?: string[];
}

export interface School {
    id: string;
    name: string;
    type: string;
    location: string;
    rating: number;
    image: string;
    description: string;
    features: string[];
    grades: string;
    curriculum: string;
    tuition: number;
}

// FIX: Added missing exports for Simulated Site
export interface SimulatedSite {
  id: string;
  name: string;
  url: string;
  description: string;
  submitButtonText: string;
  fields: FormField[];
}

// FIX: Added missing exports for Agent terminal
export type AgentStatus = 'idle' | 'analyzing' | 'acting' | 'completed' | 'failed';

export interface AgentLog {
  id: string;
  type: 'thought' | 'action' | 'success' | 'error' | 'system';
  message: string;
  timestamp: Date;
  details?: string;
}

// FIX: Added missing exports for User Profile
export interface UserProfile {
  fullName: string;
  email: string;
  jobTitle: string;
  city: string;
  creditCard: string;
}

// FIX: Added missing exports for Election App
export interface Candidate {
  id: string;
  name: string;
  position: string;
  photoUrl: string;
  manifestoShort: string;
  votes: number;
}

export interface ElectionConfig {
  schoolName: string;
  electionTitle: string;
  date: string;
  startTime: string;
}

// FIX: Added missing exports for Mediroster App
export enum Role {
  ADMIN = 'Admin',
  DOCTOR = 'Doctor',
  NURSE = 'Nurse',
  RECEPTIONIST = 'Receptionist'
}

export enum ShiftType {
  MORNING = 'Morning',
  AFTERNOON = 'Afternoon',
  NIGHT = 'Night',
  ON_CALL = 'On Call'
}

export interface Staff {
  id: string;
  name: string;
  role: Role;
  email: string;
  color: string;
  qualifications: string[];
  maxHoursPerWeek: number;
}

export interface ScheduleEntry {
  id: string;
  staffId: string;
  date: string;
  shiftType: ShiftType;
  synced: boolean;
}

export interface AppState {
  currentUser: any | null;
  staff: Staff[];
  schedule: ScheduleEntry[];
  lastSync: number;
  unsyncedChanges: number;
}

// FIX: Added missing exports for Resume App
export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  location: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  score: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  link: string;
  technologies: string;
}

export interface LanguageItem {
  id: string;
  language: string;
  proficiency: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface ResumeData {
  personal: {
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    summary: string;
    linkedin?: string;
  };
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects: ProjectItem[];
  languages: LanguageItem[];
  certifications: CertificationItem[];
  interests: string[];
}

export type TemplateType = 'modern' | 'creative' | 'professional' | 'minimalist' | 'elegant' | 'tech';

// FIX: Added missing exports for Login and SwiftServe
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role | string;
}

export interface SubService {
  name: string;
  price: number;
}

export interface ServiceCategory {
  title: string;
  description: string;
  icon: any;
  subServices: SubService[];
}
