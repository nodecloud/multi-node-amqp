import _ from 'lodash';
import amqp from 'amqp';

import Connection from './Connection';
import * as connManager from './ConnectionManager';

export default {
    /**
     * Create multi amqp connections
     *
     * @param options {Array}           @see createConnection()
     * @returns       {Promise.<Object>}
     */
    async createConnections(options) {
        let opts = options || [];
        if (!_.isArray(options)) {
            opts = [options];
        }

        const errors = {};
        const connections = {};
        const promises = opts.map(async option => {
            try {
                connections[option.id] = await exports.createConnection(option.id, option.options, option.extra);
            } catch (e) {
                errors[option.id] = e;
            }
        });
        await Promise.all(promises);

        return {connections, errors};
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
            const conn = amqp.createConnection(options, extra);
            conn.on('error', err => {
                if (isInitial) {
                    reject(err);
                }
            });
            conn.on('ready', _ => {
                if (isInitial) {
                    isInitial = false;
                    connManager.addConnection(id, new Connection(id, conn, options, extra));
                    resolve(connManager.getConnection(id));
                }
            });
        });
    },

    getConnection(id) {
        return connManager.getConnection(id);
    }
}