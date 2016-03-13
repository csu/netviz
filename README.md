# netviz
A tool of visualizing real-time network/graph data.

Kind of based on/inspired by a few of the D3 force-directed graph examples/demos.

## Usage
Open `index.html`. Make sure the netviz css and js files are included properly by the browser.

Alternatively, serve the file with an HTTP server. Python's built-in web server works well: `python -m SimpleHTTPServer`.

## Dependencies
(Included by `index.html`)

* d3
* jQuery

## Examples
The Tor61 network visualization uses Netviz to visualize data from logs streamed over Socket.IO.