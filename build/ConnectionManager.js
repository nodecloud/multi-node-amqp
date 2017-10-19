"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.addConnection = addConnection;
exports.getConnection = getConnection;
exports.destroy = destroy;
exports.destroyAll = destroyAll;
exports.getAvailableConnections = getAvailableConnections;
exports.getAvailableConnectionIds = getAvailableConnectionIds;
const connections = {};

function addConnection(id, connection) {
    connections[id] = connection;
}

/**
 * Get an exist & available connection.
 *
 * @param id
 * @returns {Connection}
 * @throws Error when the connection is not exist or not available.
 */
function getConnection(id) {
    const conn = connections[id];
    if (!conn) {
        throw new Error(`The connection named ${id} is not available.`);
    }

    return conn;
}

function destroy(id) {
    delete connections[id];
}

function destroyAll() {
    for (const key in connections) {
        destroy(key);
    }
}

function getAvailableConnections() {
    const connections = [];
    for (const key in connections) {
        connections.push(connections[key]);
    }
    return connections;
}

function getAvailableConnectionIds() {
    const ids = [];
    for (const key in connections) {
        ids.push(key);
    }
    return ids;
}