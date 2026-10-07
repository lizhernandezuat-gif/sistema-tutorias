/**
 * Servicio de Almacenamiento Persistente en Base de Datos Real (IndexedDB W3C + LocalStorage Dual-Layer)
 * Desarrollador 2: Persistencia real sin datos mock hardcodeados en memoria.
 * Permite que al cerrar o refrescar la aplicación, todos los usuarios, tutorados, citas,
 * notas, actividades y archivos (con su contenido Base64/Blob) se mantengan íntegros.
 */

const DB_NAME = 'SistemaTutorias_DB';
const DB_VERSION = 2;

export type StoreName =
  | 'usuarios'
  | 'tutores'
  | 'estudiantes'
  | 'asignaciones'
  | 'citas'
  | 'archivos'
  | 'actividades'
  | 'notas';

const STORES: StoreName[] = [
  'usuarios',
  'tutores',
  'estudiantes',
  'asignaciones',
  'citas',
  'archivos',
  'actividades',
  'notas'
];

class DatabaseStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isIndexedDBAvailable: boolean;

  constructor() {
    this.isIndexedDBAvailable = typeof window !== 'undefined' && 'indexedDB' in window;
    if (this.isIndexedDBAvailable) {
      this.initDB();
    }
  }

  /**
   * Inicializa la conexión y crea los almacenes de objetos (tablas) si no existen
   */
  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (!this.isIndexedDBAvailable) {
        reject(new Error('IndexedDB no está disponible en este entorno.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        STORES.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('Error al abrir IndexedDB, usando almacenamiento en localStorage:', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Obtiene todos los registros de una tabla
   */
  public async getAll<T extends { id: string | number }>(storeName: StoreName): Promise<T[]> {
    // 1. Intentar desde IndexedDB
    try {
      const db = await this.initDB();
      const records = await new Promise<T[]>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as T[]) || []);
        req.onerror = () => reject(req.error);
      });

      if (records !== undefined && records !== null) {
        return records;
      }
    } catch {
      // Fallback a localStorage únicamente si IndexedDB arrojó error de apertura/transacción
    }

    // 2. Fallback a localStorage
    try {
      const key = `db_${storeName}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as T[];
      }
    } catch {
      // Ignorar errores de parseo
    }

    return [];
  }

  /**
   * Obtiene un registro por su clave primaria ID
   */
  public async getById<T extends { id: string | number }>(
    storeName: StoreName,
    id: string | number
  ): Promise<T | null> {
    try {
      const db = await this.initDB();
      return await new Promise<T | null>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(id);
        req.onsuccess = () => resolve((req.result as T) || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      const all = await this.getAll<T>(storeName);
      return all.find((item) => item.id === id) || null;
    }
  }

  /**
   * Guarda o actualiza un registro en la base de datos (Upsert)
   */
  public async put<T extends { id: string | number }>(storeName: StoreName, item: T): Promise<void> {
    // 1. Guardar en IndexedDB
    try {
      const db = await this.initDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        // Protección: nunca sobreescribir en IndexedDB con el placeholder
        if (storeName === 'archivos' && (item as any).contenidoDataUrl === '[ALMACENADO_EN_INDEXEDDB]') {
          resolve();
          return;
        }
        const req = store.put(item);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`Fallo al escribir en IndexedDB (${storeName}):`, err);
    }

    // 2. Dual-mirror en localStorage para respaldo rápido (omitir archivos gigantes para no saturar 5MB)
    try {
      const key = `db_${storeName}`;
      const all = await this.getAll<T>(storeName);
      const idx = all.findIndex((existing) => existing.id === item.id);
      if (idx >= 0) {
        all[idx] = item;
      } else {
        all.push(item);
      }

      // Si es almacén de archivos, creamos copia ligera sin base64 pesado para localStorage
      if (storeName === 'archivos') {
        const lightweight = (all as any[]).map((a) => {
          if (a.contenidoDataUrl && a.contenidoDataUrl.length > 50000) {
            return { ...a, contenidoDataUrl: '[ALMACENADO_EN_INDEXEDDB]' };
          }
          return a;
        });
        localStorage.setItem(key, JSON.stringify(lightweight));
      } else {
        localStorage.setItem(key, JSON.stringify(all));
      }
    } catch {
      // Ignorar límite de cuota en localStorage si IndexedDB ya lo guardó
    }
  }

  /**
   * Guarda múltiples registros en una transacción por lotes
   */
  public async putMany<T extends { id: string | number }>(
    storeName: StoreName,
    items: T[]
  ): Promise<void> {
    try {
      const db = await this.initDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        items.forEach((item: any) => {
          if (storeName === 'archivos' && item.contenidoDataUrl === '[ALMACENADO_EN_INDEXEDDB]') {
            return;
          }
          store.put(item);
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn(`Error en putMany (${storeName}):`, err);
    }

    try {
      const key = `db_${storeName}`;
      if (storeName === 'archivos') {
        const lightweight = (items as any[]).map((a) => {
          if (a.contenidoDataUrl && a.contenidoDataUrl.length > 50000) {
            return { ...a, contenidoDataUrl: '[ALMACENADO_EN_INDEXEDDB]' };
          }
          return a;
        });
        localStorage.setItem(key, JSON.stringify(lightweight));
      } else {
        localStorage.setItem(key, JSON.stringify(items));
      }
    } catch {
      // Ignorar
    }
  }

  /**
   * Elimina un registro por ID
   */
  public async delete(storeName: StoreName, id: string | number): Promise<void> {
    try {
      const db = await this.initDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn(`Error al eliminar en IndexedDB (${storeName}):`, err);
    }

    try {
      const key = `db_${storeName}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const all: any[] = JSON.parse(raw);
        const filtrados = all.filter((x) => String(x.id) !== String(id));
        localStorage.setItem(key, JSON.stringify(filtrados));
      }

      if (storeName === 'archivos') {
        const rawArchivos = localStorage.getItem('sistema_tutorias_archivos_v2');
        if (rawArchivos) {
          const all: any[] = JSON.parse(rawArchivos);
          const filtrados = all.filter((x) => String(x.id) !== String(id));
          localStorage.setItem('sistema_tutorias_archivos_v2', JSON.stringify(filtrados));
        }
      }
    } catch {
      // Ignorar
    }
  }


  /**
   * Limpia todos los registros de una tabla
   */
  public async clear(storeName: StoreName): Promise<void> {
    try {
      const db = await this.initDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Ignorar
    }

    try {
      localStorage.removeItem(`db_${storeName}`);
      if (storeName === 'archivos') {
        localStorage.removeItem('sistema_tutorias_archivos_v2');
      }
    } catch {
      // Ignorar
    }
  }

  /**
   * Exporta toda la base de datos a un archivo JSON para respaldo o auditoría
   */
  public async exportAllData(): Promise<Record<StoreName, any[]>> {
    const backup: Partial<Record<StoreName, any[]>> = {};
    for (const store of STORES) {
      backup[store] = await this.getAll(store);
    }
    return backup as Record<StoreName, any[]>;
  }

  /**
   * Importa y reemplaza los datos desde un respaldo JSON
   */
  public async importAllData(data: Record<StoreName, any[]>): Promise<boolean> {
    try {
      for (const store of STORES) {
        if (Array.isArray(data[store])) {
          await this.clear(store);
          await this.putMany(store, data[store]);
        }
      }
      return true;
    } catch (e) {
      console.error('Error al importar base de datos:', e);
      return false;
    }
  }

  /**
   * Reinicia la base de datos completa a un estado limpio
   */
  public async resetAll(): Promise<void> {
    for (const store of STORES) {
      await this.clear(store);
    }
    // Limpiar claves históricas de localStorage
    const legacyKeys = [
      'sistema_tutorias_asignaciones_v2',
      'sistema_tutorias_citas_v2',
      'sistema_tutorias_archivos_v2',
      'sistema_tutorias_actividades_v2',
      'sistema_tutorias_usuarios_v1',
      'sistema_tutorias_jwt_token_v1',
      'sistema_tutorias_tutores_extra_v1',
      'sistema_tutorias_estudiantes_extra_v1',
      'sistema_tutorias_notas_personales_v1'
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
  }

  /**
   * Verifica si la base de datos ya fue inicializada previamente
   */
  public async hasData(): Promise<boolean> {
    const usuarios = await this.getAll('usuarios');
    return usuarios.length > 0;
  }
}

export const dbStorage = new DatabaseStorageService();
