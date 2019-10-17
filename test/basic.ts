import ava from 'ava';
import { Queue } from '../dist';
import { getAll, Value, get, getThrows, getAllThrows } from './lib/shared';

ava('get(single-call)', async test => {
	const paket = new Queue<string, Value>(getAllThrows, 5);
	const value = await paket.run('foo', id => get(id));
	test.deepEqual(value, { id: 'foo', data: 0 });
});

ava('get(single-call | null)', async test => {
	const paket = new Queue<string, Value>(getAllThrows, 5);
	const value = await paket.run('whoops', id => get(id));
	test.is(value, null);
});

ava('get(multiple-call)', async test => {
	const paket = new Queue<string, Value>(getAllThrows, 5);
	const values = await Promise.all([
		paket.run('foo', id => get(id)),
		paket.run('bar', id => get(id)),
		paket.run('hello', id => get(id))
	]);
	test.deepEqual(values, [
		{ id: 'foo', data: 0 },
		{ id: 'bar', data: 1 },
		{ id: 'hello', data: 10 }
	]);
});

ava('get(multiple-call | nulls)', async test => {
	const paket = new Queue<string, Value>(getAllThrows, 5);
	const values = await Promise.all([
		paket.run('foo', id => get(id)),
		paket.run('bar', id => get(id)),
		paket.run('whoops', id => get(id))
	]);
	test.deepEqual(values, [
		{ id: 'foo', data: 0 },
		{ id: 'bar', data: 1 },
		null
	]);
});

ava('getAll(multiple-call)', async test => {
	const paket = new Queue<string, Value>(getAll, 2);
	const values = await Promise.all([
		paket.run('foo', id => getThrows(id)),
		paket.run('bar', id => getThrows(id)),
		paket.run('hello', id => getThrows(id))
	]);
	test.deepEqual(values, [
		{ id: 'foo', data: 0 },
		{ id: 'bar', data: 1 },
		{ id: 'hello', data: 10 }
	]);
});

ava('getAll(multiple-call | nulls)', async test => {
	const paket = new Queue<string, Value>(getAll, 2);
	const values = await Promise.all([
		paket.run('foo', id => getThrows(id)),
		paket.run('bar', id => getThrows(id)),
		paket.run('whoops', id => getThrows(id))
	]);
	test.deepEqual(values, [
		{ id: 'foo', data: 0 },
		{ id: 'bar', data: 1 },
		null
	]);
});
