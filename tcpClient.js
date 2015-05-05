/**
 * tcpClient
 *
 * @test
 * npm start //run http server + tcp server
 * npm run client //run tcp client
 *
 * ls test
 * //create
 * curl -v http://127.0.0.1:3000/foo/bar.js -X PUT -d "PUT"
 * cat test/foo/bar.js
 * //update
 * curl -v http://127.0.0.1:3000/foo/bar.js -X POST -d "POST"
 * cat test/foo/bar.js
 * //delete
 * curl -v http://127.0.0.1:3000/foo/bar.js -X DELETE
 * cat test/foo/bar.js
 * curl -v http://127.0.0.1:3000/foo -X DELETE
 * ls
 */
let fs = require("fs");
let path = require("path");
let Promise = require("songbird");
let nssocket = require("nssocket");
let rimraf = require("rimraf");
let mkdirp = require("mkdirp");
let argv = require("yargs").argv;

const ROOT_DIR = argv.dir ? argv.dir : path.join(process.cwd(), "/test");
const TCP_PORT = 1377;
const DELETE = "delete";
const PUT = "put";
const POST = "post";

let tcpClient = new nssocket.NsSocket();
console.log("ROOT_DIR=", ROOT_DIR);

/**
 * @DELETE
 * curl -v http://127.0.0.1:3000/foo.js -X PUT -d "hello foo.js"
 * curl -v http://127.0.0.1:3000/foo.js -X DELETE
 */
tcpClient.data(["io", DELETE], (data) => {
  console.log(data);
  let filePath = path.resolve(path.join(ROOT_DIR, data.filePath));
  (async () => {
    if (data.isDir) { //dir
      await rimraf.promise(filePath);
    } else { //file
      await fs.unlink.promise(filePath);
    }
  })().catch(err => console.log(err));
  console.log("Client: deleted " + filePath);
});

/**
 * @PUT - create
 * curl -v http://127.0.0.1:3000/foo.js -X PUT -d "method: PUT"
 * cat test/foo.js
 */
tcpClient.data(["io", PUT], (data) => {
  console.log(data);
  let dirPath = data.isDir ? data.filePath : path.dirname(data.filePath);
  dirPath = path.resolve(path.join(ROOT_DIR, dirPath));
  let filePath = path.resolve(path.join(ROOT_DIR, data.filePath));
  (async () => {
    //create dir
    await mkdirp.promise(dirPath);
    //create file
    if (!data.isDir) {
      await fs.writeFile.promise(filePath, data.content);
    }
  })().catch(err => console.log(err));
  console.log("Client: put " + filePath);
});

/**
 * @POST - update
 * curl -v http://127.0.0.1:3000/foo.js -X POST -d "{method: POST}"
 */
tcpClient.data(["io", POST], (data) => {
  console.log(data);
  let dirPath = data.isDir ? data.filePath : path.dirname(data.filePath);
  dirPath = path.resolve(path.join(ROOT_DIR, dirPath));
  let filePath = path.resolve(path.join(ROOT_DIR, data.filePath));
  (async () => {
    //create dir
    await mkdirp.promise(dirPath);
    //create file
    if (!data.isDir) {
      await fs.truncate.promise(filePath, 0);
      await fs.writeFile.promise(filePath, data.content);
    }
  })().catch(err => console.log(err));
  console.log("Client: post " + filePath);
});

tcpClient.connect(TCP_PORT);
