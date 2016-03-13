/*
  netviz
  Christopher Su
*/

// Constants and configuration
var defaultColor = "black";

var w = 1200,
    h = 600;

var animationThrottleDelay = 500;

// Netviz class
function Netviz() {
  var self = this;

  this.existingNodes = {};
  this.existingEdges = {};

  this.animationQueue = [];
  this.animationTimer = null;

  this.svg = d3.select("body")
      .append("svg:svg")
      .attr("width", w)
      .attr("height", h)
      .attr("id", "svg")
      .attr("pointer-events", "all")
      .attr("viewBox", "0 0 " + w + " " + h)
      .attr("perserveAspectRatio", "xMinYMid")
      .append('svg:g');

  this.force = d3.layout.force();
  this.nodes = this.force.nodes()
  this.edges = this.force.links();

  this.addNode = function(id, label) {
    if (id in this.existingNodes) {
      return;
    }
    this.existingNodes[id] = true;
    this.existingEdges[id] = [];
    this.nodes.push({"id": id, "label": label});
    this.updateGraph();
  };

  this.removeNode = function(id) {
    if (!(id in this.existingNodes)) {
      return;
    }

    var i = 0;
    var n = this.findNode(id);
    while (i < this.edges.length) {
      if ((this.edges[i]['source'] == n) || (this.edges[i]['target'] == n)) {
        this.edges.splice(i, 1);
      }
      else i++;
    }

    this.nodes.splice(this.findNodeIndex(id), 1);
    delete this.existingNodes[id];
    delete this.existingEdges[id];
    this.updateGraph();
  };

  this.removeEdge = function(source, target) {
    if (!(source in this.existingNodes)) {
      var idx = this.existingEdges[source].indexOf(target);
      if (idx > -1) {
        this.existingEdges[source].splice(idx, 1);
        idx = this.existingEdges[target].indexOf(source);
        this.existingEdges[target].splice(idx, 1);

        for (var i = 0; i < this.edges.length; i++) {
          if (this.edges[i].source.id == source && this.edges[i].target.id == target) {
            this.edges.splice(i, 1);
            this.updateGraph();
            redrawNodes();
            break;
          }
        }
      }
    }
  };

  this.addEdge = function(source, target, value) {
    if (!(source in this.existingNodes) || !(target in this.existingNodes)) {
      return;
    }

    // check if edge already exists
    var idx = this.existingEdges[source].indexOf(target);
    if (idx > -1) {
      return;
    }

    this.existingEdges[source].push(target);
    this.existingEdges[target].push(source);

    this.edges.push({
      "source": this.findNode(source),
      "target": this.findNode(target),
      "value": value});

    this.updateGraph();
    redrawNodes();
  };

  this.processAnimation = function() {
    // TODO: don't process animations while nodes are rearranging
    var next = self.animationQueue.shift();

    // perform animation
    next.animationFunction(next.animationData, self);

    if (self.animationQueue.length === 0) {
      clearInterval(self.animationTimer);
      self.animationTimer = null;
    }
    else if (self.animationQueue.length > 50) {
      // empty the queue quickly
      // TODO: parameterize this/make it adjustable/dynamic
      clearInterval(self.animationTimer);
      self.animationTimer = setInterval(self.processAnimation, 100);
    }
  }

  // throttle animations using a queue
  this.addAnimation = function(animationData, animationFunction) {
    this.animationQueue.push({
      animationData: animationData,
      animationFunction: animationFunction,
    });
    if (this.animationTimer === null) {
      this.animationTimer = setInterval(this.processAnimation, animationThrottleDelay);
    }
  }

  this.findNode = function(id) {
    for (var i in this.nodes) {
      if (this.nodes[i]["id"] === id) return this.nodes[i];
    }
  };

  this.findNodeIndex = function(id) {
    for (var i = 0; i < this.nodes.length; i++) {
      if (this.nodes[i].id == id) {
        return i;
      }
    }
  };

  this.updateGraph = function() {
    var edge = this.svg.selectAll("line")
        .data(this.edges, function(d) {
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

    var node = this.svg.selectAll("g.node")
                  .data(this.nodes, function(d) { return d.id; });

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

    this.force.on("tick", function() {
      node.attr("transform", function(d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

      edge.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
    });

    this.force
      .gravity(.01)
      .charge(-120000)
      .friction(0)
      .linkDistance(function(d) { return d.value * 10 })
      .size([w, h])
      .start();
  };

  var redrawNodes = function() {
    $(".node").each(function( index ) {
      var gnode = this.parentNode;
      gnode.parentNode.appendChild(gnode);
    });
  }

  this.updateGraph();
}