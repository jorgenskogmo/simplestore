import { observe, subscribe } from "./simplestore";

// define Store type
interface Store {
	num: number;
	str: string;
	arr: number[];
	obj: object;
	objs: object;
	substore: Partial<Store>;
}

// create an observable with initial values
const store = observe<Store>({
	num: 1,
	str: "one",
	arr: [1, 2, 3],
	obj: { x: 1, y: 1, z: 1 },
	objs: { a: { name: "js" }, b: { obj: { name: "nested" } } },
	substore: { num: 100 },
});

// listen to changes
const unsubscribe0 = subscribe(store, (values) => {
	// console.log("@sub0", values);
});

// listen to changes, immediate
const unsubscribe1 = subscribe(
	store,
	(values) => {
		// console.log("@subs1", values);
	},
	true,
);

// Alternatives to subscribe():
// listen to changed-event, manually grab current values
store.addEventListener("changed", () => {
	// console.log("@subs2", store.get());
});

// listen to changed-event, use CustomEvent's detail prop
// TODO: Would be awesome if we could avoid the 'CustomEvent<Store>' part!
store.addEventListener("changed", (event: CustomEvent<Store>) => {
	console.log("@subs3", event.detail.num);
});

store.set({ num: 2, str: "two", arr: [4, 5, 6] });

// unsubscribe0();

// store.set({ num: 3, obj: { y: 2, z: 3 } });

// store.set({ num: 4, objs: { a: { name: "js2" }, c: "cee" } });

// store.set({ num: 5, substore: { num: 200, str: "alo" } });

// unsubscribe1();

// store.set({ str: "no more listeners" });
