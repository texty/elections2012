/*d3.select("body").append("div")
  .attr("class", "warning")
  .attr("html", "Почекайте, йде завантаження даних ...")
*/
// party selector
var sigs = [1,1,1,1,1];

// load data
queue()
    .defer(d3.json, "oblasti.json")
    .defer(d3.csv, "dataviz1.csv")
    .await(ready);

function ready(error, oblasti, stations){  

  d3.select("div.warning").remove();

  // add oncheck events for each checkboxes with parties 
  d3.selectAll('.partycolor')
	.on('change', renderAll);


  var quota = 84404.52; // votes for one deputat
  // Various formatters.
  var formatNumber = d3.format(",d"),
      formatChange = d3.format("+,d"),
      formatDate = d3.time.format("%B %d, %Y"),
      formatTime = d3.time.format("%I:%M %p");

  // A little coercion, since the CSV is untyped.
  stations.forEach(function(d, i) {
    d.index = i;
    d.ovk = +d.ovk;
    d.dvk = +d.dvk;
    d.size = +d.size;
    d.regcode = +d.regcode;
    d.turnout = +d.turnout;
    d.turnout_last = +d.turnout_last;
    d.invalid_bulletins = +d.invalid_bulletins; 
    d.KPU = +d.KPU;	
    d.PR = +d.PR;	
    d.Batkivshyna = +d.Batkivshyna;	
    d.UDAR = +d.UDAR;	
    d.Svoboda = +d.Svoboda;	
    d.Vpered = +d.Vpered;	
    d.NU = +d.NU;

  });

  // Create the crossfilter for the relevant dimensions and groups.
  var station = crossfilter(stations),
      all = station.groupAll(),
      ovkf = station.dimension(function(d) { return d.ovk; }),
      ovks = ovkf.group(),
      regionf = station.dimension(function(d) { return d.regcode; }),
      regions = regionf.group(),
      sizef = station.dimension(function(d) { return d.size; }),
      sizes = sizef.group(function(d) { return Math.floor(d / 50) * 50; }),
      turnoutf = station.dimension(function(d) { return d.turnout; }),
      turnouts = turnoutf.group(function(d) { return Math.floor(400*d/10) / 40; }),
      turnout_last_f = station.dimension(function(d) { return d.turnout_last; }),
      turnouts_last = turnout_last_f.group(function(d) { return Math.floor(400*d/10) / 40; }),
      invalidf = station.dimension(function(d) { return d.invalid_bulletins; }),
      invalids = invalidf.group(function(d) { return Math.floor(4000*d/10) / 400; }),
      op_po_f = station.dimension(function(d) { return -d.PR - d.KPU 
				+ d.Batkivshyna + d.UDAR + d.Svoboda; }), 
      op_po_s = op_po_f.group(function(d) { return Math.floor(2000*d/10) / 200; });



  var charts = [

    barChart()
        .dimension(sizef)
        .group(sizes)
      .x(d3.scale.linear()
        .domain([0, 2500])
        .rangeRound([0, 19 * 20])),

    barChart()
        .dimension(turnoutf)
        .group(turnouts)
      .x(d3.scale.linear()
        .domain([0, 1.1])
        .rangeRound([0, 10 * 20])),

    barChart()
        .dimension(turnout_last_f)
        .group(turnouts_last)
      .x(d3.scale.linear()
        .domain([0, 0.4])
        .rangeRound([0, 10 * 19])),

    barChart()
        .dimension(invalidf)
        .group(invalids)
      .x(d3.scale.linear()
        .domain([0, 0.07])
        .rangeRound([0, 20 * 10])),
   

    barChart()
        .dimension(op_po_f)
        .group(op_po_s)
      .x(d3.scale.linear()
        .domain([-1, 1])
        .rangeRound([0, 10 * 22])),

    barChart()
        .dimension(regionf)
        .group(regions)
      .x(d3.scale.linear()
        .domain([1,28])
        .rangeRound([0, 15 * 18])),

    barChart()
        .dimension(ovkf)
        .group(ovks)
      .x(d3.scale.linear()
        .domain([1, 225])
        .rangeRound([0,  20*18])),
  ];

  // Given our array of charts, which we assume are in the same order as the
  // .chart elements in the DOM, bind the charts to the DOM and render them.
  // We also listen to the chart's brush events to update the display.
  var chart = d3.selectAll(".chart")
      .data(charts)
      .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });


  // Render the total.
  d3.selectAll("#total")
      .text(formatNumber(station.size()));


  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }

  // Whenever the brush moves, re-rendering everything.
  function renderAll(){
    sigs = d3.selectAll('.partycolor')[0]
        .map( function(d){
                 if(d.checked) return 1;
                 else return 0;
               }
        );
    //party_filter();

    chart.each(render);
    d3.select("#active").text(formatNumber(all.value()));

    // retrieve all filtered data, 
    var allStations = ovkf.top(Infinity);
    render_map(allStations, oblasti); 
  }

  

  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    renderAll();
  };

  window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
  };

  //---

  function party_filter(){
      // find which parties to compare from checkboxes
      sigs = d3.selectAll('input')[0]
        .map( function(d){
                 if(d.checked) return 1;
                 else return 0;
               }
        );

      op_po_f = station.dimension(
		function(d) { 
		  return -sigs[3]*d.PR - sigs[4]*d.KPU 
			+ sigs[0]*d.Batkivshyna + sigs[1]*d.UDAR + sigs[2]*d.Svoboda; 
                }
      );
      op_po_s = op_po_f.group(function(d) { return Math.floor(2000*d/10) / 200; });

      // N2Y: remember about correct order for charts
      charts[4] = 
        barChart()
          .dimension(op_po_f)
          .group(op_po_s)
         .x(d3.scale.linear()
          .domain([-1, 1])
          .rangeRound([0, 12 * 20]));

     chart = d3.selectAll(".chart")
         .data(charts)
         .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });

     //renderAll();
  }

  function render_map(data, borders){
//console.log(borders);
    var width = 980,
      height = 750;

    var canvas = d3.select("#chart").node(),
        context = canvas.getContext("2d");

    // bounding box for Ukraine		
    var xmax = 40.5; // d3.max(data, function(d){ return d.lon})
    var xmin = 22.0; //d3.min(data, function(d){ return d.lon})

    var ymax = 53.5; //d3.max(data, function(d){ return d.lat})
    var ymin = 44.0; //d3.min(data, function(d){ return d.lat})

    // scales
    //var cs_x = d3.scale.linear().domain([xmin, xmax]).range([0, width]);
    var cs_x = width/(xmax-xmin);
    //var cs_y = d3.scale.linear().domain([ymin, ymax]).range([0, height]);
    var cs_y = height/(ymax-ymin);

    var rad_scale = d3.scale.linear().domain([10, 2600]).range([0.1, 2.6]); 
    var color = d3.scale.linear()
      .domain([-0.8, 0, 0.8])
      .range(["#05528e", "silver", "#e0700b"]);


    d3.select(canvas)
      .attr("width", width )
      .attr("height", height )


    // clear all
    context.fillStyle = "rgba(" + 255 + "," + 255 + "," + 255 + "," + 1 + ")";
    context.fillRect(0, 0, width, height);
    context.globalAlpha = 0.4;


    // draw borders
   context.beginPath(); 
   for(var i = 0, l = borders.features.length; i < l; i++ ){
     var feature = borders.features[i];
     var coords = feature.geometry.coordinates;
     //cs_x*(p.lon-xmin), height - 40 - cs_y*(p.lat-ymin)
     context.moveTo(cs_x*(coords[0][0]-xmin), height-40-cs_y*(coords[0][1] - ymin)); 
     for(var i1 = 1, l1 = coords.length; i1 < l1;  i1++  ){
       var pair = coords[i1];
       context.lineTo( cs_x*(pair[0] - xmin),  height - 40 - cs_y*(pair[1] - ymin) );  
     }
   } 

   context.strokeStyle = "#000";
   context.lineWidth = 1;
   context.stroke();
   // eof  draw borders
  
    var pr_sum = 0, kpu_sum = 0, but_sum = 0, udar_sum = 0, svoboda_sum = 0;
    //for(var ovk_num in data){ 
      var i = -1,
        n = data.length;

      while (++i < n) {
        var p = data[i];

          context.fillStyle = color( 
		(sigs[0]*p.Batkivshyna + sigs[2]*p.Svoboda + sigs[1]*p.UDAR - 
		 sigs[3]*p.PR - sigs[4]*p.KPU  ) );	

          // draw station as a circle, actually
	  context.beginPath(); 
	  context.arc(cs_x*(p.lon-xmin), height - 40 - cs_y*(p.lat-ymin), 0.8+p.size/1500, 0, 2 * Math.PI, true); 
          context.fill();
          context.closePath();

          // find total number of votes for each party
          if(!isNaN(p.PR)) { pr_sum += p.PR * p.turnout * p.size; } 
          if(!isNaN(p.KPU)) { kpu_sum += p.KPU * p.turnout * p.size; } 
          if(!isNaN(p.Batkivshyna)) { but_sum += p.Batkivshyna * p.turnout * p.size; } 
          if(!isNaN(p.UDAR)) { udar_sum += p.UDAR * p.turnout * p.size; } 
          if(!isNaN(p.Svoboda)) { svoboda_sum += p.Svoboda * p.turnout * p.size; } 
      }
    //}
    d3.select("#pr").text(Math.floor(pr_sum/quota));
    d3.select("#kpu").text(Math.floor(kpu_sum/quota));
    d3.select("#but").text(Math.floor(but_sum/quota));
    d3.select("#udar").text(Math.floor(udar_sum/quota));
    d3.select("#svoboda").text(Math.floor(svoboda_sum/quota));

  }

  function barChart() {
    if (!barChart.id) barChart.id = 0;

    var margin = {top: 10, right: 10, bottom: 20, left: 10},
        x,
        y = d3.scale.linear().range([50, 0]),
        id = barChart.id++,
        axis = d3.svg.axis().orient("bottom"),
        brush = d3.svg.brush(),
        brushDirty,
        dimension,
        group,
        round;

    function chart(div) {
      var width = x.range()[1],
          height = y.range()[0];

      y.domain([0, group.top(1)[0].value]);

      div.each(function() {
        var div = d3.select(this),
            g = div.select("g");

        // Create the skeletal chart.
        if (g.empty()) {
          div.select(".title").append("a")
              .attr("href", "javascript:reset(" + id + ")")
              .attr("class", "reset")
              .text("скасувати")
              .style("display", "none");

          g = div.append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          g.append("clipPath")
              .attr("id", "clip-" + id)
            .append("rect")
              .attr("width", width)
              .attr("height", height);

          g.selectAll(".bar")
              .data(["background", "foreground"])
            .enter().append("path")
              .attr("class", function(d) { return d + " bar"; })
              .datum(group.all());

          g.selectAll(".foreground.bar")
              .attr("clip-path", "url(#clip-" + id + ")");

          g.append("g")
              .attr("class", "axis")
              .attr("transform", "translate(0," + height + ")")
              .call(axis);

          // Initialize the brush component with pretty resize handles.
          var gBrush = g.append("g").attr("class", "brush").call(brush);
          gBrush.selectAll("rect").attr("height", height);
          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
        }

        // Only redraw the brush if set externally.
        if (brushDirty) {
          brushDirty = false;
          g.selectAll(".brush").call(brush);
          div.select(".title a").style("display", brush.empty() ? "none" : null);
          if (brush.empty()) {
            g.selectAll("#clip-" + id + " rect")
                .attr("x", 0)
                .attr("width", width);
          } else {
            var extent = brush.extent();
            g.selectAll("#clip-" + id + " rect")
                .attr("x", x(extent[0]))
                .attr("width", x(extent[1]) - x(extent[0]));
          }
        }

        g.selectAll(".bar").attr("d", barPath);
      });

      function barPath(groups) {
        var path = [],
            i = -1,
            n = groups.length,
            d;
        while (++i < n) {
          d = groups[i];
          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
        }
        return path.join("");
      }

      function resizePath(d) {
        var e = +(d == "e"),
            x = e ? 1 : -1,
            y = height / 3;
        return "M" + (.5 * x) + "," + y
            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
            + "V" + (2 * y - 6)
            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
            + "Z"
            + "M" + (2.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8)
            + "M" + (4.5 * x) + "," + (y + 8)
            + "V" + (2 * y - 8);
      }
    }

    brush.on("brushstart.chart", function() {
      var div = d3.select(this.parentNode.parentNode.parentNode);
      div.select(".title a").style("display", null);
    });

    brush.on("brush.chart", function() {
      var g = d3.select(this.parentNode),
          extent = brush.extent();
      if (round) g.select(".brush")
          .call(brush.extent(extent = extent.map(round)))
        .selectAll(".resize")
          .style("display", null);
      g.select("#clip-" + id + " rect")
          .attr("x", x(extent[0]))
          .attr("width", x(extent[1]) - x(extent[0]));
      dimension.filterRange(extent);

    });

    brush.on("brushend.chart", function() {
      if (brush.empty()) {
        var div = d3.select(this.parentNode.parentNode.parentNode);
        div.select(".title a").style("display", "none");
        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
        dimension.filterAll();
      }
    });

    chart.margin = function(_) {
      if (!arguments.length) return margin;
      margin = _;
      return chart;
    };

    chart.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      axis.scale(x);
      brush.x(x);
      return chart;
    };

    chart.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return chart;
    };

    chart.dimension = function(_) {
      if (!arguments.length) return dimension;
      dimension = _;
      return chart;
    };

    chart.filter = function(_) {
      if (_) {
        brush.extent(_);
        dimension.filterRange(_);
      } else {
        brush.clear();
        dimension.filterAll();
      }
      brushDirty = true;
      return chart;
    };

    chart.group = function(_) {
      if (!arguments.length) return group;
      group = _;
      return chart;
    };

    chart.round = function(_) {
      if (!arguments.length) return round;
      round = _;
      return chart;
    };

    return d3.rebind(chart, brush, "on");
  }
  renderAll();
 }
 



