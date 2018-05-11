const express = require('express');
const axios = require('axios');

class Crawl 
{
  constructor() 
  {
    // indexed links    
    this.internalUrl = []; // (url) - same index for visited
    this.externalUrl = [];
    // boolean - index represents internalUrl to keep track of what was visited
    this.visitedUrls = []; // visited [i] = internalUrl[i]

    this.images = [];
    this.hostname = '';
    this.limitParsing = 5;
  }

  /** 
   * Get page html content and return it as a string and establish hostname for our crawler session
   * @param string url
   * @return promise|boolean
   */
  async getPageContent(url)
  {
    if(this.hostname == '')
    {
      this.setHostname(this.getHostname(url));
    }

    try 
    {
      const result = await axios.get(url);
      return result.data;

    } catch (error) {
      console.error(error);
    }

    return false;
  }

  /**
   * Find all links and images for a specific url address
   * @param string url
  */
  async getInnerLinks(url) 
  {
    let data = await this.getPageContent(url);
    let links = this.getMatchedLinks(data);
    let images = this.getImages(data);

    this.setCachedImages(images);
    
    return links;
  }


  /**
   * Locate any type of image in the html code
   * @param string data
   * @return array
  */
  getImages(data)
  {
    let regexImg = /(http[s]?:\/\/.*\.(?:png|jpg|gif|svg|jpeg))/gi;
    let match = data.match(regexImg);

    return match;
  }

  /** Check if an image is already cached 
   * @param string imgSrc
   * @return boolean
  */
  isNewImage(imgSrc)
  {
    let count = this.images.length;
    let i;

    for(i = 0; i < count; i++) 
    {
      if(this.images[i] == imgSrc) 
      {
        return false;
      }
    }

    return true;
  }

  /** Index images locations in the crawler info
   * @param array arrImages
  */
  setCachedImages(arrImages)
  {
    let i;
    let count = arrImages.length;
    for(i = 0; i<count; i++) 
    {
      if(this.isNewImage(arrImages[i])) 
      {
        this.images.push(arrImages[i]);
      }
    }
  }

  /**
   * Verify if it's a new link and return true/false
   * @param string link
   * @return boolean
  */
  isNewLink(link)
  {
    let i, count;
    let boolInternalLink = this.getLinkClasification(link);
    
    if(boolInternalLink)
    {  
      count = this.internalUrl.length;
      for(i = 0; i< count; i++ ) 
      {
        if(this.internalUrl[i] == link) 
        {
          return false;
        }
      }
    }
    else
    {
      count = this.externalUrl.length;
      for(i = 0; i< count; i++ ) 
      {
        if(this.externalUrl[i] == link) 
        {
          return false;
        }
      }
    }

    return true;
  }

  /** Index links found and establish what wasn't crawled yet
   * @param array arrLinks
  */
  setCachedLinks(arrLinks)
  {
    let i;
    let count = arrLinks.length;
    for(i=0; i< count; i++) 
    {

    }

  }

  /** 
   * Get an output with matched links inside page content
   * @param string data     raw html data
   * @return array          array with discovered urls
  */
  getMatchedLinks(data) 
  {
    // extract every a href info
    let regexHref = /<a.*?href=["|'](.*?)["|']/gim;
    let matchesLinks = data.match(regexHref);
   
    // extract href source from all the links and add it to url array
    let regexUrl = /href=["|'](.*?)["|']/
    let i;
    let urls = [];

    for(i = 0; i<matchesLinks.length;i++) 
    {
      let matchedUrl = matchesLinks[i].match(regexUrl);
      if(matchedUrl[1] !== undefined && matchedUrl[1][0] != '#' && this.isNewLink(matchedUrl[1]) )
      {
        // internal
        if(this.getLinkClasification(matchedUrl[1]))
        {
          this.internalUrl.push(matchedUrl[1]);
        }
        else
        {
          this.externalUrl.push(matchedUrl[1]);
        }
      }
    }
  }

  /**
   * Detect if it's an internal or external url and if it's an image
   * @param string url
  */
  getLinkClasification(url) 
  {
    if(url[0] == '/' || this.getHostname(url) == this.hostname) {
      return true;
    }
    
    return false;
  }

  /**
   * Extract hostname from an url
   * @param string url
   * @return string
  */
  getHostname(url) 
  {
    let host;

    if (url.indexOf("://") > -1)
    {
      host = url.split('/')[2];
    }
    else 
    {
      host = url.split('/')[0];
    }

    host = host.split(':')[0];
    host = host.split('?')[0];

    return host;
  }

  /**
   * Set main domain root to identify what are the internal links for the current url
   * @param string hostname
  */
  setHostname(hostname)
  {
    this.hostname = hostname;
  }

  getData()
  {
    console.log(this.internalUrl);
    console.log('------');
    console.log(this.externalUrl);
    console.log('------');
    console.log(this.images);
  }

  main()
  {
    let url = 'http://wiprodigital.com/';
    this.getInnerLinks(url).then((result) => {
      // console.log(result);
      this.getData();      
      console.log('parsing finished');
    });
  }
}

// initialise crawler
var crawl = new Crawl();
var app = express();

let url = 'http://wiprodigital.com/';
crawl.main();

// app.get('/', function (req, res) {  
//   crawl.getInnerLinks().then((result) => {
//     // console.log(result);
//   });
//   res.send('crawling your page');
  
// });

app.listen(3000);
