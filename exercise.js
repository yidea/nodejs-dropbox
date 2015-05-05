/**
 * Project Dropbox
 */
let fs = require("fs");
let path = require("path");
let _ = require("underscore");
let Promise = require("songbird");

let console = require("better-console");

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

/**
 * @ FS
 *
 * @todo:
 * check file/folder exist
 * read size of folder
 * read from 2 souce files async, pending on 2 finished then promise
 */

let fsUtil = {
  /**
   * copy file A to B w stream
   * @param filenameA
   * @param filenameB
   * @api copyFile("./package.json", "./test/copy.json");
   */
  copyFile: function (filenameA, filenameB) {
    let readable = fs.createReadStream(filenameA);
    let writeable = fs.createWriteStream(filenameB);
    readable.pipe(writeable); //data pipe to writable stream
    console.log("copied %s %s", filenameA, filenameB);
  },

  /**
   * readdirRecursive
   *
   * @return {promise}
   * @api:
   * fsUtil.readdirRecursive("./", function (err, data) {}
   *
   * @i: path="./"
   * @o: index.js
   * /node_modules/better-consoles ..
   *
   * @a:
   * - read first level of dir w readdir
   * - if file isDirectory -> recursive
   * - if file isFile -> push to file
   *
   * @todo:
   * hidden file check ?
   * ignore file? e.g. node_module
   * add cb?
   */
  readdirRecursive (dir) {
    let directChild = [];
    return fs.promise.readdir(dir)
      .then((fileNames) => {
        // get file stat async
        let promises = _.map(fileNames, function (fileName) {
          return fs.promise.stat(path.join(dir, fileName))
            .then(function (data) {
              return _.extend({}, data, {fileName: fileName}); //add fileName in stat
            });
        });
        //throw new Error("err");
        return Promise.all(promises); //return [{},{}..]
      })
      .then(function (stats) {
        let promises = [];
        _.each(stats, function (stat) {
          if (stat.isFile()) {
            directChild.push(stat.fileName);
          } else if(stat.isDirectory()) {
            //let obj = {folder: stat.fileName, files: []};

            promises.push(
              fsUtil.readdirRecursive(path.join(dir, stat.fileName)).then(function (data) {
                return {folder: stat.fileName, files: data};
              })
            );
          }
        });
        return Promise.all(promises).then(function (data) {
          return [directChild, data];
        });
      })
      .then(function (data) {
        return _.flatten(data);
      })
      .catch((e) => {
        console.log(e.stack);
      });
  }
};

fsUtil.readdirRecursive("./test")
  .then(function (data) {
    console.error(JSON.stringify(data, null, 2));
  });
