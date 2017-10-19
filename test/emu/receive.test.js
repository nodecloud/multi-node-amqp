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

    queue.subscribe({}, (message, headers, deliveryInfo, messageObject, other) => {
        console.log(other, message, headers, deliveryInfo, messageObject);
    });

    console.log('ready for listening message.');
}

async function getExchange(conn) {
    return await conn.exchange('test-exchange', {autoDelete: true});
}

async function getQueue(conn) {
    const queue = await conn.queue('test-queue', {autoDelete: true});
    queue.bind('test-exchange', 'test-routing-key');

    return queue;
}

