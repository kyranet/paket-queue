const map = new Map<string, Value>();

export function get(id: string) {
	return new Promise<Value | null>(resolve => {
		const timer = Math.random() * 200;
		setTimeout(() => resolve(map.get(id) || null), timer);
	});
}

export function getThrows(_id: string) {
	return Promise.reject('This should never run.');
}

export function getAll(ids: readonly string[]) {
	return new Promise<Value[]>(resolve => {
		const timer = Math.random() * 200;
		setTimeout(() => {
			const results: Value[] = [];
			for (const id of ids) {
				const value = map.get(id);
				if (typeof value !== 'undefined') results.push(value);
			}
			resolve(results);
		}, timer);
	});
}

export function getAllThrows(_ids: readonly string[]) {
	return Promise.reject('This should never run.');
}

export interface Value {
	id: string;
	data: number;
}

function add(id: string, data: number) {
	map.set(id, { id, data });
}

add('foo', 0);
add('bar', 1);
add('hello', 10);
add('world', 54);
