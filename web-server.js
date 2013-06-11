#!/usr/bin/env node

var util = require('util'), http = require('http'), fs = require('fs'), url = require('url'), events = require('events');

var DEFAULT_PORT = 8000;

function main(argv)
{
    new HttpServer({
        'DELETE':createServlet(StaticServlet),
        'POST':createServlet(StaticServlet),
        'GET':createServlet(StaticServlet),
        'HEAD':createServlet(StaticServlet)
    }).start(Number(argv[2]) || DEFAULT_PORT);
}

function escapeHtml(value)
{
    return value.toString().replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;');
}

function createServlet(Class)
{
    var servlet = new Class();
    return servlet.handleRequest.bind(servlet);
}

/**
 * An Http server implementation that uses a map of methods to decide
 * action routing.
 *
 * @param {Object} Map of method => Handler function
 */
function HttpServer(handlers)
{
    this.handlers = handlers;
    this.server = http.createServer(this.handleRequest_.bind(this));
}

HttpServer.prototype.start = function (port)
{
    this.port = port;
    this.server.listen(port);
    util.puts('Http Server running at http://localhost:' + port + '/');
};

HttpServer.prototype.parseUrl_ = function (urlString)
{
    var parsed = url.parse(urlString);
    parsed.pathname = url.resolve('/', parsed.pathname);
    return url.parse(url.format(parsed), true);
};

HttpServer.prototype.handleRequest_ = function (req, res)
{
    var logEntry = req.method + ' ' + req.url;
    if (req.headers['user-agent']) {
        logEntry += ' ' + req.headers['user-agent'];
    }
    util.puts(logEntry);
    req.url = this.parseUrl_(req.url);
    var handler = this.handlers[req.method];
    if (!handler) {
        res.writeHead(501);
        res.end();
    } else {
        handler.call(this, req, res);
    }
};

/**
 * Handles static content.
 */
function StaticServlet()
{
}

StaticServlet.MimeMap = {
    'txt':'text/plain',
    'html':'text/html',
    'css':'text/css',
    'xml':'application/xml',
    'json':'application/json',
    'js':'application/javascript',
    'jpg':'image/jpeg',
    'jpeg':'image/jpeg',
    'gif':'image/gif',
    'png':'image/png',
    'svg':'image/svg+xml'
};

StaticServlet.prototype.handleRequest = function (req, res)
{
    var self = this;
    var path = ('./' + req.url.pathname).replace('//', '/').replace(/%(..)/g, function (match, hex)
    {
        return String.fromCharCode(parseInt(hex, 16));
    });
    if (path.indexOf("./api/") == 0) {
        this.handleAPIRequest(req, res);
        return;
    }
    var parts = path.split('/');
    if (parts[parts.length - 1].charAt(0) === '.') {
        return self.sendForbidden_(req, res, path);
    }
    fs.stat(path, function (err, stat)
    {
        if (err) {
            return self.sendMissing_(req, res, path);
        }
        if (stat.isDirectory()) {
            return self.sendDirectory_(req, res, path);
        }
        return self.sendFile_(req, res, path);
    });
};
/**
 * Mock data
 **/
var sample_usecase_summary = "Using this tool" + "---------------\n\n" + "This page lets you create HTML by entering text in a simple format that's easy to read and write."
        + "  - Type Markdown text in the left window\n\n" + "  - See the HTML in the right\n\n"
        + "Markdown is a lightweight markup language based on the formatting conventions that people naturally use in email.  As [John Gruber] writes on the [Markdown site] [1]:\n\n"
        + "> The overriding design goal for Markdown's" + "> formatting syntax is to make it as readable " + "> as possible. The idea is that a\n\n"
        + "> Markdown-formatted document should be" + "> publishable as-is, as plain text, without" + "> looking like it's been marked up with tags\n\n"
        + "> or formatting instructions.\n\n"
        + "This document is written in Markdown; you can see the plain-text version on the left.  To get a feel for Markdown's syntax, type some text into the left window and watch the results in the right.  You can see a Markdown syntax guide by switching the right-hand window from *Preview* to *Syntax Guide*.\n\n"
        + "Showdown is a Javascript port of Markdown.  You can get the full [source code] by clicking on the version number at the bottom of the page.\n\n"
        + "**Start with a [blank page] or edit this document in the left window.**" + "  [john gruber]: http://daringfireball.net/\n\n"
        + "  [1]: http://daringfireball.net/projects/markdown/" + "  [source code]: http://www.attacklab.net/showdown-v0.9.zip\n\n" + "  [blank page]: ?blank=1 \"Clear all text\""
        + "# This is an H1" + "## This is an H2" + "###### This is an H6" + "# This is an H1 #\n\n" + "## This is an H2 ##" + "### This is an H3 ######"
        + "> This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,\n\n" + "> consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus."
        + "> Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.\n\n" + "> " + "> Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse"
        + "> id sem consectetuer libero luctus adipiscing.\n\n" + "> This is the first level of quoting." + ">" + "> > This is nested blockquote." + ">"
        + "> Back to the first level." + "> ## This is a header.\n\n" + "> " + "> 1.   This is the first list item." + "> 2.   This is the second list item." + "> "
        + "> Here's some example code:" + "> \n\n" + ">     return shell_exec(\"echo $input | $markdown_script\");" + "*   Red" + "*   Green" + "*   Blue" + "Atos" + "+   Red"
        + "+   Green" + "+   Blue\n\n" + "Portos" + "1.  Bird" + "2.  McHale" + "3.  Parish" + "Aramis" + "3. Bird" + "1. McHale" + "8. Parish" + "Multi\n\n"
        + "*   This is a list item with two paragraphs." + "    This is the second paragraph in the list item. You're\n\n"
        + "only required to indent the first line. Lorem ipsum dolor" + "sit amet, consectetuer adipiscing elit." + "*   Another item in the same list.\n\n"
        + "This is a normal paragraph:" + "    This is a code block." + "Here is an example of AppleScript:" + "    tell application \"Foo\"" + "        beep\n\n" + "    end tell"
        + "* * *" + "***" + "*****" + "- - -" + "---------------------------------------\n\n" + "This is [an example](http://example.com/ \"Title\") inline link."
        + "[This link](http://example.net/) has no title attribute.\n\n" + "See my [About](/about/) page for details.   " + "This is [an example] [id] reference-style link.\n\n"
        + "[id]: http://example.com/  \"Optional Title Here\"" + "*single asterisks*" + "_single underscores_" + "**double asterisks**\n\n" + "__double underscores__"
        + "un*frigging*believable" + "A single backtick in a code span: `` ` ``\n\n" + "A backtick-delimited string in a code span: `` `foo` ``"
        + "![Alt text](https://itcrowd.pl/images/carousel/carousel-3.jpg)\n\n" + "![Alt text](https://itcrowd.pl/images/carousel/carousel-1.jpg \"Optional title\")";
var NODE_TYPE_PACKAGE = "package";
var NODE_TYPE_USECASE = "usecase";
var rootNodes = [

];
var nodes = [
    {}
];
var nodeChildMap = [];

function addChild(parentIndex, node)
{
    var parentNode;
    var parentId;
    if (null != parentIndex) {
        parentNode = nodes[parentIndex];
        parentId = parentNode.id;
    }
    node.parentId = parentId;
    nodes.push(node);
    if (null != parentIndex) {
        var children = nodeChildMap[parentId];
        if (undefined == children) {
            nodeChildMap[parentId] = children = [];
        }
        children.push(node);
        parentNode.hasChildren = true;
    } else {
        rootNodes.push(node)
    }
}

function removeNodeAndChildren(node)
{
    if (NODE_TYPE_PACKAGE == node.type && undefined == node.parentId) {
        var index = rootNodes.indexOf(node);
        rootNodes.splice(index, 1);
    }
    delete nodes[node.id];
    var children = nodeChildMap[node.id];
    if (undefined != children) {
        for (var i = 0; i < children.length; i++) {
            removeNodeAndChildren(children[i]);
        }
    }
}

function removeNode(node)
{
    removeNodeAndChildren(node);
    var siblings = nodeChildMap[node.parentId];
    if (undefined != siblings) {
        var index = siblings.indexOf(node);
        siblings.splice(index, 1);
        if (0 == siblings.length) {
            delete nodeChildMap[node.parentId];
            var parentNode = nodes[node.parentId];
            if (undefined != parentNode) {
                parentNode.hasChildren = false;
            }
        }
    }
}

addChild(null, {id:1, name:"Requester", hasChildren:true});
addChild(null, {id:2, name:"Supplier", hasChildren:false});
addChild(null, {id:3, name:"Admin", hasChildren:false});

var node;
for (var i = 4; i < 100; i++) {
    node = {id:i, name:"Node " + i, hasChildren:false};
    var parentIndex = Math.max(2, Math.floor(Math.random() * (nodes.length - 2)));
    /**We don't add children to Requester*/
    addChild(parentIndex, node);
}
addChild(1, {id:i, name:"Questionnaire"});
addChild(1, {id:i + 1, name:"Company"});
addChild(1, {id:i + 2, name:"Rating"});
for (i = 0; i < nodes.length; i++) {
    node = nodes[i];
    var children = nodeChildMap[node.id];
    if (undefined != children && children.length > 0) {
        node.type = NODE_TYPE_PACKAGE;
    } else {
        node.type = NODE_TYPE_USECASE;
        var start = parseInt(Math.random() * sample_usecase_summary.length);
        var end = parseInt(Math.min(sample_usecase_summary.length - 1, Math.max(start + 500, Math.random() * sample_usecase_summary.length)));
        node.summary = sample_usecase_summary.substring(start, end);
    }
}
/**
 * End of mock data
 */
StaticServlet.prototype.handleAPIRequest = function (req, res)
{
    function oK(content)
    {
        res.writeHead(200, {
            'Content-Type':'application/json'
        });
        res.write(content);
        res.end();
    }

    function send404()
    {
        res.writeHead(404, {
            'Content-Type':'text/html'
        });
        res.write('<!doctype html>\n');
        res.write('<title>404 API Not Found</title>\n');
        res.write('<h1>API Not Found</h1>');
        res.write('<p>The requested URL ' + escapeHtml(path) + ' was not found on this server.</p>');
        util.puts('404 API Not Found: ' + path);
        res.end();
    }

    function send400(message)
    {
        res.writeHead(400, {
            'Content-Type':'text/html'
        });
        res.write('<!doctype html>\n');
        res.write('<title>400 Bad API request</title>\n');
        res.write('<h1>Bad API request</h1>');
        res.write('<p>' + message + '</p>');
        util.puts('400 Bad API request: ' + path + '\n' + message);
        res.end();
    }

    function handlePost(onDataReady)
    {
        var body = '';
        req.on('data', function (data)
        {
            body += data;
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6) {
                // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
                req.connection.destroy();
            }
        });
        req.on('end', function ()
        {
            onDataReady(body);
        });
    }

    var path = ('./' + req.url.pathname).replace('//', '/').replace(/%(..)/g, function (match, hex)
    {
        return String.fromCharCode(parseInt(hex, 16));
    });

    var apiPath = path.substring("./api/".length);
    var CREATE_PACKAGE = /^package$/;
    var GET_PACKAGE = /^package\/(\d+)$/;
    var LIST_ROOT_PACKAGES = /^package\/?$/;
    var LIST_PACKAGE_CONTENTS = /^package\/(\d+)\/contents$/;
    var CREATE_USECASE = /^usecase$/;
    var GET_USECASE = /^usecase\/(\d+)$/;
    var id;
    var node;
    if ("GET" == req.method && apiPath.match(LIST_ROOT_PACKAGES)) {
        oK(JSON.stringify(rootNodes));
    } else if (apiPath.match(LIST_PACKAGE_CONTENTS)) {
        id = parseInt(LIST_PACKAGE_CONTENTS.exec(apiPath)[1]);
        if (undefined == nodes[id]) {
            send404();
        } else {
            var children = nodeChildMap[id];
            if (undefined == children) {
                children = [];
            }
            oK(JSON.stringify(children));
        }
    } else if (apiPath.match(GET_PACKAGE)) {
        id = parseInt(GET_PACKAGE.exec(apiPath)[1]);
        node = nodes[id];
        if (undefined == node) {
            send404();
        } else {
            if ("GET" == req.method) {
                oK(JSON.stringify(node));
            } else if ("DELETE" == req.method) {
                removeNode(node);
                oK("Node #" + id + " removed successfully");
            } else if ("PUT" == req.method) {
//            TODO not implemented yet
                send404();
            } else {
                send400("Method not allowed for path " + path);
            }
        }
    } else if ("POST" == req.method && apiPath.match(CREATE_PACKAGE)) {
        handlePost(function (body)
        {
            try {
                var post = JSON.parse(body);
                post.id = nodes.length;
                addChild(post.parentId, post);
                oK(JSON.stringify(post));
            } catch (e) {
                send400(e);
            }
        });
    } else if (apiPath.match(GET_USECASE)) {
        id = parseInt(GET_USECASE.exec(apiPath)[1]);
        node = nodes[id];
        if (undefined == node) {
            send404();
        } else {
            if ("GET" == req.method) {
                oK(JSON.stringify(node));
            } else if ("DELETE" == req.method) {
                removeNode(node);
                oK("Node #" + id + " removed successfully");
            } else if ("POST" == req.method) {
                handlePost(function (body)
                {
                    try {
                        nodes[id] = JSON.parse(body);
                        oK(JSON.stringify(nodes[id]));
                    } catch (e) {
                        send400(e);
                    }
                });
            } else {
                send400("Method not allowed for path " + path);
            }
        }
    } else if ("POST" == req.method && apiPath.match(CREATE_USECASE)) {
        handlePost(function (body)
        {
            try {
                var post = JSON.parse(body);
                post.id = nodes.length;
                addChild(post.parentId, post);
                oK(JSON.stringify(post));
            } catch (e) {
                send400(e);
            }
        });
    } else {
        send404();
    }

};
StaticServlet.prototype.sendError_ = function (req, res, error)
{
    res.writeHead(500, {
        'Content-Type':'text/html'
    });
    res.write('<!doctype html>\n');
    res.write('<title>Internal Server Error</title>\n');
    res.write('<h1>Internal Server Error</h1>');
    res.write('<pre>' + escapeHtml(util.inspect(error)) + '</pre>');
    util.puts('500 Internal Server Error');
    util.puts(util.inspect(error));
};

StaticServlet.prototype.sendMissing_ = function (req, res, path)
{
    path = path.substring(1);
    res.writeHead(404, {
        'Content-Type':'text/html'
    });
    res.write('<!doctype html>\n');
    res.write('<title>404 Not Found</title>\n');
    res.write('<h1>Not Found</h1>');
    res.write('<p>The requested URL ' + escapeHtml(path) + ' was not found on this server.</p>');
    res.end();
    util.puts('404 Not Found: ' + path);
};

StaticServlet.prototype.sendForbidden_ = function (req, res, path)
{
    path = path.substring(1);
    res.writeHead(403, {
        'Content-Type':'text/html'
    });
    res.write('<!doctype html>\n');
    res.write('<title>403 Forbidden</title>\n');
    res.write('<h1>Forbidden</h1>');
    res.write('<p>You do not have permission to access ' + escapeHtml(path) + ' on this server.</p>');
    res.end();
    util.puts('403 Forbidden: ' + path);
};

StaticServlet.prototype.sendRedirect_ = function (req, res, redirectUrl)
{
    res.writeHead(301, {
        'Content-Type':'text/html',
        'Location':redirectUrl
    });
    res.write('<!doctype html>\n');
    res.write('<title>301 Moved Permanently</title>\n');
    res.write('<h1>Moved Permanently</h1>');
    res.write('<p>The document has moved <a href="' + redirectUrl + '">here</a>.</p>');
    res.end();
    util.puts('301 Moved Permanently: ' + redirectUrl);
};

StaticServlet.prototype.sendFile_ = function (req, res, path)
{
    var self = this;
    var file = fs.createReadStream(path);
    res.writeHead(200, {
        'Content-Type':StaticServlet.MimeMap[path.split('.').pop()] || 'text/plain'
    });
    if (req.method === 'HEAD') {
        res.end();
    } else {
        file.on('data', res.write.bind(res));
        file.on('close', function ()
        {
            res.end();
        });
        file.on('error', function (error)
        {
            self.sendError_(req, res, error);
        });
    }
};

StaticServlet.prototype.sendDirectory_ = function (req, res, path)
{
    var self = this;
    if (path.match(/[^\/]$/)) {
        req.url.pathname += '/';
        var redirectUrl = url.format(url.parse(url.format(req.url)));
        return self.sendRedirect_(req, res, redirectUrl);
    }
    fs.readdir(path, function (err, files)
    {
        if (err) {
            return self.sendError_(req, res, error);
        }

        if (!files.length) {
            return self.writeDirectoryIndex_(req, res, path, []);
        }

        var remaining = files.length;
        files.forEach(function (fileName, index)
        {
            fs.stat(path + '/' + fileName, function (err, stat)
            {
                if (err) {
                    return self.sendError_(req, res, err);
                }
                if (stat.isDirectory()) {
                    files[index] = fileName + '/';
                }
                if (!(--remaining)) {
                    return self.writeDirectoryIndex_(req, res, path, files);
                }
            });
        });
    });
};

StaticServlet.prototype.writeDirectoryIndex_ = function (req, res, path, files)
{
    path = path.substring(1);
    res.writeHead(200, {
        'Content-Type':'text/html'
    });
    if (req.method === 'HEAD') {
        res.end();
        return;
    }
    res.write('<!doctype html>\n');
    res.write('<title>' + escapeHtml(path) + '</title>\n');
    res.write('<style>\n');
    res.write('  ol { list-style-type: none; font-size: 1.2em; }\n');
    res.write('</style>\n');
    res.write('<h1>Directory: ' + escapeHtml(path) + '</h1>');
    res.write('<ol>');
    files.forEach(function (fileName)
    {
        if (fileName.charAt(0) !== '.') {
            res.write('<li><a href="' + escapeHtml(fileName) + '">' + escapeHtml(fileName) + '</a></li>');
        }
    });
    res.write('</ol>');
    res.end();
};

// Must be last,
main(process.argv);
