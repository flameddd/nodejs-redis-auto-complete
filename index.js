const redis = require('redis');
const fs = require('fs');
const readline = require('readline');
const promisify = require('util').promisify;

const DEFAULT_REDIS_SET_NAME = 'myzset';
const isKeywork = new RegExp(/\*$/);

const rl = readline.createInterface({
  input: fs.createReadStream('./female-names.txt'),
  crlfDelay: Infinity
});

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || '6379',
  password: process.env.REDIS_PASS || '',
});

const zrankAsync = promisify(client.zrank).bind(client);
const zrangeAsync = promisify(client.zrange).bind(client);

let keyword_list = [DEFAULT_REDIS_SET_NAME];
rl.on('line', (line) => {
  for (let index = 1; index <= line.length; index++) {
    keyword_list.push(0)
    keyword_list.push(line.substring(0, index))
  }
  keyword_list.push(0)
  keyword_list.push(`${line}*`)
})
  .on('close', function () {
    client.zadd(keyword_list, function (err, response) {
      if (err) {
        console.log(err)
        throw err;
      }
      console.log('init redis data sets, added ' + response + ' items.');
    });
  });

let results = []
const rangelen = 50 // This is not random, try to get replies < MTU size

async function getKeyword({ prefixKeyword, count }) {
  try {
    let startIndex = await zrankAsync([DEFAULT_REDIS_SET_NAME, prefixKeyword])
    
    while (typeof startIndex === "number" && results.length < count) {
      const res = await zrangeAsync([
        DEFAULT_REDIS_SET_NAME,
        startIndex,
        startIndex + rangelen
      ])
      if (!res.length) {
        break;
      }
      const formattedRes = res
        .filter(value => value.match(isKeywork))
        .map(value => value.replace(/\*$/, ''))
      results = results.concat(formattedRes)

      startIndex = startIndex + rangelen;
    }
    console.log('結果為：')
    console.log(results)
  } catch (error) {
    console.error(error)
  }
}

getKeyword({ prefixKeyword: 'vall', count: 50 })
