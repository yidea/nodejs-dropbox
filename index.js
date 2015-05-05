/**
 * Project Dropbox
 *
 * @todo: use chokidar? json-socket,socket.io?
 */
let fs = require("fs");
let path = require("path");
let events = require("events");
let morgan = require("morgan");
let Promise = require("songbird");
let mime = require("mime-types");
let nodeify = require("nodeify");
let rimraf = require("rimraf");
let mkdirp = require("mkdirp");
let argv = require("yargs").argv;
let nssocket = require("nssocket");
let bodyParser = require("body-parser");
let app = require("express")();
let eventsEmitter = new events.EventEmitter();

const NODE_ENV = process.env.NODE_ENV;
const HTTP_PORT = process.env.PORT || 3000;
const TCP_PORT = 1377;
const DELETE = "delete";
const PUT = "put";
const POST = "post";

/**
 * @TCP SERVER
 */
let tcpServer =  nssocket.createServer((socket) => {
  console.log("TCP client connected");
  eventsEmitter.on(DELETE, (data) => {
    socket.send(["io", DELETE], data);
  });

  eventsEmitter.on(PUT, (data) => {
    socket.send(["io", PUT], data);
  });

  eventsEmitter.on(POST, (data) => {
    socket.send(["io", POST], data);
  });
});
tcpServer.listen(TCP_PORT, () => {
  console.log(`TCP server listening on ${TCP_PORT}`);
});

//Client will sync from server over TCP to cwd or CLI `dir` argument
// run http server running: for file CRUD API
// run a tcp server: watch file changes, then notify client
// when curl -v -PUT, created a file via http server: tcp server will issue a change to client


/**
 * @HTTP SERVER API
 */
/**
 * @CLI --dir
 * bode --stage 1 index.js --dir=/Users/ycao2/walmart/github/codepath-nodejs/nodejs-dropbox/test
 * curl -v http://127.0.0.1:3000 -X GET
 */
// app config
const ROOT_DIR = argv.dir ? argv.dir : path.resolve(process.cwd());
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


if (NODE_ENV !== "production") {
  app.use(morgan("dev"));
  let console = require("better-console");
}
app.listen(HTTP_PORT, () => {
  console.log(`HTTP server listening on http://127.0.0.1:${HTTP_PORT}`);
});

/**
 * @HEAD
 * curl -v http://127.0.0.1:3000 --head
 * curl -v http://127.0.0.1:3000/index.js --head
 */
app.head("*", setFileInfo, setHeader, (req, res) => res.end());

/**
 * @GET method
 * curl -v http://127.0.0.1:3000 -X GET
 * curl -v http://127.0.0.1:3000/index.js -X GET
 */
app.get("*", setFileInfo, setHeader, (req, res) => {
  //if dir: list files in dir as json
  if (res.body) {
    res.json(res.body);
    return;
  }
  //if file: read file content and pipe to res
  fs.createReadStream(req.filePath).pipe(res);
});

/**
 * @DELETE method
 * touch foo.js
 * curl -v http://127.0.0.1:3000/foo.js -X DELETE
 * cat foo.js
 * mkdir foo
 * curl -v http://127.0.0.1:3000/foo -X DELETE
 * ls foo
 */
app.delete("*", setFileInfo, (req, res, next) => {
  (async ()=> {
    if (!req.stat) { return res.send(400, "Invalid path"); }

    //if dir: rm-rf, if file: delete file w fs.unlink
    let isDir = req.stat.isDirectory();
    if (isDir) {
      await rimraf.promise(req.filePath);
    } else { //file
      await fs.unlink.promise(req.filePath);
    }
    res.end();

    //Notify TCP server
    eventsEmitter.emit(DELETE, {
      type: DELETE,
      isDir: isDir,
      filePath: req.filePath.replace(ROOT_DIR, ""),
      timestamp: Date.now()
    });
  })().catch(next);
});

/**
 * @PUT method - create new file
 * rm -rf foo
 * curl -v http://127.0.0.1:3000/foo -X PUT
 * ls foo
 * curl -v http://127.0.0.1:3000/foo/bar.js -X PUT -d "hello world"
 *  cat foo/bar.js
 */
app.put("*", setFileInfo, setDirDetails, (req, res, next) => {
  let content = Object.keys(req.body)[0];
  (async () => {
    //if file exist
    if (req.stat) { return res.send(405, "File exists"); }

    //create dir
    await mkdirp.promise(req.dirPath);
    //create file
    if (!req.isDir) {
      //req.pipe(fs.createWriteStream(req.filePath));
      await fs.writeFile.promise(req.filePath, content);
    }
    res.end();

    //Notify TCP server
    eventsEmitter.emit(PUT, {
      type: PUT,
      isDir: req.isDir,
      filePath: req.filePath.replace(ROOT_DIR, ""),
      content: req.isDir ? null : content,
      timestamp: Date.now()
    });
  })().catch(next);
});


/**
 * @POST method - update file
 * curl -v http://127.0.0.1:3000/foo -X POST
 * curl -v http://127.0.0.1:3000/foo/bar.js -X POST -d "hello world from POST"
 * cat foo/bar.js
 */
app.post("*", setFileInfo, setDirDetails, (req, res, next) => {
  let content = Object.keys(req.body)[0];
  (async () => {
    //if file not exist & cannot update dir
    if (!req.stat) { return res.send(405, "Error: File does not exists"); }
    if (req.isDir) { return res.send(405, "Error: Path is directory"); }

    // update content: delete file content first then write content
    await fs.truncate.promise(req.filePath, 0);
    await fs.writeFile.promise(req.filePath, content);
    res.end();

    //Notify TCP server
    eventsEmitter.emit(POST, {
      type: POST,
      isDir: req.isDir,
      filePath: req.filePath.replace(ROOT_DIR, ""),
      content: req.isDir ? null : content,
      timestamp: Date.now()
    });
  })().catch(next);
});

/**
 * @Middleware
 */
function setDirDetails(req, res, next) {
  let filePath = req.filePath;
  let endsWithSlash = filePath.charAt(filePath.length - 1) === path.sep;
  let hasExt = path.extname(filePath) !== "";
  req.isDir = endsWithSlash || !hasExt;
  req.dirPath = req.isDir ? filePath : path.dirname(filePath);
  next();
}

//prep file data to req (filePath, stat)
function setFileInfo(req, res, next) {
  req.filePath = path.resolve(path.join(ROOT_DIR, req.url));
  if (req.filePath.indexOf(ROOT_DIR) !== 0) {
    req.send(400, "Invalid path");
    return;
  }
  //get file stat and set req.stat
  fs.stat.promise(req.filePath)
    .then(stat => req.stat = stat, () => req.stat = null)
    .nodeify(next);
}

function setHeader(req, res, next) {
  nodeify((async ()=> {
    //if dir: set list of file
    if (req.stat && req.stat.isDirectory()) {
      let files = await fs.readdir.promise(req.filePath);
      res.body = JSON.stringify(files);
      res.setHeader("Content-Length", res.body.length);
      res.setHeader("Content-Type", "application/json");
      return;
    }
    //if file: set content type
    res.setHeader("Content-Length", req.stat.size);
    let contentType = mime.contentType(path.extname(req.filePath));
    res.setHeader("Content-Type", contentType);
  })(), next);
}
