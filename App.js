
const express = require('express');
const axios = require('axios');
const _ = require('lodash');
const NodeCache = require('node-cache');

const app = express();
const port = process.env.PORT || 3000;

// Initialize a cache with a time-to-live (TTL) of 1 minute (60 seconds)
const cache = new NodeCache({ stdTTL: 60 });


app.get('/api/blog-stats', async (req, res, next) => {
  try {
    
    const cachedData = cache.get('blogStats');

    if (cachedData) {
      console.log('Returning cached data');
      return res.json(cachedData);
    }

    // Fetching data from third-party API
    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    });

    // response contains a property 'blogs' that holds the array of blogs
    const blogs = Array.isArray(response.data.blogs) ? response.data.blogs : [];

    if (blogs.length === 0) {
      throw new Error('No blog data found');
    }

    // for calculating the statistics
    const totalBlogs = blogs.length;
    const longestTitleBlog = _.maxBy(blogs, (blog) => blog.title.length);
    const blogsWithPrivacy = blogs.filter((blog) =>
      blog.title.toLowerCase().includes('privacy')
    );
    const uniqueTitles = _.uniqBy(blogs, 'title');

    
    cache.set('blogStats', {
      totalBlogs,
      longestTitle: longestTitleBlog.title,
      blogsWithPrivacy: blogsWithPrivacy.length,
      uniqueTitles: uniqueTitles.map((blog) => blog.title),
    });

    // Responding with the statistics
    res.json({
      totalBlogs,
      longestTitle: longestTitleBlog.title,
      blogsWithPrivacy: blogsWithPrivacy.length,
      uniqueTitles: uniqueTitles.map((blog) => blog.title),
    });
  } catch (error) {
    
    console.error('Error while fetching blog data:', error);


    res.status(500).json({ error: 'Error fetching blog data', message: error.message });
  }
});

// Blog search endpoint
app.get('/api/blog-search', async (req, res) => {
  const query = req.query.query;

  try {
    // Fetching data from the third-party API
    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    });

    
    const blogs = Array.isArray(response.data.blogs) ? response.data.blogs : [];

    if (blogs.length === 0) {
      throw new Error('No blog data found');
    }

    
    const searchResults = blogs.filter((blog) =>
      blog.title.toLowerCase().includes(query.toLowerCase())
    );

    // Responding with the search results   
    res.json(searchResults);
  } catch (error) {

    console.error('Error fetching blog data for search:', error);

   
    res.status(500).json({ error: 'Error performing the blog search', message: error.message });
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
