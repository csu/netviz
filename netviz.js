/*
  netviz
  Christopher Su
*/

// TODO: Abstract out animation of shapes and text from Graph (keep queue though)

/* Tor61-specific */
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

var convertRouterId = function(agentId) {
  var groupId = agentId >>> 16;
  var routerId = agentId & ((~0) >>> 16);
  return [groupId, routerId];
};

var displayReceived = true;

var animationDuration = 1500;
var errorDurationMultiplier = 1;
var receivedDurationMultiplier = 0.6;
var animationThrottleDelay = 500;

document.getElementById('animDuration').value = animationDuration;
document.getElementById('animThrottleDelay').value = animationThrottleDelay;
document.getElementById('showReceived').checked = displayReceived;

function setAnimDuration() {
  var input = document.getElementById('animDuration').value;
  animationDuration = parseInt(input);
}

function setAnimThrottleDelay() {
  var input = document.getElementById('animThrottleDelay').value;
  animationDuration = parseInt(input);
}

function setShowReceived() {
  displayReceived = document.getElementById('showReceived').checked;
}

(function() {

  var defaultColor = "black";

  var w = 1200,
      h = 600;

  function Graph() {
    var existingNodes = {};
    var existingEdges = {};

    var animationQueue = [];
    var animationTimer = null;

    this.addNode = function(id, label) {
      if (id in existingNodes) {
        return;
      }
      existingNodes[id] = true;
      existingEdges[id] = [];
      nodes.push({"id": id, "label": label});
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
      // console.log(existingNodes);
      // console.log(existingEdges);

      if (!(source in existingNodes) || !(target in existingNodes)) {
        return;
      }

      // check if edge already exists
      var idx = existingEdges[source].indexOf(target);
      if (idx > -1) {
        return;
      }

      // console.log("adding: " + source + ", " + target);

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
      switch (next.type) {
        case 'packet':
          animatePacket(next);
          break;
        case 'received':
          displayReceived(next);
          break;
        case 'error':
          displayError(next);
          break;
      }
      if (animationQueue.length === 0) {
        clearInterval(animationTimer);
        animationTimer = null;
      }
      else if (animationQueue.length > 50) {
        // empty the queue quickly
        clearInterval(animationTimer);
        animationTimer = setInterval(processAnimation, 100);
      }
    }

    // throttle animations using a queue
    this.addPacket = function(source, target, label, color) {
      animationQueue.push({
        source: source,
        target: target,
        label: label,
        color: color,
        type: 'packet',
      });
      if (animationTimer === null) {
        animationTimer = setInterval(processAnimation, animationThrottleDelay);
      }
    }

    this.addEvent = function(type, source, label, color) {
      animationQueue.push({
        source: source,
        label: label,
        color: color,
        type: type,
      });
      if (animationTimer === null) {
        animationTimer = setInterval(processAnimation, animationThrottleDelay);
      }
    }

    var displayReceived = function(err) {
      var n1 = findNode(err.source);

      var elems = [];
      elems.push(svg.append("text")
          .attr("x", n1.x + 20)
          .attr("y", n1.y + 7)
          .text(err.label));
      elems.push(
        svg.append("circle")
          .attr("cx", n1.x)
          .attr("cy", n1.y)
          .attr("r", 5)
          .style("fill", err.color));
        
      elems[0].transition()
            .attrTween("x", function(d, i, a) {
              return function(t) {
                return n1.x + (50 * t) + 20;
              }
            })
            .style("opacity",0)
            .ease("quad")
            .duration(animationDuration * receivedDurationMultiplier)
            .each("end", function() {
              d3.select(this).remove();
            });
      elems[1].transition()
            .attrTween("cx", function(d, i, a) {
              return function(t) {
                return n1.x + (50 * t);
              }
            })
            .style("opacity",0)
            .ease("quad")
            .duration(animationDuration * receivedDurationMultiplier)
            .each("end", function() {
              d3.select(this).remove();
            });
    }

    var displayError = function(err) {
      var n1 = findNode(err.source);

      var elems = [];
      elems.push(svg.append("text")
          .attr("x", n1.x + 20)
          .attr("y", n1.y + 10)
          .text(err.label));
      elems.push(
        svg.append("rect")
          .attr("x", n1.x)
          .attr("y", n1.y)
          .attr("width", 10)
          .attr("height", 10)
          .style("fill", err.color));
        
      elems[0].transition()
            .attrTween("y", function(d, i, a) {
              return function(t) {
                return n1.y - (50 * t) + 10;
              }
            })
            .style("opacity",0)
            .ease("quad")
            .duration(animationDuration * errorDurationMultiplier)
            .each("end", function() {
              d3.select(this).remove();
            });
      elems[1].transition()
            .attrTween("y", function(d, i, a) {
              return function(t) {
                return n1.y - (50 * t);
              }
            })
            .style("opacity",0)
            .ease("quad")
            .duration(animationDuration * errorDurationMultiplier)
            .each("end", function() {
              d3.select(this).remove();
            });
    }

    var animatePacket = function(packet) {
      var n1 = findNode(packet.source);
      var elems = [];
      elems.push(svg.append("text")
          .attr("x", n1.x + 30)
          .attr("y", n1.y + 15)
          .text(packet.label));

      // handle self loop
      if (packet.source === packet.target) {
        elems.push(
          svg.append("rect")
            .attr("x", n1.x)
            .attr("y", n1.y)
            .attr("width", 7)
            .attr("height", 7)
            .style("fill", packet.color));
        
        elems[0].transition() // label
            .attrTween("x", function(d, i, a) {
              return function(t) {
                return n1.x + (50 * Math.cos(2*Math.PI * t)) - 50 + 10;
              }
            })
            .attrTween("y", function(d, i, a) {
              return function(t) {
                return n1.y + (50 * Math.sin(2*Math.PI * t)) + 10;
              }
            })
            .ease("quad")
            .duration(animationDuration)
            .each("end", function() {
              d3.select(this).remove();
            });
        elems[1].transition() // rect
            .attrTween("x", function(d, i, a) {
              return function(t) {
                return n1.x + (50 * Math.cos(2*Math.PI * t)) - 50;
              }
            })
            .attrTween("y", function(d, i, a) {
              return function(t) {
                return n1.y + (50 * Math.sin(2*Math.PI * t));
              }
            })
            .ease("quad")
            .duration(animationDuration)
            .each("end", function() {
              d3.select(this).remove();
            });

        return;
      }

      var n2 = findNode(packet.target);

      elems.push(svg.append("rect")
          .attr("x", n1.x)
          .attr("y", n1.y)
          .attr("width", 7)
          .attr("height", 7)
          .style("fill", packet.color));

      elems[0].transition() // label
        .attr("x", n2.x + 10)
        .attr("y", n2.y + 10)
        .ease("quad")
        .duration(animationDuration)
        .each("end", function() {
          d3.select(this).remove();
      });
      elems[1].transition() // rect
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
          .text(function(d) { return d.value; });
      
      edge.exit().remove();

      var node = svg.selectAll("g.node")
                    .data(nodes, function(d) { return d.id; });

      var nodeEnter = node.enter().append("g")
                                  .attr("class", "node");

      nodeEnter.append("svg:circle")
          .attr("r", 12)
          .attr("id", function(d) { return "Node;" + d.id; })
          .attr("class", "node");

      nodeEnter.append("svg:text")
          .attr("class", "node-label")
          .attr("x", 15)
          .attr("y", ".40em")
          .text(function(d) { return d.label; });

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
      // draw the node, if it doesn't exist already
      var source = entry.router;
      var sourceLabel = convertRouterId(source);
      graph.addNode(entry.router, sourceLabel[0] + "-" + sourceLabel[1]);

      // if it's a packet being sent
      if (entry.data.event === 'sending') {
        // add the destination node if it doesn't exist
        var dest = entry.data.to;
        var destLabel = convertRouterId(dest);
        graph.addNode(entry.data.to, destLabel[0] + "-" + destLabel[1]);

        graph.addEdge(source, dest, 20);
        redrawNodes();

        // draw the packet for the cell type
        var color = entry.data.cell_type in packetColors
                    ? packetColors[entry.data.cell_type] : defaultColor;
        graph.addPacket(source, dest, entry.data.cell_type, color);
      }
      else if (displayReceived && entry.data.event === 'received') {
        graph.addEvent('received', source, entry.data.cell_type, '#808000');
      }
      else if (entry.data.event == 'shutdown') {
        graph.removeNode(source);
        redrawNodes();
      }
    });

    socket.on('error', function(entry) {
      // draw the node, if it doesn't exist already
      var source = entry.router;
      var sourceLabel = convertRouterId(source);
      graph.addNode(entry.router, sourceLabel[0] + "-" + sourceLabel[1]);

      if ('error' in entry.data) {
        graph.addEvent('error', source, entry.data.error, "red");
      }
    });
  }

  drawNetwork();
})();