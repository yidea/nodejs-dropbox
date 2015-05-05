## Nodejs Dropbox Project

This is a basic Dropbox clone to sync files across multiple remote folders.

Time spent: 16 hours

### Features

#### Required

- [x] Client can make GET requests to get file or directory contents
- [x] Client can make HEAD request to get just the GET headers 
- [x] Client can make PUT requests to create new directories and files with content
- [x] Client can make POST requests to update the contents of a file
- [x] Client can make DELETE requests to delete files and folders
- [x] Server will serve from `--dir` or cwd as root
- [x] Client will sync from server over TCP to cwd or CLI `dir` argument

### Optional

- [ ] Client and User will be redirected from HTTP to HTTPS
- [ ] Server will sync from client over TCP
- [ ] Client will preserve a 'Conflict' file when pushed changes preceeding local edits
- [ ] Client can stream and scrub video files (e.g., on iOS)
- [ ] Client can download a directory as an archive
- [ ] Client can create a directory with an archive
- [ ] User can connect to the server using an FTP client


### Walkthrough

- Client can make GET requests to get file or directory contents
  
  ```
  curl -v http://127.0.0.1:3000 -X GET
  curl -v http://127.0.0.1:3000/index.js -X GET
  ```
  
  ![gif](https://github.com/yidea/nodejs-dropbox/blob/master/gif/get.gif)
  
- Client can make HEAD request to get just the GET headers
 
  `curl -v http://127.0.0.1:3000 --head`
  
  ![gif](https://github.com/yidea/nodejs-dropbox/blob/master/gif/head.gif)
  
- Client can make PUT requests to create new directories and files with content

  ```
  curl -v http://127.0.0.1:3000/foo/bar.js -X PUT -d "hello world"
  ```
  
  ![gif](https://github.com/yidea/nodejs-dropbox/blob/master/gif/put.gif)
  
- Client can make POST requests to update the contents of a file

  ```
  curl -v http://127.0.0.1:3000/foo -X POST
  curl -v http://127.0.0.1:3000/foo/bar.js -X POST -d "hello world from POST"
  ```
  
  ![gif](https://github.com/yidea/nodejs-dropbox/blob/master/gif/post.gif)
    
- Client can make DELETE requests to delete files and folders

  ```
  touch foo.js
  curl -v http://127.0.0.1:3000/foo.js -X DELETE
  ```
  
  ![gif](https://github.com/yidea/nodejs-dropbox/blob/master/gif/delete.gif)
  
- Server will serve from `--dir` or cwd as root

  `bode --stage 1 index.js --dir=/Users/ycao2/walmart/github/codepath-nodejs/nodejs-dropbox/test`
  ![gif](https://github.com/yidea/nodejs-dropbox/blob/master/gif/dir.gif)
  
- Client will sync from server over TCP to cwd or CLI `dir` argument

  ```
  //create
  curl -v http://127.0.0.1:3000/foo/bar.js -X PUT -d "PUT"
  cat test/foo/bar.js
  //update
  curl -v http://127.0.0.1:3000/foo/bar.js -X POST -d "POST"
  cat test/foo/bar.js
  //delete
  curl -v http://127.0.0.1:3000/foo/bar.js -X DELETE
  cat test/foo/bar.js
  curl -v http://127.0.0.1:3000/foo -X DELETE
  ```

  ![gif](https://github.com/yidea/nodejs-dropbox/blob/master/gif/tcp.gif)  
