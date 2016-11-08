import SamsungTV from '../build/device'

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
