interface StoreEventMap {
	changed: CustomEvent;
}

interface StoreEventTarget extends EventTarget {
	addEventListener<K extends keyof StoreEventMap>(
		type: K,
		listener: (ev: StoreEventMap[K]) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	addEventListener(
		type: string,
		callback: EventListenerOrEventListenerObject | null,
		options?: EventListenerOptions | boolean,
	): void;
}

const typedEventTarget = EventTarget as {
	new (): StoreEventTarget;
	prototype: StoreEventTarget;
};

export class Store<T> extends typedEventTarget {
	#store: T;

	constructor(initialValues: T) {
		super();
		this.#store = initialValues;
	}

	public get(): T {
		return this.#store;
	}

	public set(newValues: Partial<T>): void {
		// console.log("-----");
		// console.log("- new values: ", newValues);
		// TODO: Consider (and document) merging strategy
		// see: https://gist.github.com/ahtcx/0cd94e62691f539160b32ecda18af3d6
		// this.#store = newValues;
		// this.#store = { ...this.#store, ...newValues };
		this.#store = deepMerge(this.#store, newValues);
		// console.log("- store: ", this.#store);

		this.dispatchEvent(
			new CustomEvent("changed", {
				detail: this.#store,
			}),
		);
	}
}

export function observe<T>(obj: T) {
	return new Store<T>(obj);
}

/** @returns function to unsubscribe */
export function subscribe<T>(
	// pointer to observed object
	store: Store<T>,
	/** function to be called when values change */
	cb: (values: T) => void,
	/** if true, the subscribers callback will be called with current values of the store immediately  */
	immediate = false,
): () => void {
	const relay = () => cb(store.get());
	store.addEventListener("changed", relay);
	if (immediate) store.set(store.get());
	return () => store.removeEventListener("changed", relay);
}

// ---

/**
 * Deep merge two or more objects or arrays.
 * (c) Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param   {*} ...objs  The arrays or objects to merge
 * @returns {*}          The merged arrays or objects
 */
function deepMerge(...objs) {
	/**
	 * Get the object type
	 * @param  {*}       obj The object
	 * @return {String}      The object type
	 */
	function getType(obj) {
		return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
	}

	/**
	 * Deep merge two objects
	 * @return {Object}
	 */
	function mergeObj(clone, obj) {
		for (const [key, value] of Object.entries(obj)) {
			const type = getType(value);
			if (
				clone[key] !== undefined &&
				getType(clone[key]) === type &&
				["array", "object"].includes(type)
			) {
				clone[key] = deepMerge(clone[key], value);
			} else {
				clone[key] = structuredClone(value);
			}
		}
	}

	// Create a clone of the first item in the objs array
	let clone = structuredClone(objs.shift());

	// Loop through each item
	for (const obj of objs) {
		// Get the object type
		const type = getType(obj);

		// If the current item isn't the same type as the clone, replace it
		if (getType(clone) !== type) {
			clone = structuredClone(obj);
			continue;
		}

		// Otherwise, merge
		/*if (type === "array") {
            clone = [...clone, ...structuredClone(obj)];
        } else if (type === "object") {
			mergeObj(clone, obj);
    */
		if (type === "object") {
			mergeObj(clone, obj);
		} else {
			clone = obj;
		}
	}

	return clone;
}
