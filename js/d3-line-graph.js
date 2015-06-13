var Chart = function() {

    // Defaults
    var margin = {top: 40, right: 10, bottom: 20, left: 50},
        width = 100,
        height = 60,
        hasRendered = false,
        difference = 0,

        svg, gWrap, x, y, xAxis, yAxis, line, tt, bars,
        perLabels, xAxisElem, yAxisElem, yAxisLightElem,
        yMax, xOrdinal,

        parsedFirstPer = false,
        renderedLastOne = false;

    var onePeriod = new Date(1000 * 60 * 20);

    function chart(selection) {

        function formatMin(d) {
            var min = d.getMinutes();

            if (min <= 20) {
                if (min == 0 && !parsedFirstPer) {
                    parsedFirstPer = true;
                } else if (min ==0) {
                    return "EoR";
                }
                if (min == 20) {
                    return "20:00";
                }
                if (min == 5 && !renderedLastOne) {
                  renderedLastOne = true;
                } else if (min == 5) {
                  return 'EoOT';
                }
                return 20 - min + ":00";
            }
            if (min <= 40) {
                if (min == 40) {
                    return "20:00";
                }
                return 40 - min + ":00";
            }
            if (min <= 60) {
                return 60 - min + ":00";
            }
            return "";
        }

        selection.each(function(data) {

            if (!hasRendered && data && data.length) {

                width = this.offsetWidth - margin.left - margin.right;

                svg = d3.select(this).append('svg')
                        .attr('width', width + margin.left + margin.right)
                        .attr('height', height + margin.top + margin.bottom);

                gWrap = svg.append('g')
                        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                yMax = globalYMax;

                x = d3.time.scale()
                    .range([0, width])
                    .domain([data[0].start, data[data.length-1].end]);

                yMax = Math.max(Math.abs(globalYMin), globalYMax);

                y = d3.scale.linear()
                    .range([height, 0])
                    .domain([-yMax, yMax]);

                xOrdinal = d3.scale.ordinal()
                    .domain(d3.range(0,66))
                    .rangeBands([0, width], .2);

                xAxis = d3.svg.axis()
                    .scale(x)
                    .ticks(8)
                    .tickSize(-height)
                    .tickFormat(formatMin)
                    .orient('bottom');

                yAxis = d3.svg.axis()
                    .scale(y)
                    .tickSize(-width)
                    .ticks(1)
                    .orient('left');

                yAxis2 = d3.svg.axis()
                    .scale(y)
                    .tickSize(-width)
                    .ticks(5)
                    .orient('left');

                perLabels = gWrap.append("g")
                    .attr('class', 'period-labels');

                perLabels.append('text')
                    .attr('class', 'period-text')
                    .attr('x', x(onePeriod) / 2)
                    .attr('y', -8)
                    .attr('text-anchor', 'middle')
                    .text('1st Period');

                perLabels.append('rect')
                    .attr('class', 'period-bg odd')
                    .attr('x', x(new Date(onePeriod * 1)))
                    .attr('y', 0)
                    .attr('width', x(onePeriod) - x(new Date(0)))
                    .attr('height', height)

                perLabels.append('text')
                    .attr('class', 'period-text odd')
                    .attr('x', x(onePeriod * 3) / 2)
                    .attr('y', -8)
                    .attr('text-anchor', 'middle')
                    .text('2nd Period');

                perLabels.append('text')
                    .attr('class', 'period-text')
                    .attr('x', x(onePeriod*2) + (x(onePeriod) / 2))
                    .attr('y', -8)
                    .attr('text-anchor', 'middle')
                    .text('3rd Period');

                perLabels.append('rect')
                    .attr('class', 'period-bg odd')
                    .attr('x', x(onePeriod * 3))
                    .attr('y', 0)
                    .attr('width', x(onePeriod - x(new Date(0))) / 4)
                    .attr('height', height);
                perLabels.append('text')
                    .attr('class', 'period-text')
                    .attr('x', ((x(onePeriod)/4) * 13) - (x(onePeriod) / 4) / 2)
                    .attr('y', -8)
                    .attr('text-anchor', 'middle')
                    .text('OT');

                perLabels.append('text')
                  .attr('class', 'period-text')
                  .attr('x', width - 7)
                  .attr('y', -8)
                  .attr('text-anchor', 'middle')
                  .text('SO*');

                xAxisElem = gWrap.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + height + ")")
                    .call(xAxis);

                yAxisLightElem = gWrap.append("g")
                    .attr("class", "y axis light")
                    .call(yAxis2);

                tt = d3.select(this).append('div').attr('class', 'tt');

                bars = gWrap.selectAll('.bars')
                    .data(data)
                    .enter()
                    .append('rect')
                    .attr('class', function(d) { return (d.count > 0) ? "bar positive" : "bar negative"; })
                    .attr('x', function(d, i) { return xOrdinal(i); })
                    .attr('y', function(d) { return y(Math.max(0, d.count)); })
                    .attr('width', function(d, i) { return xOrdinal.rangeBand(); })
                    .attr('height', function(d) { return Math.abs(y(d.count) - y(0)); })
                    .on('mouseout', function() { tt.attr('class', 'tt'); })
                    .on("mouseover", function(d, i) {
                      var left = xOrdinal(i) + margin.left + 70;
                      var top = y(Math.max(0, d.count)) - 23 + difference;

                      tt.attr('class', 'tt show')
                        .style({
                          left: left + 'px',
                          top: top + 'px'
                        })
                        .text(d.count);
                    });

                yAxisElem = gWrap.append("g")
                    .attr("class", "y axis")
                    .call(yAxis);

                hasRendered = true;

            }

        });
    }

    chart.update = function(data) {

      yMax = Math.max(Math.abs(globalYMin), globalYMax);

      y.domain([-yMax, yMax]);

      yAxis.scale(y);
      yAxis2.scale(y);

      yAxisLightElem.transition().call(yAxis2);
      yAxisElem.transition().call(yAxis);

      bars
        .data(data)
        .on('mouseout', function() { tt.attr('class', 'tt'); })
        .on("mouseover", function(d, i) {
          var left = xOrdinal(i) + margin.left + 70;
          var top = y(Math.max(0, d.count)) - 23 + difference;

          tt.attr('class', 'tt show')
            .style({
              left: left + 'px',
              top: top + 'px'
            })
            .text(d.count);
         })
        .attr('class', function(d) { return (d.count > 0) ? "bar positive" : "bar negative"; })
        .attr('x', function(d, i) { return xOrdinal(i); })
        .attr('width', function(d, i) { return xOrdinal.rangeBand(); })
        .transition()
        .attr('y', function(d) { return y(Math.max(0, d.count)); })
        .attr('height', function(d) { return Math.abs(y(d.count) - y(0)); });

    };

    chart.margin = function(_) {
        if (_) {
          svg
            .attr('width', width + _.left + _.right)
            .attr('height', height + _.top + _.bottom);

          gWrap.attr('transform', 'translate(' + _.left + ',' + _.top + ')');
        }
        return margin;
    };

    chart.removePeriodLabels = function() {
      perLabels.selectAll('.period-text').remove();
    };

    chart.removeXaxis = function() {
      xAxisElem.selectAll('text').remove();
    };

    chart.cleanUp = function() {
      xAxisElem.selectAll('path').remove();
      yAxisElem.selectAll('path').remove();
      yAxisLightElem.selectAll('path').remove();
      xAxisElem.selectAll('text')
        .attr("y", 10);
    };

    chart.setToolTipTop = function(_) {
      difference = _;
    };

    return chart;

};
