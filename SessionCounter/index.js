const cookie = require("cookie");
const redis = require("redis");
const util = require("util");
const crypto = require("crypto");

const SESSION_COOKIE = "SessionCounterToken";
const SESSION_EXPIRATION = process.env.redis_sessiontime || (2 * 60);
const redisClientBase = redis.createClient(process.env.redis_port || 6380, process.env.redis_host, {
    "auth_pass": process.env.redis_authpass,
    "tls": {
        "servername": process.env.redis_host
    }
});
const redisClient = {
    "get": util.promisify(redisClientBase.get).bind(redisClientBase),
    "setex": util.promisify(redisClientBase.setex).bind(redisClientBase),
    "set": util.promisify(redisClientBase.set).bind(redisClientBase)
}

module.exports = function (context, req) {
    context.log('JavaScript SessionCounter HTTP trigger function processing a request.');
    const cookies = cookie.parse(req.headers.cookie || "");
    const sessionToken = cookies[SESSION_COOKIE] || crypto.randomBytes(64).toString('hex');
    context.log(`Generated or retrieved session token: ${sessionToken}`);

    redisClient.get(sessionToken).then(value => {
        let counterValue = value ? JSON.parse(value).counter : 0;
        counterValue++;
        const obj = {
            "counter": counterValue
        }
        return Promise.all([
            redisClient.setex(sessionToken, SESSION_EXPIRATION, JSON.stringify(obj)),
            Promise.resolve(obj)
        ]);
    }).then(promiseValues => {
        const obj = promiseValues[1];
        context.res = {
            headers: {
                "Content-Type": "application/json",
                "Set-Cookie": cookie.serialize(SESSION_COOKIE, sessionToken)
            }, 
            "status": 200,
            "body": JSON.stringify(obj)
        }
        context.done();

    }).catch(err => {
        context.done(err);
    })
};