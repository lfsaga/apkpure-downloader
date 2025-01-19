declare module "node-persist" {
  interface InitOptions {
    dir?: string;
    stringify?: (data: any) => string;
    parse?: (data: string) => any;
    encoding?: string;
    logging?: boolean | ((...args: any[]) => void);
    continuous?: boolean;
    interval?: number;
    ttl?: number;
  }

  interface NodePersist {
    init(options?: InitOptions): Promise<void>;
    initSync(options?: InitOptions): void;
    getItem<T>(key: string): Promise<T | undefined>;
    setItem<T>(key: string, value: T): Promise<void>;
    removeItem(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    values<T>(): Promise<T[]>;
    length(): Promise<number>;
  }

  const nodePersist: NodePersist;

  export = nodePersist;
}
