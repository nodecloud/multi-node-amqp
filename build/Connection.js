'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _events = require('events');

var _ConnectionManager = require('./ConnectionManager');

var connManager = _interopRequireWildcard(_ConnectionManager);

var _Queue = require('./Queue');

var _Queue2 = _interopRequireDefault(_Queue);

var _Exchange = require('./Exchange');

var _Exchange2 = _interopRequireDefault(_Exchange);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

class Connection extends _events.EventEmitter {
    /**
     * New connection.
     *
     * @param id      The connection id.
     * @param conn    The original connection instance.
     * @param options @see createConnection()
     * @param extra   @see createConnection()
     */
    constructor(id, conn, options, extra) {
        super();

        this.id = id;
        this.conn = conn;
        this.options = options;
        this.extra = extra;
        this.status = '';

        this.queues = {};
        this.exchanges = {};

        this.conn.on('ready', this.onReadyCallback.bind(this));
        this.conn.on('error', this.onErrorCallback.bind(this));
    }

    onReadyCallback() {
        this.emit('ready', this);
        this.status = 'available';

        //reconnect queues.
        for (const key in this.queues) {
            if (!this.queues.hasOwnProperty(key)) {
                continue;
            }

            const oldQueue = this.queues[key];
            this.conn.queue(oldQueue.name, oldQueue.options, queue => {
                oldQueue.reconnect(queue);
            });
        }

        //reconnect exchanges.
        for (const key in this.exchanges) {
            if (!this.exchanges.hasOwnProperty(key)) {
                continue;
            }

            const oldExchange = this.exchanges[key];
            this.conn.exchange(oldExchange.name, oldExchange.options, exchange => {
                oldExchange.reconnect(exchange);
            });
        }
    }

    onErrorCallback(e) {
        this.emit('connectionError', e);
        this.status = 'error';
    }

    /**
     * Publishes a message to the default exchange.
     *
     * @param routingKey
     * @param body
     * @param options
     * @param callback
     */
    publish(routingKey, body, options, callback) {
        this.conn.publish(routingKey, body, options, callback);
    }

    /**
     *
     * @param name                              {string}  The queue name
     * @param options                           {object}
     * @param options.passive                   {boolean} default false. If set, the server will not create the queue. The client can use this to check whether a queue exists without modifying the server state.
     * @param options.durable                   {boolean} default false. Durable queues remain active when a server restarts. Non-durable queues (transient queues) are purged if/when a server restarts. Note that durable queues do not necessarily hold persistent messages, although it does not make sense to send persistent messages to a transient queue.
     * @param options.exclusive                 {boolean} default false. Exclusive queues may only be consumed from by the current connection. Setting the 'exclusive' flag always implies 'autoDelete'.
     * @param options.autoDelete                {boolean} default true. If set, the queue is deleted when all consumers have finished using it. Last consumer can be cancelled either explicitly or because its channel is closed. If there was no consumer ever on the queue, it won't be deleted.
     * @param options.noDeclare                 {boolean} default false. If set, the queue will not be declared, this will allow a queue to be deleted if you don't know its previous options.
     * @param options.arguments                 {object}  a map of additional arguments to pass in when creating a queue.
     * @param options.closeChannelOnUnsubscribe {boolean} when true the channel will close on unsubscribe, default false.
     * @returns {Promise<Queue>}
     */
    queue(name, options) {
        return new Promise((resolve, reject) => {
            try {
                this.conn.queue(name, options, queue => {
                    const instance = new _Queue2.default(this, name, options, queue);
                    this.queues[name] = instance;
                    resolve(instance);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Create the exchange.
     *
     * @param name               {string}  the exchange name
     * @param options            {object}
     * @param options.type       {string}  the type of exchange 'direct', 'fanout', or 'topic' (default).
     * @param options.passive    {boolean} default false. If set, the server will not create the exchange. The client can use this to check whether an exchange exists without modifying the server state.
     * @param options.durable    {boolean} default false. If set when creating a new exchange, the exchange will be marked as durable. Durable exchanges remain active when a server restarts. Non-durable exchanges (transient exchanges) are purged if/when a server restarts.
     * @param options.autoDelete {boolean} default true. If set, the exchange is deleted when there are no longer queues bound to it.
     * @param options.noDeclare  {boolean} default false. If set, the exchange will not be declared, this will allow the exchange to be deleted if you dont know its previous options.
     * @param options.confirm    {boolean} default false. If set, the exchange will be in confirm mode, and you will get a 'ack'|'error' event emitted on a publish, or the callback on the publish will be called.
     * @param options.arguments  {object}  a map of additional arguments to pass in when creating an exchange.
     * @returns {Promise<Exchange>}
     */
    exchange(name, options) {
        return new Promise((resolve, reject) => {
            try {
                this.conn.exchange(name, options, exchange => {
                    const instance = new _Exchange2.default(this, name, options, exchange);
                    this.exchanges[name] = instance;
                    resolve(instance);
                });
            } catch (e) {
                reject(e);
            }
        });
    }

    destroyQueue(name) {
        if (this.queues[name]) {
            try {
                this.queues[name].destroy();
            } catch (ignore) {}
            delete this.queues[name];
        }
    }

    destroyExchange(name) {
        if (this.exchanges[name]) {
            try {
                this.exchanges[name].destroy();
            } catch (ignore) {}
            delete this.exchanges[name];
        }
    }

    disconnect() {
        this.queues = {};
        this.exchanges = {};
        this.conn.disconnect();
        connManager.destroy(this.id);
    }
}
exports.default = Connection;