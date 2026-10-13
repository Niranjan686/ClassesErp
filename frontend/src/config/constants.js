/**
 * ClassTech Centralized System Constants & Configuration
 * Provides single-source-of-truth constants, messages, and role definitions across the platform.
 */

export const BRAND_CONFIG = {
  name: 'ClassTech',
  tagline: 'One Smart Platform. Every School Connected.',
  subtitle: 'Next-Generation School & Campus Operating System',
  supportEmail: 'support@classtech.in',
  version: '2.4.0',
};

// Standardized UI Notification Messages (Eliminates scattered hardcoded alerts)
export const SYSTEM_MESSAGES = {
  // Student operations
  STUDENT_REGISTER_SUCCESS: 'Student enrolled and assigned class code successfully!',
  STUDENT_UPDATE_SUCCESS: 'Student profile updated successfully.',
  STUDENT_DELETE_CONFIRM: 'Are you sure you want to withdraw this student? This action cannot be undone.',
  STUDENT_DELETE_SUCCESS: 'Student record removed from directory.',

  // Attendance operations
  ATTENDANCE_SAVED: 'Daily batch attendance recorded and synchronized with parent app.',
  ATTENDANCE_BIOMETRIC_PUNCH: 'Biometric punch authenticated successfully.',
  ATTENDANCE_OFFLINE_SAVED: 'Punch recorded offline in device memory. Will sync when Wi-Fi restores.',

  // Fees operations
  FEE_PAYMENT_SUCCESS: 'Fee transaction processed and official receipt generated.',
  FEE_INSTALLMENT_UPDATED: 'Installment ledger updated successfully.',

  // Network & Session
  NETWORK_OFFLINE: 'Internet connection dropped. Offline store-and-forward active.',
  NETWORK_ONLINE: 'Back online! Syncing queued records with cloud database...',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again to continue.',
  UNAUTHORIZED: 'Access restricted. You do not have permissions to view this module.',

  // File Vault & Uploads
  FILE_UPLOAD_SUCCESS: 'File uploaded and assembled in Vault without timeouts.',
  FILE_DELETE_SUCCESS: 'File permanently removed from Vault.',
  FILE_DOWNLOAD_STARTED: 'Secure file download stream initiated.',

  // Generic errors
  API_GENERIC_ERROR: 'Unable to complete request. Please verify your connection or try again.',
  FORM_VALIDATION_ERROR: 'Please review and fill in all mandatory fields before proceeding.',
};

// Roles & Capabilities Matrix
export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  OWNER: 'owner',
  ADMIN: 'admin',
  STAFF: 'staff',
  TEACHER: 'teacher',
  STUDENT: 'student',
};

// Onboarding Walkthrough Steps Configuration
export const ONBOARDING_CONFIG = {
  STORAGE_KEY: 'classtech_onboarding_completed_v1',
  ADMIN_STEPS: [
    {
      targetId: 'nav-dashboard',
      title: 'Welcome to ClassTech HQ 👋',
      description: 'Your command center for real-time attendance, fee collections, student enrollments, and academic health.',
    },
    {
      targetId: 'nav-students',
      title: 'Student 360° Directory',
      description: 'Enroll new students, view admission history, and manage unique auto-prefixed Roll / Class Codes.',
    },
    {
      targetId: 'nav-attendance',
      title: 'Zero-Failure Attendance Engine',
      description: 'Record daily batch rosters or view real-time punches streamed from your hardware biometric terminals.',
    },
    {
      targetId: 'nav-fees',
      title: 'Automated Fee Management',
      description: 'Track outstanding balances, generate official PDF receipts, and send automated fee reminders.',
    },
    {
      targetId: 'nav-reports',
      title: 'Instant Intelligence & Reports',
      description: 'Export comprehensive academic, attendance, and financial reports ready for board reviews.',
    },
  ],
  STUDENT_STEPS: [
    {
      targetId: 'student-home-hero',
      title: 'Welcome to Your Student Portal! 🎓',
      description: 'Track your daily batch schedules, real-time attendance, test marks, and study notes.',
    },
    {
      targetId: 'student-attendance-tab',
      title: 'Live Attendance Records',
      description: 'View your monthly attendance percentage and instant timestamps.',
    },
    {
      targetId: 'student-fees-tab',
      title: 'Fee Receipts & Dues',
      description: 'View paid installments and download tax-compliant fee receipts.',
    },
  ],
};
