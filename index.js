const redis = require('redis');
const fs = require('fs');
const readline = require('readline');
const promisify = require('util').promisify;

const DEFAULT_REDIS_SET_NAME = 'myzset';
const isKeywork = new RegExp(/\*$/);

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || '6379',
  password: process.env.REDIS_PASS || '',
});

const zrankAsync = promisify(client.zrank).bind(client);
const zrangeAsync = promisify(client.zrange).bind(client);
const zaddAsync = promisify(client.zadd).bind(client);

function readDataFlow() {
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: fs.createReadStream('./female-names.txt'),
      crlfDelay: Infinity
    });
    let keyword_list = [DEFAULT_REDIS_SET_NAME];

    rl.on('line', (line) => {
      for (let index = 1; index <= line.length; index++) {
        keyword_list.push(0)
        keyword_list.push(line.substring(0, index))
      }
      keyword_list.push(0)
      keyword_list.push(`${line}*`)
    })
      .on('close', () => resolve(keyword_list));
  })
}

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

async function mainFlow() {
  const keyword_list = await readDataFlow();
  const insertedData = await zaddAsync(keyword_list)
  console.log('init redis data sets, added ' + insertedData + ' items.');
  await getKeyword({ prefixKeyword: 'b', count: 50 })
  client.quit();
  process.exit(0);
}

mainFlow();