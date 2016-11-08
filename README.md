Samsung Remote Control
======================

Node package to control newer Samsung Smart TVs models (2016 and up).

## Usage

To connect to a Samsung TV you need to know its mac and host address. Once it is connected you can send
key commands to it:

```js
import SamsungTV from 'samsungtv'

async function main () {
    const TV = new SamsungTV('192.168.1.2', '5c:49:7d:cc:89:7b')
    await TV.connect()

    await TV.sendKey('KEY_VOLUP')
    await TV.sendKey('KEY_VOLUP')
    await TV.sendKey('KEY_VOLUP')
    await TV.sendKey('KEY_VOLDOWN')
    await TV.sendKey('KEY_VOLDOWN')
    await TV.sendKey('KEY_VOLDOWN')

    await TV.sendKey('KEY_POWER')
    return TV.disconnect()
}

main().catch(console.log)
```

You can also discover Samsung Smart TVs in your network using the `discover` class method. It uses the UPNP
protocol to lookup services:

```js
import SamsungTV from '../build/device'

async function main () {
    const TVs = SamsungTV.discover()

    console.log(`There are ${TVs.length} Samsung Smart TVs connected to this network`)
    const TV = TVs[0]
    await TV.connect()

    // ...

    return TV.disconnect()
}

main().catch(console.log)
```

## Development

Compile files:

```sh
$ npm run compile
```

Watch files:

```sh
$ npm run watch
```
