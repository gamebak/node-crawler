const express = require('express');
const axios = require('axios');

class Crawl 
{
  constructor(url) 
  {
    this.url = url;
    // indexed links    
    this.internalUrl = [];
    this.externalUrl = [];
    // boolean - index represents internalUrl to keep track of what was visited
    this.visitedUrls = []; // visited [i] = internalUrl[i]

    this.images = [];
    this.hostname = '';
    this.limitCrawling = 10;
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
    let regexImg =  /([a-z\-_0-9\/\:\.]*\.(jpg|jpeg|png|gif))/gi;
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

  /** Filter for special links, prevent http://example.com/abc#1234 to be seen as internal
   * @param string strLink
   * @return string
  */
  getFilteredLink(strLink) 
  {
    let regexHref = /(.*?)#/
    let match = strLink.match(regexHref)
    if(match) 
    {
      // filter last character / for links that contain ids
      let lastCharacter = match[1].length-1;
      if(match[1][lastCharacter] == '/') 
      {
        match[1] = match[1].substr(0,lastCharacter);
      }
      return match[1]; 
    }

    return strLink;
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
      let currentUrl = this.getFilteredLink(matchedUrl[1]);

      if(currentUrl !== undefined && currentUrl[0] != '#' && this.isNewLink(currentUrl) )
      {
        // internal
        if(this.getLinkClasification(currentUrl))
        {
          this.internalUrl.push(currentUrl);
        }
        else
        {
          this.externalUrl.push(currentUrl);
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

  /** Output fetched data only */
  getData()
  {
    console.log('discovered internal links');
    console.log(this.internalUrl);
    console.log('------');

    console.log('discovered external links');
    console.log(this.externalUrl);
    console.log('------');
    
    console.log('discovered images');
    console.log(this.images);
  }

  /** Find the next link to parse
   * @return string
  */
  getNextVisitingLink()
  {
    return this.internalUrl[this.visitedUrls.length];
  }

  /** 
   * Increments visited array with a value
   * */
  setVisitedIncrement()
  {
    this.visitedUrls.push(true);
  }


  /**
   * Main crawler loop, starts from one point and maps a specific website
  */
  main()
  {
    this.getInnerLinks(this.url).then((result) => {
      
      const loop = async value => {
        let i = 0;
        let minValue = Math.min(this.limitCrawling,this.internalUrl.length);

        while (i < minValue) 
        {
          let url = this.getNextVisitingLink();
          let result = await this.getInnerLinks(url);
          console.log('visiting internal url:'+url);
          this.setVisitedIncrement();
          i++;
        }
      }

      // display what was discovered in the console after the loop finishes
      loop(0).then(() => this.getData());
    });
  }
}

// change this url to what you desire
let url = 'http://wiprodigital.com/';
var crawl = new Crawl(url);
crawl.main();
