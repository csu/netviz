/*
  Tor61 Network Visualization
  Example usage of viz.
  Christopher Su
*/

/*
  Usage: change logServer to point to your log-server instance.
*/

// Constants and configuration
var logServer = "http://log.461.dev.christopher.su";

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
var errorDurationMultiplier = 1;
var receivedDurationMultiplier = 0.6;

var animationDuration = 1500;
var displayReceived = true;
var debugMode = false;

// Control panel
document.getElementById('animDuration').value = animationDuration;
document.getElementById('animThrottleDelay').value = animationThrottleDelay;
document.getElementById('showReceived').checked = displayReceived;
document.getElementById('debugMode').checked = debugMode;

function setAnimDuration() {
  var input = document.getElementById('animDuration').value;
  animationDuration = parseInt(input);
}

function setAnimThrottleDelay() {
  var input = document.getElementById('animThrottleDelay').value;
  animationThrottleDelay = parseInt(input);
}

function setShowReceived() {
  displayReceived = document.getElementById('showReceived').checked;
}

function setDebugMode() {
  debugMode = document.getElementById('debugMode').checked;
}

// Helpers
var convertRouterId = function(agentId) {
  var groupId = agentId >>> 16;
  var routerId = agentId & ((~0) >>> 16);
  return [groupId, routerId];
};

// Tor61 animation functions
var animateReceived = function(data, viz) {
  var n1 = viz.findNode(data.source);

  var label = viz.svg.append("text")
      .attr("x", n1.x + 20)
      .attr("y", n1.y + 7)
      .text(data.label);
  var circle = viz.svg.append("circle")
      .attr("cx", n1.x)
      .attr("cy", n1.y)
      .attr("r", 5)
      .style("fill", data.color);
    
  label.transition()
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
  circle.transition()
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

var animateError = function(data, viz) {
  var n1 = viz.findNode(data.source);

  var label = viz.svg.append("text")
      .attr("x", n1.x + 20)
      .attr("y", n1.y + 10)
      .text(data.label);
  var rect = viz.svg.append("rect")
      .attr("x", n1.x)
      .attr("y", n1.y)
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", data.color);
    
  label.transition()
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
  rect.transition()
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

var animateSelfLoopCell = function(data, viz) {
  var n1 = viz.findNode(data.source);

  var label = viz.svg.append("text")
      .attr("x", n1.x + 30)
      .attr("y", n1.y + 15)
      .text(data.label);
  var rect = viz.svg.append("rect")
      .attr("x", n1.x)
      .attr("y", n1.y)
      .attr("width", 7)
      .attr("height", 7)
      .style("fill", data.color);
  
  label.transition()
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
  rect.transition()
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
}

var animateCell = function(data, viz) {
  var n1 = viz.findNode(data.source);
  var n2 = viz.findNode(data.target);

  var label = viz.svg.append("text")
      .attr("x", n1.x + 30)
      .attr("y", n1.y + 15)
      .text(data.label);
  var rect = viz.svg.append("rect")
      .attr("x", n1.x)
      .attr("y", n1.y)
      .attr("width", 7)
      .attr("height", 7)
      .style("fill", data.color);

  label.transition()
    .attr("x", n2.x + 10)
    .attr("y", n2.y + 10)
    .ease("quad")
    .duration(animationDuration)
    .each("end", function() {
      d3.select(this).remove();
  });
  rect.transition()
    .attr("x", n2.x)
    .attr("y", n2.y)
    .ease("quad")
    .duration(animationDuration)
    .each("end", function() {
      d3.select(this).remove();
  });
}

// Tor61 visualization
function tor61Visualization() {
  var socket = io(logServer);
  var netviz = new Netviz("#network");

  // Listen for events over 
  socket.on('event', function(entry) {
    if (debugMode) {
      console.log(entry);
    }

    // draw the node, if it doesn't exist already
    var source = entry.router;
    var sourceLabel = convertRouterId(source);
    netviz.addNode(entry.router, sourceLabel[0] + "-" + sourceLabel[1]);

    // if it's a packet being sent
    if (entry.data.event === 'sending') {
      // add the destination node and edge if either doesn't exist
      var dest = entry.data.to;
      var destLabel = convertRouterId(dest);
      netviz.addNode(entry.data.to, destLabel[0] + "-" + destLabel[1]);
      netviz.addEdge(source, dest, 20);

      // draw the packet for the cell type
      var color = entry.data.cell_type in packetColors
                  ? packetColors[entry.data.cell_type] : defaultColor;

      if (source === dest) { // animate self loop cell
        netviz.addAnimation({
          source: source,
          target: dest,
          label: entry.data.cell_type,
          color: color
        }, animateSelfLoopCell);
      }
      else { // animate non-self loop cell
        netviz.addAnimation({
          source: source,
          target: dest,
          label: entry.data.cell_type,
          color: color
        }, animateCell);
      }
    }
    else if (displayReceived && entry.data.event === 'received') {
      netviz.addAnimation({
        source: source,
        label: entry.data.cell_type,
        color: '#808000'
      }, animateReceived);
    }
    else if (entry.data.event == 'shutdown') {
      netviz.removeNode(source);
    }
  });

  socket.on('error', function(entry) {
    // draw the node, if it doesn't exist already
    var source = entry.router;
    var sourceLabel = convertRouterId(source);
    netviz.addNode(entry.router, sourceLabel[0] + "-" + sourceLabel[1]);

    if ('error' in entry.data) {
      netviz.addAnimation({
        source: source,
        label: entry.data.error,
        color: "red"
      }, animateError);
    }
  });
}

tor61Visualization();