Learning AngularJS
===

To run tests from IntelliJ Idea you need to first install "node.js", then from npm console install karma
(previously known as testacular) (npm install -g karma).

Unit tests (you only need to start Karma):
---
- In Idea add Run/Debug configuration (for Karma) NodeJS.
    - Working directory: project path
    - Path to node app js file : path to karma binary i.e C:\Users\Renia\AppData\Roaming\npm\node_modules\karma\bin\karma
    - You might need specify CHROME_BIN environment var i.e. C:/Program Files (x86)/Google/Chrome/Application/chrome.exe (note the slashes instead of backslashes)
    - Application parameters: start
- Now you can run Karma

e2e tests (you need to start web-server.js and Karma):
---
- Add web-server.js Run/Debug configuration (NodeJS):
    - Path to node app js file: web-server.js
- Run web-server.js
- Add Karma e2e Run/Debug configuration:
     - Working directory: project path
     - Path to node app js file : path to karma binary i.e C:\Users\Renia\AppData\Roaming\npm\node_modules\karma\bin\karma
     - You might need specify CHROME_BIN environment var i.e. C:/Program Files (x86)/Google/Chrome/Application/chrome.exe (note the slashes instead of backslashes)
     - Application parameters: start karma-e2e.conf.js
- Now you can run Karma