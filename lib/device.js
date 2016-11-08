import wol from 'wake_on_lan'
import WebSocket from 'ws'
import request from 'request-promise'
import SSDP from 'node-ssdp'

import { getLogger } from 'appium-logger'
import { KEY_CODES } from './constants'

const log = getLogger('SamsungRemote')

const CONNECTION_TIMEOUT = 60000
const KEY_DELAY = 200
const WAKE_ON_LAN_DELAY = 5000
const UPNP_TIMEOUT = 1000

export default class SamsungSmartTV {
    constructor (host, mac) {
        this.services = []
        this.host = host
        this.mac = mac
        this.api = `http://${this.host}:8001/api/v2/`
        this.isConnected = false
    }

    /**
     * add UPNP service
     * @param [Object] service  UPNP service description
     */
    addService (service) {
        this.services.push(service)
    }

    /**
     * connect to device
     * @param [String] appName  name of remote control
     */
    async connect (appName = 'SamsungSmartTVDriver') {
        if (this.isConnected) {
            return Promise.resolve()
        }

        // make sure to turn on TV in case it is turned off
        if (this.mac) {
            await this.wol(this.mac)
        }

        // get device info
        this.info = await this.getDeviceInfo()

        // establish socket connection
        const appNameBase64 = new Buffer(appName).toString('base64')
        const channel = `${this.api}channels/samsung.remote.control?name=${appNameBase64}`
        log.info(`Connect to ${channel}`)
        this.ws = new WebSocket(channel)

        return new Promise((resolve, reject) => {
            this.ws.once('message', (data, flags) => {
                clearTimeout(this.timeout)

                try {
                    data = JSON.parse(data)
                } catch (e) {
                    log.error('Could not parse TV response', data)
                    return reject()
                }

                if (data.event !== 'ms.channel.connect') {
                    log.error('Unable to connect to TV')
                    log.info('TV responded with', data)
                    return reject()
                }

                log.info('Connection successfully established')
                this.isConnected = true
                resolve()
            })

            this.timeout = setTimeout(() => {
                log.error('Unable to connect to TV: timeout')
                reject()
            }, CONNECTION_TIMEOUT)
        })
    }

    /**
     * turns on TV
     */
    wol (macAddress) {
        if (typeof macAddress !== 'string') {
            throw new Error('connectTo requires macAddress as first parameter')
        }

        log.info('Trying to wake up TV ...')
        return new Promise((resolve, reject) => wol.wake(macAddress, (e) => {
            if (e) {
                log.error('Could not connect to device with mac address', macAddress, e.message)
                return reject(e)
            }
            log.info('TV is awake')
            return setTimeout(resolve, WAKE_ON_LAN_DELAY)
        }))
    }

    /**
     * disconnect from device
     */
    disconnect () {
        this.ws.close()
    }

    /**
     * send key to device
     * @param [String] key  key code
     */
    async sendKey (key) {
        if (typeof key !== 'string' || KEY_CODES.indexOf(key) === -1) {
            throw new Error('Key code not available')
        }
        if (!this.isConnected) {
            throw new Error('Not connected to device. Call `tv.connect()` first!')
        }

        log.info('Send key command', key)
        this.ws.send(JSON.stringify({
            method: 'ms.remote.control',
            params: {
                Cmd: 'Click',
                DataOfCmd: key,
                Option: false,
                TypeOfRemote: 'SendRemoteKey'
            }
        }))

        // add a delay so TV has time to execute
        await new Promise((resolve) => setTimeout(resolve, KEY_DELAY))
    }

    /**
     * request TV info like udid or model name
     */
    getDeviceInfo () {
        log.info(`Get device info from ${this.api}`)
        return request(this.api)
    }

    /**
     * static method to discover Samsung Smart TVs in the network using the UPNP protocol
     */
    static discover () {
        const client = new SSDP.Client()
        const tvs = []

        client.search('ssdp:all')
        client.on('response', (headers, statusCode, rinfo) => {
            /**
             * ignore other devices
             */
            if (!headers.SERVER.match(/Samsung UPnP SDK\/1\.0/)) {
                return
            }

            let device = tvs.find((tv) => tv.host === rinfo.address)

            if (!device) {
                log.info('Found Samsung Smart TV on IP', rinfo.address)
                device = new SamsungSmartTV(rinfo.address)
                tvs.push(device)
            }

            device.addService({
                location: headers.LOCATION,
                server: headers.SERVER,
                st: headers.ST,
                usn: headers.USN
            })
        })

        return new Promise((resolve, reject) => setTimeout(() => {
            if (tvs.length === 0) {
                return reject(
                    new Error('No Samsung TVs found. Make sure the UPNP protocol is enabled in your network.')
                )
            }

            resolve(tvs)
        }, UPNP_TIMEOUT))
    }
}
