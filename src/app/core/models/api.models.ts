/**
 * Modelos TypeScript que mapean exactamente la API del backend Scala.
 *
 * Convenciones:
 *  - Los IDs son UUID v4 en formato string.
 *  - Las fechas son strings ISO 8601.
 *  - Los campos opcionales usan `| null` para alinear con la semántica del backend.
 *
 * @see API_CONTEXT.md para la documentación completa de endpoints.
 */

// ── Tipos primitivos compartidos ─────────────────────────────────────────────

/** Idiomas soportados por la plataforma */
export type Language = 'es' | 'en';

/** Estado de publicación de proyectos */
export type ProjectStatus = 'draft' | 'published';

/** Estado de publicación de posts de blog */
export type PostStatus = 'draft' | 'published';

/** Tipo de archivo multimedia */
export type MediaType = 'image' | 'video';

// ── Respuesta de error estándar ───────────────────────────────────────────────

/**
 * Estructura de error devuelta por todos los endpoints del backend.
 * El campo `error` es el nombre de la clase de error en Scala.
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

// ── Autenticación ─────────────────────────────────────────────────────────────

/** Payload para iniciar sesión */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Respuesta del endpoint de login con el JWT */
export interface LoginResponse {
  token: string;
  /** ISO 8601 — fecha de expiración del token */
  expiresAt: string;
}

// ── Traducciones ──────────────────────────────────────────────────────────────

/**
 * Traducción de un proyecto en un idioma dado.
 * Se usa tanto en creación como en respuestas.
 */
export interface ProjectTranslation {
  language: Language;
  title: string;
  /** Descripción corta (resumen para tarjetas y listados) */
  description: string;
  /** Descripción larga (cuerpo de la página de detalle) */
  longDescription: string;
}

/**
 * Traducción de un post de blog en un idioma dado.
 */
export interface BlogTranslation {
  language: Language;
  title: string;
  /** Extracto corto para listados y SEO */
  excerpt: string;
  /** Contenido completo en formato HTML (generado por TipTap) */
  content: string;
}

// ── Tecnologías ───────────────────────────────────────────────────────────────

/** Tecnología devuelta por la API */
export interface TechnologyResponse {
  id: string;
  name: string;
  iconUrl: string | null;
}

/** Payload para crear o actualizar una tecnología */
export interface CreateTechnologyRequest {
  name: string;
  iconUrl?: string | null;
}

// ── Proyectos ─────────────────────────────────────────────────────────────────

/** Proyecto devuelto por la API (público y admin) */
export interface ProjectResponse {
  id: string;
  slug: string;
  status: ProjectStatus;
  displayOrder: number;
  demoUrl: string | null;
  repositoryUrl: string | null;
  thumbnailMediaId: string | null;
  /** URL pública resuelta por el backend a partir de thumbnailMediaId */
  thumbnailUrl: string | null;
  translations: ProjectTranslation[];
  technologyIds: string[];
  createdAt: string;
  updatedAt: string;
}

/** Payload para crear un proyecto nuevo */
export interface CreateProjectRequest {
  slug: string;
  demoUrl?: string | null;
  repositoryUrl?: string | null;
  translations: ProjectTranslation[];
  technologyIds: string[];
}

/** Payload para actualizar un proyecto (todos los campos son opcionales) */
export interface UpdateProjectRequest {
  slug?: string;
  status?: ProjectStatus;
  demoUrl?: string | null;
  repositoryUrl?: string | null;
  thumbnailMediaId?: string | null;
  translations?: ProjectTranslation[];
  technologyIds?: string[];
}

/** Payload para reordenar proyectos via drag & drop */
export interface ReorderRequest {
  /** IDs en el nuevo orden deseado */
  orderedIds: string[];
}

// ── Blog ──────────────────────────────────────────────────────────────────────

/** Post de blog devuelto por la API */
export interface BlogPostResponse {
  id: string;
  slug: string;
  status: PostStatus;
  thumbnailMediaId: string | null;
  /** URL pública resuelta por el backend a partir de thumbnailMediaId */
  thumbnailUrl: string | null;
  publishedAt: string | null;
  translations: BlogTranslation[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

/** Payload para crear un post de blog */
export interface CreateBlogPostRequest {
  slug: string;
  translations: BlogTranslation[];
  tags: string[];
}

/** Payload para actualizar un post (todos los campos son opcionales) */
export interface UpdateBlogPostRequest {
  slug?: string;
  status?: PostStatus;
  thumbnailMediaId?: string | null;
  translations?: BlogTranslation[];
  tags?: string[];
}

// ── Media ─────────────────────────────────────────────────────────────────────

/** Archivo multimedia guardado en S3 (o servidor local en dev) */
export interface MediaResponse {
  id: string;
  /** URL pública del archivo — apunta a S3 en producción */
  url: string;
  filename: string;
  mimeType: string;
  mediaType: MediaType;
  sizeBytes: number;
  widthPx: number | null;
  heightPx: number | null;
  /** Duración en segundos (solo para videos) */
  durationS: number | null;
  createdAt: string;
}

/** Paso 1 del flujo de subida: solicitar URL firmada */
export interface PresignedUploadRequest {
  filename: string;
  mimeType: string;
  mediaType: MediaType;
  sizeBytes: number;
}

/** Respuesta del paso 1: URL de subida directa + ID del media */
export interface PresignedUploadResponse {
  /** URL a la que hacer PUT con el archivo binario */
  uploadUrl: string;
  /** ID generado para este archivo (usar en el paso 3) */
  mediaId: string;
  /** Clave del archivo en S3 o ruta local en dev */
  s3Key: string;
  /** Segundos hasta que caduca la URL de subida */
  expiresInS: number;
}

/** Paso 3 del flujo de subida: confirmar y guardar metadata */
export interface ConfirmUploadRequest {
  mediaId: string;
  widthPx?: number | null;
  heightPx?: number | null;
  durationS?: number | null;
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

/** Tipos de mensajes que envía el servidor via WebSocket */
export type WsServerMessageType = 'preview_update' | 'autosave_ack' | 'error';

/** Mensaje genérico del servidor */
export interface WsServerMessage {
  type: WsServerMessageType;
}

/** El servidor avisa que una entidad cambió */
export interface WsPreviewUpdate extends WsServerMessage {
  type: 'preview_update';
  entityType: 'project' | 'blog_post';
  entityId: string;
  data: ProjectResponse | BlogPostResponse;
}

/** El servidor confirma un autoguardado */
export interface WsAutosaveAck extends WsServerMessage {
  type: 'autosave_ack';
  entityId: string;
  savedAt: string;
}

/** El servidor envía un error */
export interface WsErrorMessage extends WsServerMessage {
  type: 'error';
  message: string;
}

/** Mensaje de autoguardado que envía el cliente */
export interface WsAutosaveRequest {
  type: 'autosave';
  entityId: string;
  data: UpdateProjectRequest | UpdateBlogPostRequest;
}
