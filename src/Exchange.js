import event from './Event';

export default class Exchange {
    constructor(conn, name, options, exchange) {
        this.connId = conn.id;
        this.conn = conn;
        this.name = name;
        this.options = options;
        this.exchange = exchange;

        this.exchanges = {};
        this.headers = {};
    }

    reconnect(exchange) {
        this.exchange = exchange;

        //rebind exchanges
        for (const key in this.exchanges) {
            if (!this.exchanges.hasOwnProperty(key)) {
                continue;
            }
            const ex = this.exchanges[key];
            this.exchange.bind(ex.exchange, ex.routing);
        }

        //rebind headers
        for (const key in this.headers) {
            if (!this.headers.hasOwnProperty(key)) {
                continue;
            }
            const header = this.headers[key];
            this.exchange.bindHeaders(header.exchange, header.routing);
        }
    }

    getOriginalExchange() {
        return this.exchange;
    }

    /**
     * Publishes a message to the exchange.
     *
     * @param routingKey
     * @param message
     * @param options
     * @param options.mandatory       {boolean}  default false. This flag tells the server how to react if the message cannot be routed to a queue. If this flag is set, the server will return an unroutable message with a Return method. If this flag is false, the server silently drops the message.
     * @param options.immediate       {boolean}  default false. This flag tells the server how to react if the message cannot be routed to a queue consumer immediately. If this flag is set, the server will return an undeliverable message with a Return method. If this flag is false, the server will queue the message, but with no guarantee that it will ever be consumed.
     * @param options.contentType     {string}   default 'application/octet-stream'
     * @param options.contentEncoding {string}   default null.
     * @param options.headers         {object}   default {}. Arbitrary application-specific message headers.
     * @param options.deliveryMode               Non-persistent (1) or persistent (2)
     * @param options.priority        {number}   The message priority, 0 to 9.
     * @param options.correlationId   {string}   default null. Application correlation identifier
     * @param options.replyTo         {string}   Usually used to name a reply queue for a request message.
     * @param options.expiration                 default null. Message expiration specification
     * @param options.messageId                  default null. Application message identifier
     * @param options.timestamp                  default null. Message timestamp
     * @param options.type                       default null. Message type name
     * @param options.userId                     default null. Creating user id
     * @param options.appId                      default null. Creating application id
     * @param callback                {function} it will be called in confirm mode.
     */
    publish(routingKey, message, options, callback) {
        this.exchange.publish(routingKey, message, options, callback)
    }

    bind(exchange, routing) {
        if (!this.exchanges[`${exchange}-${routing}`]) {
            this.exchange.bind(exchange, routing, _ => {
                this.exchanges[`${exchange}-${routing}`] = {exchange, routing}
            });
        }
    }

    bindHeaders(exchange, routing) {
        if (!this.headers[`${exchange}-${routing}`]) {
            this.exchange.bind_headers(exchange, routing, _ => {
                this.headers[`${exchange}-${routing}`] = {exchange, routing}
            });
        }
    }

    unbind(exchange, routing) {
        if (this.exchanges[`${exchange}-${routing}`]) {
            this.exchange.unbind(exchange, routing, _ => delete this.exchanges[`${exchange}-${routing}`]);
        }
    }

    /**
     * Deletes an exchange.
     * If the optional boolean second argument is set,
     * the server will only delete the exchange if it has no queue bindings.
     * If the exchange has queue bindings the server does not delete it but raises a channel exception instead.
     *
     * @param ifUnused
     */
    destroy(ifUnused) {
        try {
            this.exchange.destroy(ifUnused);
            this.conn.destroyExchange(this.name);
        } catch (e) {
            this.conn.emit('error', e);
        }
    }
}