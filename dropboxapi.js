/**
 * Project Dropbox
 *
 */
let fs = require("fs");
let path = require("path");
let _ = require("underscore");
let Promise = require("songbird");

let console = require("better-console");
let http = require("http");
let Dropbox = require("dropbox");

let dropboxClient = new Dropbox.Client({
  key: DROPBOX_KEY,
  secret: DROPBOX_SECRET,
  token: DROPBOX_TOKEN
});

async function asyncDropbox() {
  //Dropbox API http://coffeedoc.info/github/dropbox/dropbox-js/master/classes/Dropbox/Client.html
  //@ auth
  await dropboxClient.promise.authenticate();
  //@ write file
  //let stat = await dropboxClient.promise.writeFile("hello2.txt", "hello world");
  //console.log(stat);

  //@ read file
  //let file = await dropboxClient.promise.readFile("hello.txt");
  //console.info(file[0]); //=hello world

  //@ readdir
  //let dir = await dropboxClient.promise.readdir("/");
  //console.info( dir.length);
}

asyncDropbox();
//JSON server
//http.createServer((req, res) => {
//  ls("./test").then(function (data) {
//    let result = JSON.stringify(data);
//    res.setHeader("Content-Type", "application/json");
//    res.end(result);
//  });
//}).listen(8000, "127.0.0.1");
//console.log("Server running at http://127.0.0.1:8000/");

/**
 * @a: recusive
 * validate dir
 * return base case !isDirectory -> output file path
 * iterate files in dir and await recusive result
 *
 * @param dirPath
 * @returns {*}
 */
async function ls(dirPath) {
  // get dir stat
  let stat = await fs.promise.stat(dirPath);
  if (!stat.isDirectory()) { return [dirPath]; }

  let filenames = [];
  for (let name of await fs.promise.readdir(dirPath)) {
    let result = await ls(path.join(dirPath, name));
    filenames.push(...result); //concat array
  }

  return filenames;
}

// run
//async ()=> {
//  try {
//    console.log(await ls("./test"));
//  } catch(e) {
//    console.log(e.stack);
//  }
//}();

//ls("./test").then(function (data) {
//  console.log(data);
//});

//async function ls(dir) {
//  //try {
//  //  await fs.promise.readdir(dir);
//  //}
//}
