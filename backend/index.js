const express = require('express');
const axios = require('axios');
require('dotenv').config();

const apiHost = process.env.RAPIDAPI_HOST;
const apiKey = process.env.RAPIDAPI_KEY;
const affiliateID = 'salecheck-20';

// DEBUG: Log environment check
console.log('Environment check:', {
  hasHost: !!apiHost,
  hasKey: !!apiKey,
  port: process.env.PORT || 3000,
});

console.log('API CONFIG CHECK:', {
  host: !!apiHost,
  key: !!apiKey,
});

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD'); // Added HEAD
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-RapidAPI-Host, X-RapidAPI-Key');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Use .end() to ensure the connection closes
  }
  next();
});

function makeAffiliateLink(asin, originalURL) {
    const urlParams = new URLSearchParams(originalURL.split('?')[1] || '')
    const existingTag = urlParams.get('tag')

    if (existingTag) {
        return `https://www.amazon.com/dp/${asin}?tag=${existingTag}`
    }

    return `https://www.amazon.com/dp/${asin}?tag=${affiliateID}`
}

function parseASIN(url) {
    if (typeof url !== 'string') {
        throw new Error('URL must be a string')
    }
    url = url.trim()
    const cleanURL = new URL(url)

    if (cleanURL.protocol !== 'https:') {
        throw new Error('URL must be a valid amazon product page.')
    }
    if (cleanURL.hostname !== 'www.amazon.com') {
        throw new Error('URL must be a valid amazon product page.')
    }
    if (!cleanURL.pathname.includes('/dp/') && 
        !cleanURL.pathname.includes('/gp/product/')) {
        throw new Error('URL must be a valid amazon product page.')
    }
    let ASIN = ''
    let clean_arr = cleanURL.pathname.split('/')
    for (let i = 0; i < clean_arr.length; i++) {
        if (clean_arr[i] == 'dp') {
            ASIN = clean_arr[i+1]
            break
        }
        else if (clean_arr[i] == 'product') {
            ASIN = clean_arr[i+1]
            break
        }
    }
    if (ASIN == '') {
        throw new Error('Product not found')
    } 
    if (ASIN.length != 10){
        throw new Error('Product not found')
    }
    const valid_ASIN_pattern =  /^[A-Za-z0-9]+$/
    if (!valid_ASIN_pattern.test(ASIN)) {
        throw new Error('Product not found')
    }
    console.log('ASIN:', ASIN)
    return ASIN
}

function extractProductType(data) {
  if (!data || !data.product_title) return '';

  const info = data.product_information || {};
  const title = data.product_title;

  // 1. ANCHOR: The Brand
  const brand = info.Brand || title.split(' ')[0];

  // 2. ANCHOR: The Core Identity (from Category)
  let coreNoun = '';
  if (data.category_path && data.category_path.length > 0) {
    const lastCat = data.category_path[data.category_path.length - 1];
    if (lastCat && lastCat.name) {
      coreNoun = lastCat.name
        .replace(
          /(Makers|Machines|Brewers|Systems|Units|Pot|Appliances)/gi,
          ''
        )
        .trim();
    }
  }

  // 3. ANCHOR: The Model/Series
  let differentiator = '';
  const rawModel = info['Model Name'] || '';
  
  if (rawModel) {
    // Take first word of Model Name that isn't the brand
    const modelWords = rawModel
      .split(' ')
      .filter(
        (w) => !brand.toLowerCase().includes(w.toLowerCase())
      );
    differentiator = modelWords.slice(0, 1)[0] || '';
  }

  // 4. FALLBACK: Subtraction Logic (if no Model Name field)
  if (!differentiator || differentiator.length < 3) {
    const words = title.replace(/[()]/g, '').split(/[\s,-]+/);
    const filler = [
      'with',
      'for',
      'the',
      'and',
      'new',
      'original',
    ];
    
    for (let word of words) {
      const clean = word.trim();
      const lower = clean.toLowerCase();
      if (
        lower.length < 3 || 
        brand.toLowerCase().includes(lower) || 
        coreNoun.toLowerCase().includes(lower) ||
        filler.includes(lower) ||
        /^\d+$/.test(clean)
      ) continue;
      
      differentiator = clean;
      break;
    }
  }

  // 5. ASSEMBLE: [Brand] [Differentiator] [CoreNoun]
  let finalTitle = 
    `${brand} ${differentiator} ${coreNoun}`.replace(/\s+/g, ' ').trim();

  // Final length control (3-4 words)
  return finalTitle.split(' ').slice(0, 4).join(' ');
}

app.head('/healthz', (req, res) => {
  res.status(200).end();
});

app.get('/healthz', (req, res) => {
  res.status(200).end();
});

app.head('/', (req, res) => {
  res.status(200).end();
});

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

app.get('/products', (req, res) => {
    res.json({message: "No products yet"})
    console.log('to be implemented later')
})

app.get('/products/by_url', async (req, res) => {
    try {
        const user_url = req.query.url
        const asin = parseASIN(user_url)
        const api_url = 
          'https://' + apiHost + '/product-details?asin=' + asin
        const response = await axios.get(api_url, {
            headers: {
                'X-RapidAPI-Host': apiHost, 
                'X-RapidAPI-Key': apiKey
            }
        })
        const fullData = response.data.data
        let filter_res = {
            'product_title': extractProductType(fullData),
            'product_price': fullData.product_price,
            'product_original_price': fullData.product_original_price,
            'product_asin': asin,
            'affiliate_link': makeAffiliateLink(asin, user_url)
        }
        res.json(filter_res)
    }
    catch (error) {
        res.status(500).json({error: error.message})
    }
})

app.get('/products/asin/:asin', async (req, res) => {
    try {
        const asin = req.params.asin
        let url = 
          'https://' + apiHost + '/product-details?asin=' + asin
        const response = await axios.get(url, {
            headers: {
                'X-RapidAPI-Host': apiHost, 
                'X-RapidAPI-Key': apiKey
            }
        })
        const fullData = response.data.data
        let filter_res = {
            'product_title': extractProductType(fullData),
            'product_price': fullData.product_price,
            'product_original_price': fullData.product_original_price,
            'product_asin': asin,
        }
        res.json(filter_res)
    }
    catch (error) {
        res.status(500).json({error: error.message})
    }
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server live on port ${PORT}`);
});