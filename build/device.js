'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _wake_on_lan = require('wake_on_lan');

var _wake_on_lan2 = _interopRequireDefault(_wake_on_lan);

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _nodeSsdp = require('node-ssdp');

var _nodeSsdp2 = _interopRequireDefault(_nodeSsdp);

var _appiumLogger = require('appium-logger');

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _appiumLogger.getLogger)('SamsungRemote');

var CONNECTION_TIMEOUT = 60000;
var KEY_DELAY = 200;
var WAKE_ON_LAN_DELAY = 5000;
var UPNP_TIMEOUT = 1000;

var SamsungSmartTV = function () {
    function SamsungSmartTV(host, mac) {
        (0, _classCallCheck3.default)(this, SamsungSmartTV);

        this.services = [];
        this.host = host;
        this.mac = mac;
        this.api = 'http://' + this.host + ':8001/api/v2/';
        this.isConnected = false;
    }

    /**
     * add UPNP service
     * @param [Object] service  UPNP service description
     */


    (0, _createClass3.default)(SamsungSmartTV, [{
        key: 'addService',
        value: function addService(service) {
            this.services.push(service);
        }

        /**
         * connect to device
         * @param [String] appName  name of remote control
         */

    }, {
        key: 'connect',
        value: function () {
            var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
                var _this = this;

                var appName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'SamsungSmartTVDriver';
                var appNameBase64, channel;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (!this.isConnected) {
                                    _context.next = 2;
                                    break;
                                }

                                return _context.abrupt('return', _promise2.default.resolve());

                            case 2:
                                if (!this.mac) {
                                    _context.next = 5;
                                    break;
                                }

                                _context.next = 5;
                                return this.wol(this.mac);

                            case 5:
                                _context.next = 7;
                                return this.getDeviceInfo();

                            case 7:
                                this.info = _context.sent;


                                // establish socket connection
                                appNameBase64 = new Buffer(appName).toString('base64');
                                channel = this.api + 'channels/samsung.remote.control?name=' + appNameBase64;

                                log.info('Connect to ' + channel);
                                this.ws = new _ws2.default(channel);

                                return _context.abrupt('return', new _promise2.default(function (resolve, reject) {
                                    _this.ws.once('message', function (data, flags) {
                                        clearTimeout(_this.timeout);

                                        try {
                                            data = JSON.parse(data);
                                        } catch (e) {
                                            log.error('Could not parse TV response', data);
                                            return reject();
                                        }

                                        if (data.event !== 'ms.channel.connect') {
                                            log.error('Unable to connect to TV');
                                            log.info('TV responded with', data);
                                            return reject();
                                        }

                                        log.info('Connection successfully established');
                                        _this.isConnected = true;
                                        resolve();
                                    });

                                    _this.timeout = setTimeout(function () {
                                        log.error('Unable to connect to TV: timeout');
                                        reject();
                                    }, CONNECTION_TIMEOUT);
                                }));

                            case 13:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function connect(_x) {
                return _ref.apply(this, arguments);
            }

            return connect;
        }()

        /**
         * turns on TV
         */

    }, {
        key: 'wol',
        value: function wol(macAddress) {
            if (typeof macAddress !== 'string') {
                throw new Error('connectTo requires macAddress as first parameter');
            }

            log.info('Trying to wake up TV ...');
            return new _promise2.default(function (resolve, reject) {
                return _wake_on_lan2.default.wake(macAddress, function (e) {
                    if (e) {
                        log.error('Could not connect to device with mac address', macAddress, e.message);
                        return reject(e);
                    }
                    log.info('TV is awake');
                    return setTimeout(resolve, WAKE_ON_LAN_DELAY);
                });
            });
        }

        /**
         * disconnect from device
         */

    }, {
        key: 'disconnect',
        value: function disconnect() {
            this.ws.close();
        }

        /**
         * send key to device
         * @param [String] key  key code
         */

    }, {
        key: 'sendKey',
        value: function () {
            var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(key) {
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                if (!(typeof key !== 'string' || _constants.KEY_CODES.indexOf(key) === -1)) {
                                    _context2.next = 2;
                                    break;
                                }

                                throw new Error('Key code not available');

                            case 2:
                                if (this.isConnected) {
                                    _context2.next = 4;
                                    break;
                                }

                                throw new Error('Not connected to device. Call `tv.connect()` first!');

                            case 4:

                                log.info('Send key command', key);
                                this.ws.send((0, _stringify2.default)({
                                    method: 'ms.remote.control',
                                    params: {
                                        Cmd: 'Click',
                                        DataOfCmd: key,
                                        Option: false,
                                        TypeOfRemote: 'SendRemoteKey'
                                    }
                                }));

                                // add a delay so TV has time to execute
                                _context2.next = 8;
                                return new _promise2.default(function (resolve) {
                                    return setTimeout(resolve, KEY_DELAY);
                                });

                            case 8:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));

            function sendKey(_x3) {
                return _ref2.apply(this, arguments);
            }

            return sendKey;
        }()

        /**
         * request TV info like udid or model name
         */

    }, {
        key: 'getDeviceInfo',
        value: function getDeviceInfo() {
            log.info('Get device info from ' + this.api);
            return (0, _requestPromise2.default)(this.api);
        }

        /**
         * static method to discover Samsung Smart TVs in the network using the UPNP protocol
         */

    }], [{
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
                    device = new SamsungSmartTV(rinfo.address);
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
    return SamsungSmartTV;
}();

exports.default = SamsungSmartTV;
module.exports = exports['default'];