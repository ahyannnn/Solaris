// client/src/services/socketService.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.currentUserId = null;
    this.isConnected = false;
    this.listeners = new Map(); // event -> Set of callbacks
  }

  /**
   * Get server URL from environment or fallback
   */
  getServerUrl() {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000';
  }

  /**
   * Initialize and connect socket for the current user
   * @param {string} userId - Current user MongoDB _id
   */
  connect(userId) {
    if (!userId) {
      console.warn('⚠️ [SocketService] connect called without userId');
      return;
    }

    // If already connected with the same user, just re-join room to be safe
    if (this.socket && this.isConnected && this.currentUserId === userId) {
      this.socket.emit('joinUser', userId);
      return;
    }

    // If user changed or socket exists in bad state, disconnect first
    if (this.socket) {
      this.disconnect();
    }

    this.currentUserId = userId;
    const serverUrl = this.getServerUrl();

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log(`🔌 [SocketService] Connected to server (${this.socket.id})`);
      if (this.currentUserId) {
        this.socket.emit('joinUser', this.currentUserId);
        console.log(`👤 [SocketService] Joined room user:${this.currentUserId}`);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      this.isConnected = true;
      console.log(`🔄 [SocketService] Reconnected on attempt ${attemptNumber}`);
      if (this.currentUserId) {
        this.socket.emit('joinUser', this.currentUserId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log(`🔌 [SocketService] Disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.warn('⚠️ [SocketService] Connection error:', error.message);
    });

    // Re-attach all registered listeners to the new socket instance
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((cb) => {
        this.socket.on(event, cb);
      });
    });
  }

  /**
   * Register an event listener safely without duplicate bindings
   * @param {string} event - Event name (e.g. 'notification:new')
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const callbacks = this.listeners.get(event);
    if (!callbacks.has(callback)) {
      callbacks.add(callback);
      if (this.socket) {
        this.socket.on(event, callback);
      }
    }
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Emit an event to the server
   * @param {string} event - Event name
   * @param {*} data - Payload
   */
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`⚠️ [SocketService] Cannot emit "${event}": socket not connected`);
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentUserId = null;
    this.listeners.clear();
    console.log('🔌 [SocketService] Disconnected and cleaned up');
  }

  /**
   * Get raw socket instance
   */
  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
