'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _nodeSsdp = require('node-ssdp');

var _nodeSsdp2 = _interopRequireDefault(_nodeSsdp);

var _appiumLogger = require('appium-logger');

var _device = require('./device');

var _device2 = _interopRequireDefault(_device);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _appiumLogger.getLogger)('SamsungRemote');
var UPNP_TIMEOUT = 1000;

var SamsungRemote = function () {
    function SamsungRemote() {
        (0, _classCallCheck3.default)(this, SamsungRemote);
    }

    (0, _createClass3.default)(SamsungRemote, null, [{
        key: 'discover',
        value: function discover() {
            var client = new _nodeSsdp2.default.Client();
            var tvs = [];

            client.search('ssdp:all');
            client.on('response', function (headers, statusCode, rinfo) {
                /**
                 * ignore other devices
                 */
                if (!headers.SERVER.match(/Samsung UPnP SDK\/1\.0/)) {
                    return;
                }

                var device = tvs.find(function (tv) {
                    return tv.host === rinfo.address;
                });

                if (!device) {
                    log.info('Found Samsung Smart TV on IP', rinfo.address);
                    device = new _device2.default(rinfo.address);
                    tvs.push(device);
                }

                device.addService({
                    location: headers.LOCATION,
                    server: headers.SERVER,
                    st: headers.ST,
                    usn: headers.USN
                });
            });

            return new _promise2.default(function (resolve, reject) {
                return setTimeout(function () {
                    if (tvs.length === 0) {
                        return reject(new Error('No Samsung TVs found. Make sure the UPNP protocol is enabled in your network.'));
                    }

                    resolve(tvs);
                }, UPNP_TIMEOUT);
            });
        }
    }]);
    return SamsungRemote;
}();

exports.default = SamsungRemote;
module.exports = exports['default'];