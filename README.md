```
# run opencode server with cors
$ opencode-cli serve --port 4096 --cors http://localhost:5500

# attach with opencode TUI (optional)
$ opencode-cli attach http://127.0.0.1:4097

# serve this project on localhost:5500
$ python3 -m http.server 5500

# run tests
$ npm test
```