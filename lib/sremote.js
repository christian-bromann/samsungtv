import SSDP from 'node-ssdp'

export default class SamsungRemote {
  static UPNP_TIMEOUT = 1000

  static discover () {
    const client = new SSDP.Client()
    const services = []

    return new Promise((resolve, reject) => {
      client.search('ssdp:all')
      client.on('response', (headers, statusCode, rinfo) => {
        /**
         * ignore other devices
         */
        if (!headers.SERVER.match(/Samsung UPnP SDK\/1\.0/)) {
          return
        }

        if (!services[rinfo.address]) {
          services[rinfo.address] = []
        }

        services[rinfo.address].push({
          location: headers.LOCATION,
          server: headers.SERVER,
          st: headers.ST,
          usn: headers.USN
        })
      });

      setTimeout(() => resolve(services), UPNP_TIMEOUT)
    })
  }
}
