const connections = {};

export function addConnection(id, connection) {
    connections[id] = connection;
}

/**
 * Get an exist & available connection.
 *
 * @param id
 * @returns {Connection}
 * @throws Error when the connection is not exist or not available.
 */
export function getConnection(id) {
    const conn = connections[id];
    if (!conn) {
        throw new Error(`The connection named ${id} is not available.`);
    }

    return conn;
}

export function destroy(id) {
    delete connections[id];
}

export function destroyAll() {
    for (const key in connections) {
        destroy(key);
    }
}

export function getAvailableConnections() {
    const connections = [];
    for (const key in connections) {
        connections.push(connections[key]);
    }
    return connections;
}

export function getAvailableConnectionIds() {
    const ids = [];
    for (const key in connections) {
        ids.push(key);
    }
    return ids;
}