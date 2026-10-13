/**
 * Tipos TypeScript del frontend, espejo de la API REST documentada en
 * README-backend.md.
 */

// ---------------------------------------------------------------------------
// API genérica
// ---------------------------------------------------------------------------

/** Cuerpo de error estándar: `{ error: { code, message, details } }` */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Respuesta paginada de los listados: `{ data, meta }` */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Query estándar de paginación de listados */
export interface PageQuery {
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Salud
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: 'ok' | 'error';
  uptime: number;
  timestamp: string;
  env: string;
  db: 'up' | 'down';
}

// ---------------------------------------------------------------------------
// Usuarios y roles
// ---------------------------------------------------------------------------

export type RoleName = 'admin' | 'organizador' | 'ponente' | 'asistente';

export type UserStatus = 'pending' | 'active' | 'inactive';

export interface Role {
  id: number;
  name: RoleName;
}

export interface User {
  id: number;
  name: string;
  lastName: string;
  email: string;
  entity: string | null;
  educationLevel: string | null;
  phone: string | null;
  status: UserStatus;
  emailVerifiedAt: string | null;
  role: Role;
}

// ---------------------------------------------------------------------------
// Autenticación
// ---------------------------------------------------------------------------

export interface RegisterPayload {
  name: string;
  lastName: string;
  email: string;
  password: string;
  entity?: string;
  educationLevel?: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface SuccessResponse {
  success: boolean;
}

// ---------------------------------------------------------------------------
// Ponentes
// ---------------------------------------------------------------------------

export interface Speaker {
  id: number;
  userId: number | null;
  name: string;
  academicDegree: string | null;
  institution: string | null;
  bio: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpeakerPayload {
  name: string;
  academicDegree?: string;
  institution?: string;
  bio?: string;
  userId?: number;
  /** Archivo de fotografía (multipart/form-data) */
  photo?: File;
}

// ---------------------------------------------------------------------------
// Ubicaciones
// ---------------------------------------------------------------------------

export interface Location {
  id: number;
  name: string;
  building: string | null;
  capacity: number | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocationPayload {
  name: string;
  building?: string;
  capacity?: number;
  address?: string;
}

// ---------------------------------------------------------------------------
// Ponencias
// ---------------------------------------------------------------------------

export type TalkStatus = 'scheduled' | 'cancelled';

export interface AttendanceWindow {
  opensAt: string;
  closesAt: string;
  isOpen: boolean;
}

export interface Talk {
  id: number;
  title: string;
  description: string | null;
  /** Fecha AAAA-MM-DD */
  date: string;
  /** Hora HH:mm */
  startTime: string;
  /** Hora HH:mm */
  endTime: string;
  durationMinutes: number;
  status: TalkStatus;
  location: Location | null;
  speakers: Speaker[];
  attendanceWindow: AttendanceWindow;
  createdAt: string;
  updatedAt: string;
}

export interface TalkPayload {
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  locationId?: number;
  status?: TalkStatus;
  speakerIds?: number[];
  attendanceOpensAt?: string;
  attendanceClosesAt?: string;
}

export type TalkQuery = PageQuery & {
  search?: string;
  /** Fecha AAAA-MM-DD */
  date?: string;
  locationId?: number;
  status?: TalkStatus;
};

// ---------------------------------------------------------------------------
// Asistencia
// ---------------------------------------------------------------------------

export type RegistrationStatus = 'registered' | 'attended' | 'cancelled';

export interface Registration {
  id: number;
  talkId: number;
  userId: number;
  status: RegistrationStatus;
  registeredAt: string;
  attendedAt: string | null;
  talk?: Talk;
  user?: User;
}

export interface QRToken {
  talkId: number;
  token: string;
  opensAt: string;
  closesAt: string;
}

export interface CheckinResponse {
  alreadyAttended: boolean;
  registration: Registration;
}

// ---------------------------------------------------------------------------
// Constancias
// ---------------------------------------------------------------------------

export interface CertificateThreshold {
  minTalks: number | null;
  minHours: number | null;
}

export interface Certificate {
  id: number;
  userId: number;
  code: string;
  issuedAt: string;
  talksCount: number;
  hoursTotal: number;
  threshold: CertificateThreshold;
  downloadUrl: string;
  user?: User;
}

export interface Eligibility {
  eligible: boolean;
  metric: 'talks' | 'hours' | 'both';
  talksCount: number;
  hoursTotal: number;
  minutesTotal: number;
  threshold: CertificateThreshold;
  talks: Talk[];
}

export interface CertificateVerify {
  valid: boolean;
  code: string;
  holder: string;
  talksCount: number;
  hoursTotal: number;
  issuedAt: string;
}
