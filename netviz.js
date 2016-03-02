var graph;
function Graph() {
  this.addNode = function(id) {
    nodes.push({"id": id});
    update();
  };

  this.removeNode = function(id) {
    var i = 0;
    var n = findEdge(id);
    while (i < edges.length) {
      if ((edges[i]['source'] == n) || (edges[i]['target'] == n)) {
        edges.splice(i, 1);
      }
      else i++;
    }
    nodes.splice(findEdgeIndex(id), 1);
    update();
  };

  this.removeEdge = function(source, target) {
    for (var i = 0; i < edges.length; i++) {
      if (edges[i].source.id == source && edges[i].target.id == target) {
        edges.splice(i, 1);
        break;
      }
    }
    update();
  };

  this.addEdge = function(source, target, value) {
    edges.push({
      "source": findEdge(source),
      "target": findEdge(target),
      "value": value});
    update();
  };

  this.addPacket = function(source, target, color) {
    var n1 = findEdge(source);
    var n2 = findEdge(target);
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
        .duration(1000)
        .each("end", function() {
          d3.select(this).remove();
        });
  }

  var findEdge = function(id) {
    for (var i in nodes) {
      if (nodes[i]["id"] === id) return nodes[i];
    }
  };

  var findEdgeIndex = function(id) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id == id) {
        return i;
      }
    }
  };

  var w = 1200,
      h = 800;

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

  var update = function() {
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

      edge.attr("x1", function(d) {
            return d.source.x;
          })
          .attr("y1", function(d) {
            return d.source.y;
          })
          .attr("x2", function(d) {
            return d.target.x;
          })
          .attr("y2", function(d) {
            return d.target.y;
          });
    });

    force
      .gravity(.01)
      .charge(-80000)
      .friction(0)
      .linkDistance(function(d) { return d.value * 10 })
      .size([w, h])
      .start();
  };

  update();
}

function drawGraph() {
  graph = new Graph("#network");

  graph.addNode('Router 1');
  graph.addNode('Router 2');
  graph.addNode('Router 3');
  graph.addNode('Router 4');
  graph.addNode('Router 5');
  graph.addNode('Router 6');
  graph.addNode('Router 7');
  graph.addNode('Router 8');
  graph.addNode('Router 9');
  graph.addNode('Router 10');
  graph.addNode('Router 11');
  graph.addEdge('Router 1', 'Router 11', '15');
  graph.addEdge('Router 2', 'Router 1', '15');
  graph.addEdge('Router 3', 'Router 2', '15');
  graph.addEdge('Router 4', 'Router 3', '15');
  graph.addEdge('Router 5', 'Router 4', '15');
  graph.addEdge('Router 6', 'Router 5', '15');
  graph.addEdge('Router 7', 'Router 6', '15');
  graph.addEdge('Router 8', 'Router 7', '15');
  graph.addEdge('Router 9', 'Router 8', '15');
  graph.addEdge('Router 10', 'Router 9', '15');
  graph.addEdge('Router 11', 'Router 10', '15');
  reorderNodes();

  // simulate adding edges
  function createTimeout(i) {
    setTimeout(function() {
      graph.addEdge("Router " + i, "Router " + (((i + 3) % 11) + 1), '' + (7+(i*5)));
      reorderNodes();
    }, 500 + (250*i));
  }

  // simulate random packets
  function createPackets(i) {
    setInterval(function() {
      graph.addPacket("Router " + i, "Router " + (((i + 3) % 11) + 1), "blue");
      graph.addPacket("Router " + (((i * 2) % 11) + 1), "Router " + (((i + 3) % 11) + 1), "green");
    }, 4000 + (500*i));

    setInterval(function() {
      graph.addPacket("Router " + (((i * 2) % 11) + 1), "Router " + (((i + 3) % 11) + 1), "green");
    }, 4000 + (253*i));

    setInterval(function() {
      graph.addPacket("Router " + i, "Router " + (((i + 6) % 8) + 1), "red");
    }, 4000 + (432*i));
  }

  for (i = 1; i < 11; i++) {
    createTimeout(i);
    createPackets(i);
  }
}

drawGraph();

function reorderNodes() {
  $(".node").each(function( index ) {
    var gnode = this.parentNode;
    gnode.parentNode.appendChild(gnode);
  });
}

function redraw() {
  d3.select("svg").remove();
  drawGraph();
}