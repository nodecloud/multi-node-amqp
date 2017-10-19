'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _amqp = require('amqp');

var _amqp2 = _interopRequireDefault(_amqp);

var _Connection = require('./Connection');

var _Connection2 = _interopRequireDefault(_Connection);

var _ConnectionManager = require('./ConnectionManager');

var connManager = _interopRequireWildcard(_ConnectionManager);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

exports.default = {
    /**
     * Create multi amqp connections
     *
     * @param options {Array}           @see createConnection()
     * @returns       {Promise.<Object>}
     */
    createConnections(options) {
        return _asyncToGenerator(function* () {
            let opts = options || [];
            if (!_lodash2.default.isArray(options)) {
                opts = [options];
            }

            const errors = {};
            const connections = {};
            const promises = opts.map((() => {
                var _ref = _asyncToGenerator(function* (option) {
                    try {
                        connections[option.id] = yield exports.createConnection(option.id, option.options, option.extra);
                    } catch (e) {
                        errors[option.id] = e;
                    }
                });

                return function (_x) {
                    return _ref.apply(this, arguments);
                };
            })());
            yield Promise.all(promises);

            return { connections, errors };
        })();
    },

    /**
     * Create a new amqp connection.
     *
     * @param id
     * @param options
     * @param options.host
     * @param options.port
     * @param options.login
     * @param options.password
     * @param options.authMechanism
     * @param options.vhost
     * @param options.ssl
     * @param options.ssl.enabled
     * @param options.ssl.keyFile
     * @param options.ssl.certFile
     * @param options.ssl.caFile
     * @param options.ssl.rejectUnauthorized
     * @param options.clientProperties
     * @param options.clientProperties.applicationName
     * @param options.clientProperties.capabilities
     * @param options.clientProperties.capabilities.consumer_cancel_notify
     * @param extra
     * @param extra.defaultExchangeName
     * @param extra.reconnect
     * @param extra.reconnectBackoffStrategy
     * @param extra.reconnectExponentialLimit
     * @param extra.reconnectBackoffTime
     * @returns {Promise<Connection>}
     * @throws when create connection fail
     */
    createConnection(id, options, extra) {
        let isInitial = true;
        return new Promise((resolve, reject) => {
            const conn = _amqp2.default.createConnection(options, extra);
            conn.on('error', err => {
                if (isInitial) {
                    reject(err);
                }
            });
            conn.on('ready', _ => {
                if (isInitial) {
                    isInitial = false;
                    connManager.addConnection(id, new _Connection2.default(id, conn, options, extra));
                    resolve(connManager.getConnection(id));
                }
            });
        });
    },

    getConnection(id) {
        return connManager.getConnection(id);
    }
};