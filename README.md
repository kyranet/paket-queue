# paket-queue

<div align="center">
	<p>
		<a href="https://www.npmjs.com/package/paket-queue">
			<img src="https://img.shields.io/npm/v/paket-queue.svg?maxAge=3600" alt="NPM version" />
		</a>
		<a href="https://www.npmjs.com/package/paket-queue">
			<img src="https://img.shields.io/npm/dt/paket-queue.svg?maxAge=3600" alt="NPM downloads" />
		</a>
		<a href="https://lgtm.com/projects/g/kyranet/paket-queue/alerts/">
			<img src="https://img.shields.io/lgtm/alerts/g/kyranet/paket-queue.svg?logo=lgtm&logoWidth=18" alt="Total alerts">
		</a>
		<a href="https://dependabot.com">
			<img src="https://api.dependabot.com/badges/status?host=github&repo=kyranet/paket-queue" alt="Dependabot Status">
		</a>
		<a href="https://www.patreon.com/kyranet">
			<img src="https://img.shields.io/badge/donate-patreon-F96854.svg" alt="Patreon" />
		</a>
	</p>
	<p>
		<a href="https://nodei.co/npm/paket-queue/"><img src="https://nodei.co/npm/paket-queue.png?downloads=true&stars=true" alt="npm installnfo" /></a>
	</p>
	<p>
		Deprecated in favour of <a href="https://github.com/dirigeants/request-handler"><code>@klasa/request-handler</code></a>
	</p>
</div>

## About

Croatian for "Pack", `paket-queue` is a promisified queue batch library that allows you to re-route individual calls to
a function or method capable of handling batched data.

## Usage

This library has been made with databases in mind, but can be used for literally any other purpose as it is abstracted.
Let's say you have a class handling all database interactions, and you have a `get` and a `getAll` methods. And you want
to make it so, when your application calls the `get` method 10 times or more, they get re-routed to the `getAll` method.

This is simple with `paket-queue`:

```javascript
// Or `const { Queue } = require('paket-queue');` in CommonJS
import { Queue } from 'paket-queue';

class Provider {

	connection = new DatabaseConnection(/* arguments */);
	queue = new Queue(ids => this.getAll(ids), 10);

	get(id) {
		return queue.run(id, () => connection.get(id));
	}

	getAll(ids) {
		return connection.getAll(id);
	}

}
```

Now when you run `Provider#get` 10 times or more in the same tick, no call to `connection.get` will be done, instead,
all the ids will be sent to `Provider#getAll`.

## Batching

Another feature of `paket-queue`, is that it supports batching:

```javascript
const results = await Promise.all([
	paket.run('foo', id => connection.get(id)),
	paket.run('foo', id => connection.get(id)),
	paket.run('foo', id => connection.get(id))
]);
```

This will internally count as a single item, and the return will be an array of 3 elements, all of which will be
references of (meaning `results[0] === results[1] && results[1] === results[2]`), as `get` is only called once and the
same value is passed to all of them.

## Extending

While this library only exports the `Queue` class, it is possible to extend its functionality, e.g. increasing the timer
to be of 50 milliseconds instead of the following tick can be achieved with the following:

```javascript
// Or `const { Queue } = require('paket-queue');` in CommonJS
import { Queue } from 'paket-queue';

class MyQueue extends Queue {

	createTimer() {
		setTimeout(() => this.handleNextTick(), 50);
	}

}
```

In TypeScript, you can also do this, `Queue#createTimer` is `protected`, meaning it is accessible for `Queue`'s
extensions.

## Contributing

1. Fork it!
1. Create your feature branch: `git checkout -b my-new-feature`
1. Commit your changes: `git commit -am 'Add some feature'`
1. Push to the branch: `git push origin my-new-feature`
1. Submit a pull request!

## Author

**paket-queue** © [kyranet][author], released under the
[MIT][license] License.
Authored and maintained by kyranet.

> Github [kyranet][author] - Twitter [@kyranet_][twitter]

[license]: https://github.com/kyranet/paket-queue/blob/master/LICENSE
[author]: https://github.com/kyranet
[twitter]: https://twitter.com/kyranet_
