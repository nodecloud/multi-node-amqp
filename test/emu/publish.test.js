import MultiAMQP from '../../src/MultiAMQP';

const connectionConfig = {
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
    const conn = await MultiAMQP.createConnection('test-1', connectionConfig.options, connectionConfig.extra);
    conn.on('ready', _ => console.log('connection has been available'));
    conn.on('connectionError', e => console.error(e));
    const exchange = await getExchange(conn);
    const queue = await getQueue(conn);
    exchange.publish('test-routing-key', 'hello message test.');
    console.log('publish a message to test-publish-exchange success.');
}

async function getExchange(conn) {
    return await conn.exchange('test-publish-exchange', {autoDelete: true});
}

async function getQueue(conn) {
    const queue = await conn.queue('test-publish-queue', {autoDelete: true});
    queue.bind('test-publish-exchange', 'test-routing-key');

    return queue;
}

