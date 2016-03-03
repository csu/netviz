(function() {
  var packetColors = {
    "Create": "blue",
    "Created": "green",
    "Open": "blue",
    "Opened": "green",

    "Relay Begin": "blue",
    "Relay Data": "purple",
    "Relay End": "orange",
    "Relay Connected": "green",
    "Relay Extend": "blue",
    "Relay Extended": "green",
    "Relay Begin Failed": "red",
    "Relay Extend Failed": "red",
  }

  var defaultColor = "black";

  var animationDuration = 1500;

  // Returns an attrTween for translating along the specified path element.
  function translateAlong(path) {
    var l = path.getTotalLength();
    return function(d, i, a) {
      return function(t) {
        var p = path.getPointAtLength(t * l);
        return "translate(" + p.x + "," + p.y + ")";
      };
    };
  }

  function Graph() {
    var existingNodes = {};
    var existingEdges = {};

    var animationQueue = [];
    var animationTimer = null;

    this.addNode = function(id) {
      if (id in existingNodes) {
        return;
      }
      existingNodes[id] = true;
      existingEdges[id] = [];
      nodes.push({"id": id});
      updateGraph();
    };

    this.removeNode = function(id) {
      if (!(id in existingNodes)) {
        return;
      }

      var i = 0;
      var n = findNode(id);
      while (i < edges.length) {
        if ((edges[i]['source'] == n) || (edges[i]['target'] == n)) {
          edges.splice(i, 1);
        }
        else i++;
      }

      nodes.splice(findNodeIndex(id), 1);
      delete existingNodes[id];
      delete existingEdges[id];
      updateGraph();
    };

    this.removeEdge = function(source, target) {
      if (!(source in existingNodes)) {
        var idx = existingEdges[source].indexOf(target);
        if (idx > -1) {
          existingEdges[source].splice(idx, 1);
          idx = existingEdges[target].indexOf(source);
          existingEdges[target].splice(idx, 1);

          for (var i = 0; i < edges.length; i++) {
            if (edges[i].source.id == source && edges[i].target.id == target) {
              edges.splice(i, 1);
              updateGraph();
              break;
            }
          }
        }
      }
    };

    this.addEdge = function(source, target, value) {
      console.log("adding: " + source + ", " + target);
      console.log(existingNodes);
      console.log(existingEdges);
      if (!(source in existingNodes) || !(target in existingNodes)) {
        return;
      }

      // check if edge already exists
      var idx = existingEdges[source].indexOf(target);
      if (idx > -1) {
        return;
      }

      existingEdges[source].push(target);
      existingEdges[target].push(source);

      edges.push({
        "source": findNode(source),
        "target": findNode(target),
        "value": value});

      // console.log("edge added: " + source + ", " + target);

      updateGraph();
    };

    var processAnimation = function() {
      var next = animationQueue.shift();
      animatePacket(next.source, next.target, next.color);
      if (animationQueue.length === 0) {
        clearInterval(animationTimer);
        animationTimer = null;
      }
    }

    // throttle animations using a queue
    this.addPacket = function(source, target, color) {
      animationQueue.push({
        source: source,
        target: target,
        color: color,
      });
      if (animationTimer === null) {
        animationTimer = setInterval(processAnimation, 200);
      }
    }

    var animatePacket = function(source, target, color) {
      // handle self loop
      if (source === target) {
        var n1 = findNode(source);

        var points = [
          // [n1.x, n1.y],
          [n1.x+50, n1.y],
          [n1.x+50, n1.y+50],
          [n1.x, n1.y+50],
          // [n1.x, n1.y],
        ];

        var path = svg.append("path")
            .data([points])
            .attr("d", d3.svg.line()
            .tension(0) // Catmull–Rom
            .interpolate("cardinal-closed"));

        var packet = svg.append("rect")
            .attr("x", n1.x)
            .attr("y", n1.y)
            .attr("width", 7)
            .attr("height", 7)
            .style("fill", color);
        packet.transition()
            .attrTween("transform", translateAlong(path.node()))
            .ease("quad")
            .duration(animationDuration)
            .each("end", function() {
              d3.select(this).remove();
              path.remove();
            });

        return;
      }

      var n1 = findNode(source);
      var n2 = findNode(target);

      var packet = svg.append("rect")
          .attr("x", n1.x)
          .attr("y", n1.y)
          .attr("width", 7)
          .attr("height", 7)
          .style("fill", color);
      packet.transition()
          .attr("x", n2.x)
          .attr("y", n2.y)
          .ease("quad")
          .duration(animationDuration)
          .each("end", function() {
            d3.select(this).remove();
          });
    }

    var findNode = function(id) {
      for (var i in nodes) {
        if (nodes[i]["id"] === id) return nodes[i];
      }
    };

    var findNodeIndex = function(id) {
      for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].id == id) {
          return i;
        }
      }
    };

    var w = 1200,
        h = 600;

    var color = d3.scale.category10();

    var svg = d3.select("body")
        .append("svg:svg")
        .attr("width", w)
        .attr("height", h)
        .attr("id", "svg")
        .attr("pointer-events", "all")
        .attr("viewBox", "0 0 " + w + " " + h)
        .attr("perserveAspectRatio", "xMinYMid")
        .append('svg:g');

    var force = d3.layout.force();

    var nodes = force.nodes(),
        edges = force.links();

    var updateGraph = function() {
      var edge = svg.selectAll("line")
          .data(edges, function(d) {
            return d.source.id + "-" + d.target.id;
          });

      edge.enter().append("line")
          .attr("id", function(d) {
            return d.source.id + "-" + d.target.id;
          })
          .attr("stroke-width", function(d) {
            return d.value / 10;
          })
          .attr("class", "edge");
      
      edge.append("title")
          .text(function(d) {
            return d.value;
          });
      
      edge.exit().remove();

      var node = svg.selectAll("g.node")
                    .data(nodes, function(d) {
                      return d.id;
                    });

      var nodeEnter = node.enter().append("g")
                                  .attr("class", "node");

      nodeEnter.append("svg:circle")
          .attr("r", 12)
          .attr("id", function(d) {
            return "Node;" + d.id;
          })
          .attr("class", "node");

      nodeEnter.append("svg:text")
          .attr("class", "node-label")
          .attr("x", 15)
          .attr("y", ".40em")
          .text(function(d) {
            return d.id;
          });

      node.exit().remove();

      force.on("tick", function() {
        node.attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        });

        edge.attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
      });

      force
        .gravity(.01)
        .charge(-80000)
        .friction(0)
        .linkDistance(function(d) { return d.value * 10 })
        .size([w, h])
        .start();
    };

    updateGraph();
  }

  function redrawNodes() {
    $(".node").each(function( index ) {
      var gnode = this.parentNode;
      gnode.parentNode.appendChild(gnode);
    });
  }

  function drawNetwork() {
    var socket = io("http://log.461.dev.christopher.su");
    var graph = new Graph("#network");

    socket.on('event', function(entry) {
      // console.log(entry);

      // draw the node, if it doesn't exist already
      var source = "" + entry.router;
      graph.addNode(source);

      // if it's a packet being sent
      if (entry.data.event === 'sending') {
        // add the destination node if it doesn't exist
        var dest = "" + entry.data.to;
        graph.addNode(dest);

        graph.addEdge(source, dest, 20);
        redrawNodes();

        // draw the packet for the cell type
        var color = entry.data.cell_type in packetColors ? packetColors[entry.data.cell_type] : defaultColor;
        // console.log("sending: " + source + ", " + dest + ", " + color);
        graph.addPacket(source, dest, color);
        redrawNodes();
      }
    });
  }

  drawNetwork();
})();