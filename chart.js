// GLOBALS
var w = 1000,h = 900;
var padding = 2;
var nodes = [];
var force, node, data, maxVal;
var brake = 0.2;
var radius = d3.scale.sqrt().range([10, 20]);
var imgY = 0;
var counter =0;

var partyCentres = { 
    con: { x: w / 3, y: h / 3.3}, 
    lab: {x: w / 3, y: h / 2.3}, 
    lib: {x: w / 3	, y: h / 1.8}
  };

var entityCentres = { 
    company: {x: w / 3.65, y: h / 2.3},
		union: {x: w / 3.65, y: h / 1.8},
		other: {x: w / 1.15, y: h / 1.9},
		society: {x: w / 1.12, y: h  / 3.2 },
		pub: {x: w / 1.8, y: h / 2.8},
		individual: {x: w / 3.65, y: h / 3.3},
	};

var fill = d3.scale.ordinal().range(["#012c27", "#636cfc", "#660020"]);

var svgCentre = { 
    x: w / 3.6, y: h / 2
  };

var svg = d3.select("#chart").append("svg")
	.attr("id", "svg")
	.attr("width", w)
	.attr("height", h);

var nodeGroup = svg.append("g");

var tooltip = d3.select("#chart")
 	.append("div")
	.attr("class", "tooltip")
	.attr("id", "tooltip");

var comma = d3.format(",.0f");

function transition(name) {
	if (name === "all-donations") {
		$("#initial-content").fadeIn(250);
		$("#value-scale").fadeIn(1000);
		$("#view-donor-type").fadeOut(250);
		$("#view-source-type").fadeOut(250);
		$("#view-party-type").fadeOut(250);
		$("#view-amount").fadeOut(250);
		$("#chart").fadeIn(1000);
		$("#chartTwo").fadeOut(1000);
		return total();
		//location.reload();
	}
	if (name === "group-by-party") {
		$("#initial-content").fadeOut(250);
		$("#value-scale").fadeOut(250);
		$("#view-donor-type").fadeOut(250);
		$("#view-source-type").fadeOut(250);
		$("#view-party-type").fadeIn(1000);
		$("#view-amount").fadeOut(250);
		$("#chart").fadeIn(1000);
		$("#chartTwo").fadeOut(1000);
		return partyGroup();
	}
	if (name === "group-by-donor-type") {
		$("#initial-content").fadeOut(250);
		$("#value-scale").fadeOut(250);
		$("#view-party-type").fadeOut(250);
		$("#view-source-type").fadeOut(250);
		$("#view-donor-type").fadeIn(1000);
		$("#view-amount").fadeOut(250);
		$("#chart").fadeIn(1000);
		$("#chartTwo").fadeOut(1000);
		return donorType();
	}
	if (name === "group-by-money-source"){
		$("#initial-content").fadeOut(250);
		$("#value-scale").fadeOut(250);
		$("#view-donor-type").fadeOut(250);
		$("#view-party-type").fadeOut(250);
		$("#view-source-type").fadeIn(1000);
		$("#view-amount").fadeOut(250);
		$("#chart").fadeIn(1000);
		$("#chartTwo").fadeOut(1000);
		return fundsType();
	}
	if (name === "group-by-amount-of-donation"){
		$("#initial-content").fadeOut(250);
		$("#value-scale").fadeOut(250);
		$("#view-donor-type").fadeOut(250);
		$("#view-party-type").fadeOut(250);
		$("#view-source-type").fadeOut(250);
		$("#view-amount").fadeIn(1000);
        	$("#chart").fadeIn(1000);
		$("#chartTwo").fadeOut(1000);
		return amountOfDonation();	
	}
	if (name === "sunburst"){
		$("#initial-content").fadeOut(250);
		$("#value-scale").fadeOut(250);
		$("#view-donor-type").fadeOut(250);
		$("#view-party-type").fadeOut(250);
		$("#view-source-type").fadeOut(250);
		$("#view-amount").fadeOut(1000);
        	$("#chart").fadeOut(1000);
		$("#chartTwo").fadeIn(1000);
		return SunBurst();	
	}
	
}

function start() {

	node = nodeGroup.selectAll("circle")
		.data(nodes)
	.enter().append("circle")
		.attr("class", function(d) { return "node " + d.party; })
		.attr("amount", function(d) { return d.value; })
		.attr("donor", function(d) { return d.donor; })
		.attr("entity", function(d) { return d.entity; })
		.attr("party", function(d) { return d.party; })
		// disabled because of slow Firefox SVG rendering
		// though I admit I'm asking a lot of the browser and cpu with the number of nodes
		//.style("opacity", 0.9)
		.attr("r", 0)
		.style("fill", function(d) { return fill(d.party); })
		.on("mouseover", mouseover)
		.on("mouseout", mouseout)
		.on("click",click);
		// Alternative title based 'tooltips'
		// node.append("title")
		//	.text(function(d) { return d.donor; });

		force.gravity(0)
			.friction(0.75)
			.charge(function(d) { return -Math.pow(d.radius, 2) / 3; })
			.on("tick", all)
			.start();

		node.transition()
			.duration(2500)
			.attr("r", function(d) { return d.radius; });
}

function total() {

	force.gravity(0)
		.friction(0.9)
		.charge(function(d) { return -Math.pow(d.radius, 2) / 2.8; })
		.on("tick", all)
		.start();
}

function partyGroup() {
	force.gravity(0)
		.friction(0.8)
		.charge(function(d) { return -Math.pow(d.radius, 2.0) / 3; })
		.on("tick", parties)
		.start()
		.colourByParty();
}

function donorType() {
	force.gravity(0)
		.friction(0.8)
		.charge(function(d) { return -Math.pow(d.radius, 2.0) / 3; })
		.on("tick", entities)
		.start();
}

function fundsType() {
	force.gravity(0)
		.friction(0.75)
		.charge(function(d) { return -Math.pow(d.radius, 2.0) / 3; })
		.on("tick", types)
		.start();
}
function amountOfDonation(){
	force.gravity(0)
		.friction(0.8)
		.charge(function(d) { return -Math.pow(d.radius, 2.0) / 3; })
		.on("tick", donations)
		.start()
		//.colourByParty();

}

function parties(e) {
	node.each(moveToParties(e.alpha));

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) {return d.y; });
}

function entities(e) {
	node.each(moveToEnts(e.alpha));

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) {return d.y; });
}

function types(e) {
	node.each(moveToFunds(e.alpha));


		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) {return d.y; });
}

function all(e) {
	node.each(moveToCentre(e.alpha))
		.each(collide(0.001));

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) {return d.y; });
}
function donations (e){
		node.each(moveToAmounts(e.alpha))
		//.each(collide(0.002));

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) {return d.y; });
}

function moveToCentre(alpha) {
	return function(d) {
		var centreX = svgCentre.x + 75;
			if (d.value <= 25001) {
				centreY = svgCentre.y + 75;
			} else if (d.value <= 50001) {
				centreY = svgCentre.y + 55;
			} else if (d.value <= 100001) {
				centreY = svgCentre.y + 35;
			} else  if (d.value <= 500001) {
				centreY = svgCentre.y + 15;
			} else  if (d.value <= 1000001) {
				centreY = svgCentre.y - 5;
			} else  if (d.value <= maxVal) {
				centreY = svgCentre.y - 25;
			} else {
				centreY = svgCentre.y;
			}

		d.x += (centreX - d.x) * (brake + 0.06) * alpha * 1.2;
		d.y += (centreY - 100 - d.y) * (brake + 0.06) * alpha * 1.2;
	};
}

function moveToParties(alpha) {
	return function(d) {
		var centreX = partyCentres[d.party].x + 50;
		if (d.entity === 'pub') {
			centreX = 1200;
		} else {
			centreY = partyCentres[d.party].y;
		}

		d.x += (centreX - d.x) * (brake + 0.02) * alpha * 1.1;
		d.y += (centreY - d.y) * (brake + 0.02) * alpha * 1.1;
	};
}

function moveToEnts(alpha) {
	return function(d) {
		var centreY = entityCentres[d.entity].y;
		if (d.entity === 'pub') {
			centreX = 1200;
		} else {
			centreX = entityCentres[d.entity].x;
		}

		d.x += (centreX - d.x) * (brake + 0.02) * alpha * 1.1;
		d.y += (centreY - d.y) * (brake + 0.02) * alpha * 1.1;
	};
}

function moveToFunds(alpha) {
	return function(d) {
		var centreY = entityCentres[d.entity].y;
		var centreX = entityCentres[d.entity].x;
		if (d.entity !== 'pub') {
			centreY = 300;
			centreX = 350;
		} else {
			centreX = entityCentres[d.entity].x + 60;
			centreY = 380;
		}
		d.x += (centreX - d.x) * (brake + 0.02) * alpha * 1.1;
		d.y += (centreY - d.y) * (brake + 0.02) * alpha * 1.1;
	};
}
function moveToAmounts(alpha) {
	return function(d) {
		var centreY = svgCentre.y;
		if (d.value <= 100000) {
				centreX = svgCentre.x +70;
				centreY = svgCentre.y -70;
		} else if (d.value <= 500000) {
				centreX = svgCentre.x +450;
				centreY = svgCentre.y -70;
		} else if (d.value <= 1000000) {
				centreX = svgCentre.x +70;
				centreY = svgCentre.y +250;
		} else {
				centreX = svgCentre.x +500; 
				centreY = svgCentre.y +250;
		}
		
		d.x += (centreX - d.x) * (brake + 0.02) * alpha * 1.1;
		d.y += (centreY - d.y) * (brake + 0.02) * alpha * 1.1;	
	};
}
// Collision detection function by m bostock
function collide(alpha) {
  var quadtree = d3.geom.quadtree(nodes);
  return function(d) {
    var r = d.radius + radius.domain()[1] + padding,
        nx1 = d.x - r,
        nx2 = d.x + r,
        ny1 = d.y - r,
        ny2 = d.y + r;
    quadtree.visit(function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== d)) {
        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = d.radius + quad.point.radius + (d.color !== quad.point.color) * padding;
        if (l < r) {
          l = (l - r) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2
          || x2 < nx1
          || y1 > ny2
          || y2 < ny1;
    });
  };
}

function display(data) {

	maxVal = d3.max(data, function(d) { return d.amount; });

	var radiusScale = d3.scale.sqrt()
		.domain([0, maxVal])
			.range([10, 20]);

	data.forEach(function(d, i) {
		var y = radiusScale(d.amount);
		var node = {
				radius: radiusScale(d.amount) / 5,
				value: d.amount,
				donor: d.donor,
				party: d.party,
				partyLabel: d.partyname,
				entity: d.entity,
				entityLabel: d.entityname,
				color: d.color,
				x: Math.random() * w,
				y: -y
      };
			
      nodes.push(node)
	});

	console.log(nodes);

	force = d3.layout.force()
		.nodes(nodes)
		.size([w, h]);

	return start();
}

function mouseover(d, i) {
	// tooltip popup
	var mosie = d3.select(this);
	var amount = mosie.attr("amount");
	var donor = d.donor;
	var party = d.partyLabel;
	var entity = d.entityLabel;
	var offset = $("svg").offset();
	


	// image url that want to check
	var imageFile = "https://raw.githubusercontent.com/ioniodi/D3js-uk-political-donations/master/photos/" + donor + ".ico";

	
	
	// *******************************************
	
	
	

	

	
	var infoBox = "<p> Source: <b>" + donor + "</b> " +  "<span><img src='" + imageFile + "' height='42' width='42' onError='this.src=\"https://github.com/favicon.ico\";'></span></p>" 	
	
	 							+ "<p> Recipient: <b>" + party + "</b></p>"
								+ "<p> Type of donor: <b>" + entity + "</b></p>"
								+ "<p> Total value: <b>&#163;" + comma(amount) + "</b></p>";
	
	
	mosie.classed("active", true);
	d3.select(".tooltip")
  	.style("left", (parseInt(d3.select(this).attr("cx") - 80) + offset.left) + "px")
    .style("top", (parseInt(d3.select(this).attr("cy") - (d.radius+150)) + offset.top) + "px")
		.html(infoBox)
			.style("display","block");
	
	responsiveVoice.speak("The name of the donor is" + donor + "             and the ammount of the donation is " + amount);

    var newIcon = $("#IconContainer").html();
    var addIt = donor+"<div><img src='" + imageFile +"' class='icon-image' align='middle' onError='this.src=\"https://github.com/favicon.ico\";'/>"+
		"</div>"
    	$("#IconContainer").html(addIt + newIcon);

	}

function mouseout() {
	// no more tooltips
		var mosie = d3.select(this);

		mosie.classed("active", false);

		d3.select(".tooltip")
			.style("display", "none");
		}
//Click event
function click(d){
	var q = d.donor;
	    window.open('http://google.com/search?q='+q);
}
$(document).ready(function() {
		d3.selectAll(".switch").on("click", function(d) {
      var id = d3.select(this).attr("id");
      return transition(id);
    });
    return d3.csv("data/7500up.csv", display);

});

var x = document.getElementById("myAudio"); 

function playAudio() { 
    x.play(); 
} 
//Code gia to kainourgio tab SunBurst Visualization
function SunBurst(){
	// Dimensions of sunburst.
	var width = 750;
	var height = 600;
	var radius = Math.min(width, height) / 2;

	// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
	var b = {
	  w: 75, h: 30, s: 3, t: 10
	};

	// Mapping of step names to colors.
	var colors = {
	  "donor": "#5687d1",
	  "amount": "#7b615c",
	  "party": "#de783b",
	  "entity": "#6ab975",
	  "color":"#eee",
	  "partyname": "#a173d1",
	  "entityname": "#bbbbbb"
	};

	// Total size of all segments; we set this later, after loading the data.
	var totalSize = 0; 

	var vis = d3.select("#chartTwo").append("svg:svg")
	    .attr("width", width)
	    .attr("height", height)
	    .append("svg:g")
	    .attr("id", "container")
	    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	var partition = d3.layout.partition()
	    .size([2 * Math.PI, radius * radius])
	    .value(function(d) { return d.size; });

	var arc = d3.svg.arc()
	    .startAngle(function(d) { return d.x; })
	    .endAngle(function(d) { return d.x + d.dx; })
	    .innerRadius(function(d) { return Math.sqrt(d.y); })
	    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

	// Use d3.text and d3.csv.parseRows so that we do not need to have a header
	// row, and can receive the csv as an array of arrays.
	d3.text("data/7500up.csv", function(text) {
	  var csv = d3.csv.parseRows(text);
	  var json = buildHierarchy(csv);
	  createVisualization(json);
	});

	// Main function to draw and set up the visualization, once we have the data.
	function createVisualization(json) {

	  // Bounding circle underneath the sunburst, to make it easier to detect
	  // when the mouse leaves the parent g.
	  vis.append("svg:circle")
	      .attr("r", radius)
	      .style("opacity", 0);

	  // For efficiency, filter nodes to keep only those large enough to see.
	  var nodes = partition.nodes(json)
	      .filter(function(d) {
	      return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
	      });

	  var path = vis.data([json]).selectAll("path")
	      .data(nodes)
	      .enter().append("svg:path")
	      .attr("display", function(d) { return d.depth ? null : "none"; })
	      .attr("d", arc)
	      .attr("fill-rule", "evenodd")
	      .style("fill", function(d) { return colors[d.name]; })
	      .style("opacity", 1)
	      .on("mouseover", mouseover);

	  // Add the mouseleave handler to the bounding circle.
	  d3.select("#container").on("mouseleave", mouseleave);

	  // Get total size of the tree = value of root node from partition.
	  totalSize = path.node().__data__.value;
	 };

	// Fade all but the current sequence, and show it in the breadcrumb trail.
	function mouseover(d) {
		  var sequence =0;
		  for (var i = 0; i < csv.length; i++) {
		     sequence = csv[i][1];

		  var percentageString = sequence + ;
		

		  d3.select("#percentage")
		      .text(percentageString);

		  d3.select("#explanation")
		      .style("visibility", "");

		  var sequenceArray = getAncestors(d);

		  // Fade all the segments.
		  d3.selectAll("path")
		      .style("opacity", 0.3);

		  // Then highlight only those that are an ancestor of the current segment.
		  vis.selectAll("path")
		      .filter(function(node) {
				return (sequenceArray.indexOf(node) >= 0);
			      })
		      .style("opacity", 1);

		}//end of for
	}

	// Restore everything to full opacity when moving off the visualization.
	function mouseleave(d) {

	  // Hide the breadcrumb trail
	  d3.select("#trail")
	      .style("visibility", "hidden");

	  // Deactivate all segments during transition.
	  d3.selectAll("path").on("mouseover", null);

	  // Transition each segment to full opacity and then reactivate it.
	  d3.selectAll("path")
	      .transition()
	      .duration(1000)
	      .style("opacity", 1)
	      .each("end", function() {
		      d3.select(this).on("mouseover", mouseover);
		    });

	  d3.select("#explanation")
	      .style("visibility", "hidden");
	}

	// Given a node in a partition layout, return an array of all of its ancestor
	// nodes, highest first, but excluding the root.
	function getAncestors(node) {
	  var path = [];
	  var current = node;
	  while (current.parent) {
	    path.unshift(current);
	    current = current.parent;
	  }
	  return path;
	}

	// Take a 2-column CSV and transform it into a hierarchical structure suitable
	// for a partition layout. The first column is a sequence of step names, from
	// root to leaf, separated by hyphens. The second column is a count of how 
	// often that sequence occurred.
	function buildHierarchy(csv) {
	  var root = {"name": "root", "children": []};
	  for (var i = 0; i < csv.length; i++) {
	    var sequence = csv[i][0];
	    var size = +csv[i][1];
	    if (isNaN(size)) { // e.g. if this is a header row
	      continue;
	    }
	    var parts = sequence.split("-");
	    var currentNode = root;
	    for (var j = 0; j < parts.length; j++) {
	      var children = currentNode["children"];
	      var nodeName = parts[j];
	      var childNode;
	      if (j + 1 < parts.length) {
	   // Not yet at the end of the sequence; move down the tree.
		var foundChild = false;
		for (var k = 0; k < children.length; k++) {
		  if (children[k]["name"] == nodeName) {
		    childNode = children[k];
		    foundChild = true;
		    break;
		  }
		}
	  // If we don't already have a child node for this branch, create it.
		if (!foundChild) {
		  childNode = {"name": nodeName, "children": []};
		  children.push(childNode);
		}
		currentNode = childNode;
	      } else {
		// Reached the end of the sequence; create a leaf node.
		childNode = {"name": nodeName, "size": size};
		children.push(childNode);
	      }
	    }
	  }
	  return root;
	};
}

