'use strict';

// require built-in dependencies
const path = require('path');
const util = require('util');
const fs = require('fs');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const readDir = util.promisify(fs.readdir);

// require express-related dependencies
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// require local dependencies
const logger = require('./middleware/logger');

// declare local constants and helper functions
const PORT = process.env.PORT || 3000;
const DATA_DIR = 'data';
const TAG_RE = /#\w+/g;
const slugToPath = (slug) => {
  const filename = `${slug}.md`;
  return path.join(DATA_DIR, filename);
};

// initialize express app
const app = express();

// use middlewares
app.use(cors());
app.use(logger);
app.use(bodyParser.json());
// this commented line of code will statically serve the frontend
// it will not work until you:
// $ cd client
// $ yarn install
// $ yarn build
app.use('/', express.static(path.join(__dirname, 'client', 'build')));



// GET: '/api/page/:slug'
// success response: {status: 'ok', body: '<file contents>'}
// failure response: {status: 'error', message: 'Page does not exist.'}
app.get('/api/page/:slug', async (req, res) => {
  const filename = slugToPath(req.params.slug);
  try {
    const body = await readFile(filename, 'utf-8');
    res.json({ status: 'ok', body });
    // return jsonOK(res, { body });
  } catch (e) {
    res.json({ status: 'error', message: 'Page does not exist.' });
    // return jsonError(res, 'Page does not exist.');
  }
});


// POST: '/api/page/:slug'
//  body: {body: '<file text content>'}
// tries to write the body to the given file
//  success response: {status: 'ok'}
//  failure response: {status: 'error', message: 'Could not write page.'}
app.post('/api/page/:slug', async (req, res) => {
  const filename = slugToPath(req.params.slug);
  try {
    // read request body which still is not file
    const text = req.body;
    // write current change to in file
    await writeFile(filename, text.body);

    console.log(data[0]:'Files has been changed', data[1]: text);
    res.json({status: 'ok', text});

  } catch (e) {
    res.json({status:'error', message: 'Could not write page'});
  }
});


// GET: '/api/pages/all'
// sends an array of all file names in the DATA_DIR
// file names do not have .md, just the name!
//  success response: {status:'ok', pages: ['fileName', 'otherFileName']}
//  failure response: no failure response
app.get('/api/pages/all', async (req, res) => {
  // first read all files name
  const pathOfData= __dirname + '/' + DATA_DIR;
  const readDirectory = await readDir(pathOfData);
  // remove .md from files name
  const removedMd = [];

  readDirectory.forEach((element) => {
    removedMd.push(element.replace('.md', ''));
  });
  res.json({status: 'ok', pages: removedMd});
});


// GET: '/api/tags/all'
// sends an array of all tag names in all files, without duplicates!
// tags are any word in all documents with a # in front of it
// hint: use the TAG_RE regular expression to search the contents of each file
//  success response: {status:'ok', tags: ['tagName', 'otherTagName']}
//  failure response: no failure response
app.get('/api/tags/all', async (req, res) => {
  // first read all files
  const pathOfData = __dirname + '/' +DATA_DIR;
  const readDirectory = await readDir(pathOfData);

  // loop over files and get their content
  const tags= [];
  let concatTags = [];
  readDirectory.forEach((file)=>{
    const filePath = __dirname + '/' +DATA_DIR + '/' + file;
     // read file content
    //const TAG_RE = /#\w+/g;
    // \wFind a word character
    // /g 	Perform a global match (find all matches rather than stopping after the first match)
    const body = fs.readFileSync(filePath, 'utf-8');
    const findTags = body.match(TAG_RE);
    // remove # from words
    const pureLetter = [];
    findTags.forEach((element) => {
      pureLetter.push(element.replace('#', ''));
    });
    //...new Set(chars) Remove duplicates from an array using a Set, concat two array
    concatTags = [...new Set(tags.concat(pureLetter))];

  });
  res.json({ status: 'ok', tags: concatTags });

});


// GET: '/api/tags/:tag'
// searches through the contents of each file looking for the :tag
// it will send an array of all file names that contain this tag (without .md!)
//  success response: {status:'ok', tag: 'tagName', pages: ['tagName', 'otherTagName']}
//  failure response: no failure response
app.get('/api/tags/:tag', async (req, res) => {
  const tagName = req.params.tag;
  // first read all files
  const pathOfData = __dirname + '/' + DATA_DIR;
  const readDirectory = await readDir(pathOfData);

  // loop over files and if tag exist then show its file
  let tag = '';
  let pages = [];
  readDirectory.forEach((file) => {
    const filePath = __dirname + '/' + DATA_DIR + '/' + file;

    const body = fs.readFileSync(filePath, 'utf-8');
    const findTags = body.match('#' + tagName);
    if (findTags) {
      // if tag exist write its page name
      tag = tagName;
      pages.push(file.replace('.md', ''));
    }
  });
  res.json({ status: 'ok', tag: tag, pages: pages });
});


// this needs to be here for the frontend to create new wiki pages
//  if the route is not one from above
//  it assumes the user is creating a new page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});


app.listen(PORT, (err) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(`Wiki app is serving at http://localhost:${PORT}`)
});
