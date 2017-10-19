import MultiAMQP from '../../src/MultiAMQP';

const connectionConfig = {
    id: 'test-2',
    options: {
        host: 'localhost',
        port: 5672,
        login: 'guest',
        password: 'guest',
        connectionTimeout: 10000,
        authMechanism: 'AMQPLAIN',
        noDelay: true,
        vhost: '/',
        ssl: {enabled: false}
    },
    extra: {reconnect: true}
};

export async function start() {
    const result = await MultiAMQP.createConnections([connectionConfig]);
    const conn = result.connections[connectionConfig.id];
    conn.on('ready', _ => console.log('connection has been available'));
    conn.on('connectionError', e => console.error(e));
    const exchange = await getExchange(conn);
    const queue = await getQueue(conn);
    exchange.publish('test-routing-key', 'hello message test.');
    console.log('publish a message to test-publish-exchange success.');

    setInterval(() => {
        console.log('state: ', JSON.stringify(MultiAMQP.getState()));
    }, 3000);
}

async function getExchange(conn) {
    return await conn.exchange('test-publish-exchange', {autoDelete: true});
}

async function getQueue(conn) {
    const queue = await conn.queue('test-publish-queue', {autoDelete: true});
    queue.bind('test-publish-exchange', 'test-routing-key');

    return queue;
}

