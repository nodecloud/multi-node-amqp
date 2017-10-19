require('babel-register');

const publish = require('./publish.test');
const receive = require('./receive.test');

publish.start().catch(e => console.log(e));
receive.start().catch(e => console.log(e));