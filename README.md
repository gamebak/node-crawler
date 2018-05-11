# node-crawler
Nodejs web crawler functional for a single domain call

##Usage
```javascript
node index.js
```

##Configure
### Url configuration
```javascript
// change this url to your desired url inside index.js
let url = 'http://wiprodigital.com/';

```

### Parsing limit
I took the liberty to add a parsing limit, in case there's a big website like google, without a limit the crawler will keep going.
```javascript
// this value is located in the contructor()
this.limitCrawling = 10;
```


###What can be improved:
* database to store previous sessions and to keep track when was the last time a page was crawled
* hash tables for efficient indexing
* publisher/subscriber with a queue to distribute workload to multiple servers
* paralell crawling with multiple downloads in the same thread and multithreading to scale on each core with cluster module
* reduce indexed links length by removing main domain from internal links

