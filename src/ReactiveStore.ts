import { PropertyType, ReactiveStoreInterface } from './types';

export class ReactiveStore<T extends Record<string, unknown>> implements ReactiveStoreInterface<T> {
  private data: T;
  private subscribers = new Set<() => void>();
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(initialData: T) {
    this.data = this.deepClone(initialData);
  }

  private deepClone<U>(obj: U): U {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.deepClone(item)) as U;

    const clone = {} as U;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clone[key] = this.deepClone(obj[key]);
      }
    }
    return clone;
  }

  private createProxy<U extends object>(target: U, path: string = ""): U {
    return new Proxy(target, {
      get: (obj: U, prop: string | symbol): unknown => {
        if (typeof prop !== "string") return Reflect.get(obj, prop);

        if (prop === "get") {
          return () => {
            const value = path ? this.getNestedValue(this.data, path) : obj;
            return value;
          };
        }
        if (prop === "set") {
          return <V extends PropertyType<U>>(value: V) => {
            if (path) {
              this.setNestedValue(this.data, path, this.deepClone(value));
            } else {
              Object.assign(obj, this.deepClone(value));
            }
            this.notifySubscribers();
          };
        }
        if (prop === "merge") {
          return <V extends Partial<U>>(value: V) => {
            const currentValue = path ? this.getNestedValue(this.data, path) : obj;
            if (currentValue && typeof currentValue === "object") {
              this.mergeDeep(currentValue as U, value);
              this.notifySubscribers();
            }
          };
        }

        const newPath = path ? `${path}.${prop}` : prop;
        const value = Reflect.get(obj, prop);

        if (value && typeof value === "object") {
          return this.createProxy(value as U, newPath);
        }

        return value;
      },
      set: (obj: U, prop: string | symbol, value: unknown): boolean => {
        if (typeof prop !== "string") return Reflect.set(obj, prop, value);

        const oldValue = Reflect.get(obj, prop);
        if (oldValue === value) return true;

        if (path) {
          this.setNestedValue(this.data, `${path}.${prop}`, value);
        }
        const success = Reflect.set(obj, prop, value);
        if (success) {
          this.notifySubscribers();
        }
        return success;
      },
    });
  }

  private getNestedValue<U>(obj: U, path: string): unknown {
    return path.split(".").reduce((acc, part) => {
      if (acc && typeof acc === "object") {
        return Reflect.get(acc as object, part);
      }
      return undefined;
    }, obj);
  }

  private setNestedValue<U extends object>(obj: U, path: string, value: unknown): void {
    const parts = path.split(".");
    const lastPart = parts.pop()!;
    const target = parts.reduce((acc, part) => {
      if (acc && typeof acc === "object") {
        return Reflect.get(acc, part);
      }
      return undefined;
    }, obj as object);

    if (target && typeof target === "object") {
      Reflect.set(target, lastPart, value);
    }
  }

  public notifySubscribers(): void {
    if (this.batchTimeout !== null) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.subscribers.forEach((callback) => callback());
      this.batchTimeout = null;
    }, 0);
  }

  public mergeDeep<U extends object>(target: U, source: Partial<U>): void {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        const targetValue = target[key as keyof U];

        if (
          sourceValue &&
          typeof sourceValue === "object" &&
          !Array.isArray(sourceValue) &&
          targetValue &&
          typeof targetValue === "object" &&
          !Array.isArray(targetValue)
        ) {
          this.mergeDeep(targetValue as U, sourceValue as Partial<U>);
        } else {
          Reflect.set(target, key, this.deepClone(sourceValue));
        }
      }
    }
  }

  public subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public getProxy(): T {
    return this.createProxy(this.data);
  }
}
