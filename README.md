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
    // specify token
    // TV.token = 'XXXXXX'
    const devInfo = await TV.getDeviceInfo();
    const macaddress = devInfo.device.wifiMac;
    // save it to further turn on tv
    // await TV.wol(macaddress);

    
    await TV.connect()
    console.log('this is the token to save somewere', TV.token)

    // ...

    return TV.disconnect()
}

main().catch(console.log)
```

## Changes in 2018+ models
the connection is dove via ssl and require confirmation in the tv, after confirmation is done a token in saved that can be used in further connections.

## Development

Compile files:

```sh
$ npm run compile
```

Watch files:

```sh
$ npm run watch
```
