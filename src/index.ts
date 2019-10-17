export class Queue<K, T> {

	public compressFunction: CompressCallback<K, T>;
	public amountToChunk: number;
	protected runs = new Map<K, WrappedCallback<K, T>>();
	protected busy = false;

	public constructor(compressFunction: CompressCallback<K, T>, amountToChunk: number) {
		this.compressFunction = compressFunction;
		this.amountToChunk = amountToChunk;
	}

	public async run(id: K, callback: Callback<K, T>) {
		const wrapped = this.wrapCallback(callback);
		this.handlePrevious(id, wrapped);
		this.handleSet(id, wrapped);
		return wrapped.promise;
	}

	protected handleSet(id: K, wrapped: WrappedCallback<K, T>) {
		this.runs.set(id, wrapped);
		if (!this.busy) {
			this.busy = true;
			this.createTimer();
		}
	}

	protected createTimer() {
		process.nextTick(() => this.handleNextTick());
	}

	protected handlePrevious(id: K, wrapped: WrappedCallback<K, T>) {
		const previous = this.runs.get(id);
		if (previous) {
			// TODO(kyranet): Fix duplicated bulk
			previous.resolve = wrapped.resolve;
			previous.reject = wrapped.reject;
		}
	}

	protected wrapCallback(callback: Callback<K, T>) {
		let resolve: WrappedCallback<K, T>['resolve'];
		let reject: WrappedCallback<K, T>['reject'];
		const promise = new Promise<T | null>((res, rej) => {
			resolve = res;
			reject = rej;
		});
		const wrapped: WrappedCallback<K, T> = {
			callback,
			promise,
			resolve: resolve!,
			reject: reject!
		};

		return wrapped;
	}

	protected async handleNextTick() {
		this.busy = false;
		if (this.runs.size < this.amountToChunk) {
			for (const [id, wrapped] of this.runs.entries()) {
				try {
					Promise.resolve(wrapped.callback(id))
						.then(value => wrapped.resolve(value))
						.catch(error => wrapped.reject(error));
				} catch (error) {
					wrapped.reject(error);
				}
			}

			return;
		}

		let result: CompressCallbackReturnTypeUnwrap<K, T> | null;
		try {
			result = await this.compressFunction([...this.runs.keys()]);
		} catch (error) {
			return this.handleNextTickErrorResults(error);
		}

		try {
			if (result instanceof Map) {
				this.handleNextTickMapResult(result as MapResult<K, T>);
			} else if (result.length > 0) {
				if (Array.isArray(result[0])) this.handleNextTickArrayTupleResult(result as ArrayTupleResult<K, T>);
				else this.handleNextTickArrayObjectResult(result as ArrayObjectResult<K, T>);
			}
		} catch { }

		this.handleNextTickUnhandledResults();

	}

	protected handleNextTickMapResult(result: MapResult<K, T>) {
		for (const [key, value] of result.entries()) {
			const wrapped = this.runs.get(key);
			if (typeof wrapped !== 'undefined') {
				wrapped.resolve(value);
				this.runs.delete(key);
			}
		}
	}

	protected handleNextTickArrayTupleResult(result: ArrayTupleResult<K, T>) {
		for (const [key, value] of result) {
			const wrapped = this.runs.get(key);
			if (typeof wrapped !== 'undefined') {
				wrapped.resolve(value);
				this.runs.delete(key);
			}
		}
	}

	protected handleNextTickArrayObjectResult(result: ArrayObjectResult<K, T>) {
		for (const object of result) {
			const wrapped = this.runs.get(object.id);
			if (typeof wrapped !== 'undefined') {
				wrapped.resolve(object);
				this.runs.delete(object.id);
			}
		}
	}

	protected handleNextTickErrorResults(error: Error) {
		for (const wrapped of this.runs.values()) {
			wrapped.reject(error);
		}

		this.runs.clear();
	}

	protected handleNextTickUnhandledResults() {
		for (const wrapped of this.runs.values()) {
			wrapped.resolve(null);
		}

		this.runs.clear();
	}
}

export type Callback<K, T> = (id: K) => T | null | Promise<T | null>;
export type CompressCallback<K, T> = (ids: readonly K[]) => CompressCallbackReturnType<K, T>;
export type CompressCallbackReturnType<K, T> = CompressCallbackReturnTypeUnwrap<K, T> | Promise<CompressCallbackReturnTypeUnwrap<K, T>>;
export type CompressCallbackReturnTypeUnwrap<K, T> = ArrayObjectResult<K, T> | ArrayTupleResult<K, T> | MapResult<K, T>;

export type MapResult<K, T> = Map<K, T>;
export type ArrayTupleResult<K, T> = readonly [K, T][];
export type ArrayObjectResult<K, T> = readonly ({ readonly id: K } & T)[];

interface WrappedCallback<K, T> {
	callback: Callback<K, T>;
	promise: Promise<T | null>;
	resolve: (value: T | null) => void;
	reject: (error: Error) => void;
}
