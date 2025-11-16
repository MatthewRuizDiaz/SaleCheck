const express = require('express')
const axios = require('axios')
require('dotenv').config()

const app = express()
const apiHost = process.env.RAPIDAPI_HOST
const apiKey = process.env.RAPIDAPI_KEY

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
    if (!cleanURL.pathname.includes('/dp/') && !cleanURL.pathname.includes('/gp/product/')) {
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

function cleanTitle (product_title) {
    return product_title.split(/\s+/).slice(0, 5).join(" ")
}

app.get('/', (req, res) => {
    res.json({message: 'API is live'})
    console.log('API is live')
})

app.get('/products', (req, res) => {
    res.json({message: "No products yet"})
    console.log('to be implemented later')
})

app.get('/products/by_url', async (req, res) => {
    try {
        const user_url = req.query.url
        const asin = parseASIN(user_url)
        const api_url = 'https://' + apiHost + '/product-details?asin=' + asin
        const response = await axios.get(api_url, {
            headers: {
                'X-RapidAPI-Host': apiHost, 
                'X-RapidAPI-Key': apiKey
            }
        })
        let filter_res = {
            'product_title': response.data.data.product_title,
            'product_price': response.data.data.product_price,
            'product_original_price': response.data.data.product_original_price,
            'product_asin': asin,
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
        let url = 'https://' + apiHost + '/product-details?asin=' + asin
        const response = await axios.get(url, {
            headers: {
                'X-RapidAPI-Host': apiHost, 
                'X-RapidAPI-Key': apiKey
            }
        })
        let filter_res = {
            'product_title': response.data.data.product_title,
            'product_price': response.data.data.product_price,
            'product_original_price': response.data.data.product_original_price,

        }
        res.json(filter_res)
    }
    catch (error) {
        res.status(500).json({error: error.message})
    }
})

app.listen(3000, () => {
    console.log('listening on port 3000')
})