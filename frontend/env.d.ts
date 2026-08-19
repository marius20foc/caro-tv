/// <reference types="node" />

/**
 * Tipuri minime pentru binding-urile Cloudflare folosite in aplicatie.
 * In productie, @cloudflare/next-on-pages genereaza `worker-configuration.d.ts`
 * cu tipurile oficiale; aceste declaratii acopera dezvoltarea locala si
 * previne erorile de compilare inainte de primul build.
 */
declare global {
  interface D1Result {
    success: boolean;
    results?: unknown[];
    meta?: Record<string, unknown>;
  }

  interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run(): Promise<D1Result>;
    all<T = unknown>(): Promise<{ results: T[]; success: boolean }>;
  }

  interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
    exec(query: string): Promise<D1Result>;
  }

  interface R2Object {
    key: string;
    size: number;
    httpEtag: string;
    arrayBuffer(): Promise<ArrayBuffer>;
  }

  interface R2Bucket {
    put(key: string, value: ArrayBuffer | string, options?: unknown): Promise<R2Object>;
    get(key: string): Promise<R2Object | null>;
    delete(key: string): Promise<void>;
  }

  interface CloudflareEnv {
    DB: D1Database;
    THUMBS?: R2Bucket;
    YOUTUBE_API_KEY?: string;
    SITE_URL?: string;
    CLEANX_HOME?: string;
    MANUAL_TOKEN?: string;
    ADMIN_TOKEN?: string;
    CF_BEACON_TOKEN?: string;
    CACHE_THUMBS?: string;
    CRON_WORKER_URL?: string;
  }

  namespace NodeJS {
    interface ProcessEnv {
      YOUTUBE_API_KEY?: string;
      SITE_URL?: string;
      CLEANX_HOME?: string;
      ADMIN_TOKEN?: string;
      CF_BEACON_TOKEN?: string;
      CRON_WORKER_URL?: string;
    }
  }
}

export {};
