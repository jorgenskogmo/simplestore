import { proxy, subscribe } from "./simplestore";

interface Store {
  num: number;
  str: string;
  arr: number[];
}

const store = proxy<Store>({
  num: 1,
  str: "one",
  arr: [1, 2, 3],
});

const logValues = (values) => {
  console.log("logValues", values);
};

//

console.log("@initial values", store);

// getter

console.log("store.num:", store.num);

// subscribe

subscribe(store, (values) => {
  console.log("@subs", values);
});

const unsubscribe0 = subscribe(store, (values) => {
  console.log("@subs0", values);
});

const unsubscribe1 = subscribe(store, (values) => {
  console.log("@subs1", values);
});

console.log("setting store.str to 'two', 3 subscribers should react");
store.str = "two";

// unsubscribe

console.log("unsubscribing 'subs0' ");
unsubscribe0();

console.log("unsubscribing 'subs1' ");
unsubscribe1();

console.log("setting store.str to 'three', 1 subscribers should react");
store.str = "three";

// unique subscriptions

subscribe(store, logValues);
subscribe(store, logValues);

console.log("setting store.arr to [4,5,6], 2 subscribers should react");
store.arr = [4, 5, 6];

// subscrible from within class
class Foo {
  id: string;
  unsub: () => void;

  constructor() {
    this.id = "alo";
    this.unsub = subscribe(store, (values) => {
      console.log("@Foo sub", this.id, "values:", values);
    });
  }
}

let a = new Foo();

console.log("setting store.num to 5, 3 subscribers should react");
store.num = 5;

// (attempt) to delete the class instance, to see if the weakmap discards its subscription

console.log("nulling Foo/a");
a = null;
a = undefined;
console.log("a (Foo instance):", a);

console.log("setting store.num to 6, 2 subscribers should react");
store.num = 6;

// !!! But there is 3 reactions... Foo/a seems still alive

// Maybe just give the GC some time? Nope.
setTimeout(() => {
  console.log("timeout");
  console.log("a:", a);
  store.num = 7;
}, 500);
