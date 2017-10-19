'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Utils = require('./Utils');

class Queue {
    constructor(conn, name, options, queue) {
        this.connId = conn.id;
        this.conn = conn;
        this.name = name;
        this.options = options;
        this.queue = queue;

        this.exchanges = {};
        this.headers = {};
        this.listeners = [];
    }

    reconnect(queue) {
        this.queue = queue;

        //rebind exchanges
        for (const key in this.exchanges) {
            if (!this.exchanges.hasOwnProperty(key)) {
                continue;
            }
            const ex = this.exchanges[key];
            this.queue.bind(ex.exchange, ex.routing);
        }

        //rebind headers
        for (const key in this.headers) {
            if (!this.headers.hasOwnProperty(key)) {
                continue;
            }
            const header = this.headers[key];
            this.queue.bindHeaders(header.exchange, header.routing);
        }

        //resubscribe
        this.listeners.forEach(item => {
            this.queue.subscribe(item.options, (message, headers, deliveryInfo, messageObject) => {
                item.listener(message, headers, deliveryInfo, messageObject, { connId: this.connId, queue: this.name });
            });
        });
    }

    getOriginalQueue() {
        return this.queue;
    }

    /**
     * This method binds a queue to an exchange.
     * Until a queue is bound it will not receive any messages,
     * unless they are sent through the unnamed exchange.
     *
     * @param exchange
     * @param routing
     */
    bind(exchange, routing) {
        if (!this.exchanges[`${exchange}-${routing}`]) {
            this.queue.bind(exchange, routing, _ => {
                this.exchanges[`${exchange}-${routing}`] = { exchange, routing };
            });
        }
    }

    /**
     * This method binds a queue to an exchange.
     * Until a queue is bound it will not receive any messages.
     * This method is to be used on an "headers"-type exchange.
     * The routing argument must contain the routing keys and the x-match value (all or any).
     *
     * @param exchange
     * @param routing
     */
    bindHeaders(exchange, routing) {
        if (!this.headers[`${exchange}-${routing}`]) {
            this.queue.bind_headers(exchange, routing, _ => {
                this.headers[`${exchange}-${routing}`] = { exchange, routing };
            });
        }
    }

    /**
     * This method unbinds a queue from an exchange.
     *
     * @param exchange
     * @param routing
     */
    unbind(exchange, routing) {
        if (this.exchanges[`${exchange}-${routing}`]) {
            this.queue.unbind(exchange, routing, _ => delete this.exchanges[`${exchange}-${routing}`]);
        }
    }

    /**
     * This method unbinds a queue from an exchange.
     *
     * @param exchange
     * @param routing
     */
    unbindHeaders(exchange, routing) {
        if (this.headers[`${exchange}-${routing}`]) {
            this.queue.unbind_headers(exchange, routing, _ => delete this.headers[`${exchange}-${routing}`]);
        }
    }

    /**
     * An easy subscription command.
     *
     * @param options
     * @param options.ack           {boolean} default is false. when the ack is true, it will make it so that the AMQP server only delivers a single message at a time. When you want the next message, call q.shift(). When ack is false then you will receive messages as fast as they come in.
     * @param options.prefetchCount {number}  default is 1. It will only send you one message before you ack, if set to 0 will make that window unlimited; if this option is used, q.shift() should not be called. Instead the listener function should take four parameters (message, headers, deliveryInfo, ack) and ack.acknowledge() should be called to ack a single message.
     * @param listener              {function} (message, headers, deliveryInfo, messageObject)
     */
    subscribe(options, listener) {
        if (typeof listener === 'function' && !(0, _Utils.isRepeat)(this.listeners, listener, 'listener')) {
            this.listeners.push({ options, listener });
            this.queue.subscribe(options, (message, headers, deliveryInfo, messageObject) => {
                listener(message, headers, deliveryInfo, messageObject, { connId: this.connId, queue: this.name });
            });
        }
    }

    /**
     * For use with subscribe({ack: true}, fn).
     * Acknowledges the last message if no arguments are provided or if reject is false.
     * If reject is true then the message will be rejected and put back onto the queue if requeue is true,
     * otherwise it will be discarded.
     *
     * @param reject  {boolean}
     * @param requeue {boolean}
     */
    shift(reject, requeue) {
        this.queue.shift(reject, requeue);
    }

    /**
     * Delete the queue.
     *
     * @param options
     * @param options.ifUnused {boolean} if it is true, the queue will only be deleted if there are no consumers.
     * @param options.ifEmpty  {boolean} if it is true, the queue will only be deleted if it has no messages.
     */
    destroy(options) {
        this.exchanges = {};
        this.headers = {};
        this.listeners = [];
        this.queue.destroy(options);
        this.conn.destroyQueue(this.name);
    }
}
exports.default = Queue;