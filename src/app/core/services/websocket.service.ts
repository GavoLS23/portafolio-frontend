/**
 * Servicio WebSocket para previsualización en tiempo real y autoguardado.
 *
 * Conexión: ws://host/ws/preview?token=<jwt>
 *
 * El token va como query param porque los WebSockets del navegador
 * no admiten headers personalizados en el handshake inicial.
 *
 * Mensajes soportados:
 *  - Servidor → Cliente: preview_update | autosave_ack | error
 *  - Cliente → Servidor: autosave
 *
 * El servicio reconecta automáticamente si se pierde la conexión
 * (con backoff exponencial hasta 30 segundos).
 */
import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import {
  WsServerMessage,
  WsPreviewUpdate,
  WsAutosaveAck,
  WsAutosaveRequest,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private readonly auth = inject(AuthService);

  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 1000;
  private readonly MAX_DELAY = 30_000;

  /** true cuando la conexión WebSocket está establecida */
  readonly isConnected = signal(false);

  /** Último mensaje preview_update recibido */
  readonly lastPreviewUpdate = signal<WsPreviewUpdate | null>(null);

  /** Último ack de autoguardado recibido */
  readonly lastAutosaveAck = signal<WsAutosaveAck | null>(null);

  /** Error del servidor (se limpia en el próximo mensaje exitoso) */
  readonly serverError = signal<string | null>(null);

  // ── Conexión ──────────────────────────────────────────────────────────────

  /**
   * Establece la conexión WebSocket con el token actual.
   * Llamar desde el AdminLayoutComponent al iniciar sesión.
   */
  connect(): void {
    const token = this.auth.token();
    if (!token || this.ws?.readyState === WebSocket.OPEN) return;

    const url = `${environment.wsUrl}/ws/preview?token=${token}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.isConnected.set(true);
      this.reconnectDelay = 1000; // reset backoff
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data as string);
    };

    this.ws.onclose = (event) => {
      this.isConnected.set(false);
      // Solo reconectar si el cierre no fue por token inválido (403)
      if (event.code !== 4003 && this.auth.isLoggedIn()) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.isConnected.set(false);
    };
  }

  /** Cierra la conexión WebSocket de forma limpia */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
    this.isConnected.set(false);
  }

  // ── Envío de mensajes ─────────────────────────────────────────────────────

  /**
   * Envía una petición de autoguardado al servidor.
   * El servidor responde con un autosave_ack.
   */
  sendAutosave(request: WsAutosaveRequest): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(request));
    }
  }

  // ── Ciclo de vida ─────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.disconnect();
  }

  // ── Privado ───────────────────────────────────────────────────────────────

  private handleMessage(raw: string): void {
    try {
      const msg = JSON.parse(raw) as WsServerMessage;
      this.serverError.set(null);

      switch (msg.type) {
        case 'preview_update':
          this.lastPreviewUpdate.set(msg as WsPreviewUpdate);
          break;
        case 'autosave_ack':
          this.lastAutosaveAck.set(msg as WsAutosaveAck);
          break;
        case 'error':
          this.serverError.set((msg as { type: string; message: string }).message);
          break;
      }
    } catch {
      // Ignorar mensajes malformados (e.g. pings del servidor)
    }
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = setTimeout(() => {
      this.connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.MAX_DELAY);
    }, this.reconnectDelay);
  }
}
