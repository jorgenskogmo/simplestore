// Typesafe, Proxied, Subscribable object store

interface SubscriptionsTracker {
  subscribers: WeakMap<object, (v) => void>;
  keys: Set<object>;
}

// map a ID to a proxied-object
const proxyIds = new Map();

// map a ID to a list of subscribers (GC'able) and list of keys (iteratable)
const register: Map<string, SubscriptionsTracker> = new Map<
  string,
  SubscriptionsTracker
>();

export function proxy<T extends object>(obj: T): T {
  const idx = `P${proxyIds.size}`;
  console.log("creating proxy", idx);

  const proxied = new Proxy(obj, {
    get: function (target, prop) {
      return Reflect.get(target, prop);
    },
    set: function (target, prop, value) {
      Reflect.set(target, prop, value);
      // call all subscribers
      let keys = register.get(idx).keys;
      let subscribers = register.get(idx).subscribers;
      keys.forEach((key) => {
        if (!subscribers.has(key)) {
          keys.delete(key);
        } else {
          subscribers.get(key)(target as T);
        }
      });

      return true;
    },
  });

  proxyIds.set(proxied, idx);

  register.set(idx, {
    subscribers: new WeakMap<object, (v: T) => void>(),
    keys: new Set<object>(),
  });

  return proxied;
}

function remove(idx: string, fn: (v: any) => void): void {
  if (register.has(idx)) {
    let keys = register.get(idx).keys;
    let subscribers = register.get(idx).subscribers;
    keys.forEach((key) => {
      if (!subscribers.has(key)) {
        keys.delete(key);
      } else if (subscribers.get(key) === fn) {
        subscribers.delete(key);
        keys.delete(key);
      }
    });
  }
}

export function subscribe<T>(store: T, fn: (values: T) => void): () => void {
  const idx = proxyIds.get(store);
  // let key = {};
  let key = fn;
  register.get(idx).keys.add(key);
  register.get(idx).subscribers.set(key, fn);

  return () => {
    remove(idx, fn);
  };
}
