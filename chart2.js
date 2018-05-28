// GLOBALS
var w = 1000,h = 900;
var padding = 2;
var nodes = [];
var force, node, data, maxVal;
var brake = 0.2;
var radius = d3.scale.sqrt().range([10, 20]);

var groupCentres = { 
    LRUN25FE: { x: w / 3, y: h / 3.3}, 
    LRUN25MA: {x: w / 3, y: h / 2.3}, 
    LRUN25TT: {x: w / 3	, y: h / 1.8}
  };


var fill = d3.scale.ordinal().range(["#000000", "#C0C0C0", "#EAE4EF"]);

var svgCentre = { 
    x: w / 3.8, y: h / 2.4
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
	if (name === "all-unem-rate") {
		$("#initial-content").fadeIn(250);
		$("#value-scale").fadeIn(1000);
		$("#view-sex-type").fadeOut(250);
		$("#view-quarterly-type").fadeOut(250);
		return total();
		//location.reload();
	}
	if (name === "group-by-sex") {
		$("#initial-content").fadeOut(250);
		$("#value-scale").fadeOut(250);
		$("#view-sex-type").fadeIn(1000);
		$("#view-quarterly-type").fadeOut(250);
		return sexType();
	}
	if (name === "group-by-quarterly") {
		$("#initial-content").fadeOut(250);
		$("#value-scale").fadeOut(250);
		$("#view-sex-type").fadeOut(250);
		$("#view-quarterly-type").fadeIn(1000);
		return quarterlyType();
	}
}

function start() {

	node = nodeGroup.selectAll("circle")
		.data(nodes)
	.enter().append("circle")
		.attr("class", function(d) { return "node " + d.group; })
		.attr("amount", function(d) { return d.value; })
		.attr("place", function(d) { return d.place; })
		.attr("period", function(d) { return d.period; })
		.attr("group", function(d) { return d.group; })
		// disabled because of slow Firefox SVG rendering
		// though I admit I'm asking a lot of the browser and cpu with the number of nodes
		//.style("opacity", 0.9)
		.attr("r", 0)
		.style("fill", function(d) { return fill(d.group); })
		.on("mouseover", mouseover)
		.on("mouseout", mouseout)
	        .on("click", function(d){
			  window.open('http://google.com/search?q='+d.place);
		})
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


function sexType() {
	force.gravity(0)
		.friction(0.8)
		.charge(function(d) { return -Math.pow(d.radius, 2.0) / 3; })
		.on("tick", sexes)
		.start();
}

function quarterlyType() {
	force.gravity(0)
		.friction(0.75)
		.charge(function(d) { return -Math.pow(d.radius, 2.0) / 3; })
		.on("tick", quarterlies)
		.start();
}


function quarterlies(e) {
	node.each(moveToQuarterlies(e.alpha));

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) {return d.y; });
}

function sexes(e) {
	node.each(moveToSexes(e.alpha));

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) {return d.y; });
}


function all(e) {
	node.each(moveToCentre(e.alpha))
		.each(collide(0.001));

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) {return d.y; });
}


function moveToCentre(alpha) {
	return function(d) {
		var centreX = svgCentre.x + 80;
		if (d.value <= 5) {
				centreY = svgCentre.y + 150;
			} else if (d.value <= 10) {
				centreY = svgCentre.y + 125;
			} else if (d.value <= 15) {
				centreY = svgCentre.y + 95;
			} else  if (d.value <= 20) {
				centreY = svgCentre.y + 65;
			} else  if (d.value <= 25) {
				centreY = svgCentre.y -25;
			} else {
				centreY = svgCentre.y;
			}
			

		d.x += (centreX - d.x) * (brake + 0.06) * alpha * 1.1;
		d.y += (centreY - 100 - d.y) * (brake + 0.06) * alpha * 1.1;
	};
}

function moveToSexes(alpha) {
	return function(d) {
		var centreX = groupCentres[d.group].x + 50;
	         
	        var centreY = groupCentres[d.group].y;
		

		d.x += (centreX - d.x) * (brake + 0.02) * alpha * 1.1;
		d.y += (centreY - d.y) * (brake + 0.02) * alpha * 1.1;
};

}

function moveToQuarterlies(alpha) {
	return function(d){
		     var centreY; 
		     var centreX; 
                 if (d.period === 'Q32017'){	
			centreX = 470;
			centreY = 250;

		} else if(d.period ==='Q42017'){
                        centreX = 750;
			centreY = 250;

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
			.range([10, 100]);

	data.forEach(function(d, i) {
		var y = radiusScale(d.amount);
		var node = {
				radius: radiusScale(d.amount) / 5,
				value: d.amount,
				place: d.place,
				group: d.group,
				groupLabel: d.groupname,
				period: d.period,
				periodLabel: d.periodname,
				color: d.color,
				x: Math.random() * w,
				y: -y
      };
			
      nodes.push(node);
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
	var place = d.place;
	var group = d.groupLabel;
	var period = d.periodLabel;
	var offset = $("svg").offset();
	
        var speech = new SpeechSynthesisUtterance(  d.place +" has unemployment rate" + amount );
        window.speechSynthesis.speak(speech);

	// image url that want to check
	var imageFile = "https://raw.githubusercontent.com/p12tzia/D3js-uk-political-donations/gh-pages/photos1/" + place + ".ico";

	
	
	// *******************************************
	
	
	

	

	
	var infoBox = "<p> Country: <b>" + place + "</b> " +  "<span><img src='" + imageFile + "' height='42' width='42' onError='this.src=\"https://github.com/favicon.ico\";'></span></p>" 	
	
	 							+ "<p> Target group: <b>" + group + "</b></p>"
								+ "<p> Type of period: <b>" + period + "</b></p>"
								+ "<p> Rate: <b>" + comma(amount) + "</b></p>";
	
	
	mosie.classed("active", true);
	d3.select(".tooltip")
  	.style("left", (parseInt(d3.select(this).attr("cx") - 80) + offset.left) + "px")
    .style("top", (parseInt(d3.select(this).attr("cy") - (d.radius+150)) + offset.top) + "px")
		.html(infoBox)
			.style("display","block");
	
	
	}

function mouseout() {
	// no more tooltips
		var mosie = d3.select(this);
  
		mosie.classed("active", false);
               
	        window.speechSynthesis.cancel();
		
	        d3.select(".tooltip")
			.style("display", "none");
		}

$(document).ready(function() {
		d3.selectAll(".switch").on("click", function(d) {
      var id = d3.select(this).attr("id");
      return transition(id);
    });
    return d3.csv("data/Unemployment_rate.csv", display);

});
