## inspire by Salvatore Sanfilippo aka antirez
- [Auto Complete with Redis](http://oldblog.antirez.com/post/autocomplete-with-redis.html)

### tags
 - `nodejs`, `redis`, `auto complete`

## prerequire
### redis
> docker run -d -p 6379:6379 --name autoCompleteRedis redis:latest

## env
```
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || '6379',
  password: process.env.REDIS_PASS || '',
```

## install
> npm install

## start
> npm start

### dataset
> ./female-names.txt

### big O
 ZRANK and ZRANGE (with a fixed range of 50 elements) 都是 O(log(N))。  
memory requirements 方面，最糟的情況是，每一個字我們都需拆分來存：  
ex: agent
 - a
 - ag
 - age
 - agen
 - agent
 - agent*

所以一個單字，我需要 5 + 1 的儲存空間（假設 M 為 letter，那就是 `N個字*(M+1)` 的需求）  
Ma 為所有字平均有多少 letter，實務上的樣拆分後，其實有很多相同的字(collisions)。故最後結果會 `比 N*(Ma +1) 更好一些`。  
範例中 4960 筆資料，我們需要 14798 個 element，是可以接受的。  
(我實作的 demo 好像多一點點...，可能邏輯哪邊有點差異)

### further feature
文章中有擴充架構，可以列出該 prefix 的 top 5 的頻率詞，例如輸入 "n" 時，先出現 "netflix"、"news"、"new york times"這些熱門關鍵字。

- [我自己的筆記 https://github.com/flameddd/blog/blob/master/2019-02-12%EF%BC%9AAuto%20Complete%20with%20Redis.md](https://github.com/flameddd/blog/blob/master/2019-02-12%EF%BC%9AAuto%20Complete%20with%20Redis.md)

1. 某位 User輸入完一個字，送出查詢了 "news" 給系統。
2. 拿 "news" 這單字的所有 prefixes 設一個 sorted set。如：

- "n" 有一個 sorted set  
- "ne" 有一個 sorted set  
- "new" 有一個 sorted set  
- "news" 有一個 sorted set  
 
3. 每一個 prefix 的 sorted set 執行 `ZINCRBY <prefix> 1 news`
4. 未來 user 在輸入時，就也去對應的 prefix sorted set 的 top 5 拉出來一併當成結果回去。

每一個 prefix 的 sorted set 裡面我們抓 300個 items 就好，如果今天有新的字被搜尋了，然後 sorted set 裡面已經有 300 個了。我們就把 最低分的item（假如這個分數為23) 移除，然後加入這個新的字，並且分數設為 23 + 1

### screen shot
![image info](./result.png)