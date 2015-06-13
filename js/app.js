var globalYMax = 0;
var globalYMin = 0;
var forChart, diffChart, againstChart;

var goalsForDiv, goalsDiffDiv, goalsAgainstDiv;
var chartTitle, teamNameText = 'Detroit Red Wings';

var showingAll = false;

function showTeam(team) {

  d3.json('data/' + team + '-goals.json')
    .get(function(error, data) {

      var massagedData = [];

      if (team === 'all') {

        showingAll = true;
        wrap.innerHTML = '';

        for(var key in data) {
          var d = calcGameData(data[key]);
          massagedData.push({
              team: data[key].team,
              goalsForData: d[0],
              goalsAgainstData: d[1],
              goalsDiffData: d[2],
              goalsFor: d[3],
              goalsAgainst: d[4],
              goalsDiff: d[3] + d[4]
          });
        }
      } else {

        if (showingAll) {
          wrap.innerHTML = '';
        }

        var d = calcGameData(data);
        massagedData.push({
            team: team,
            goalsForData: d[0],
            goalsAgainstData: d[1],
            goalsDiffData: d[2],
            goalsFor: d[3],
            goalsAgainst: d[4],
            goalsDiff: d[3] + d[4]
        });

      }

    init(massagedData);

    if (team != 'all' && showingAll) {
      showingAll = false;
    }

  });

}

function calcGameData(data) {
    var startTime = +new Date(0);
    var endTime = +new Date(0) + (60 * 1000) * 66;

    var GoalsForBins = [];
    var GoalsAgainstBins = [];
    var GoalsDiffBins = [];
    var GoalsForTotal = 0;
    var GoalsAgainstTotal = 0;
    var GoalsDiffTotal = 0;

    for (var i=0; i<66; i++) {
        GoalsForBins.push({
            start: +new Date(0) + (60 * 1000) * i,
            end: +new Date(0) + (60 * 1000) * (i+1) - 60,
            count: 0
        });
        GoalsDiffBins.push({
            start: +new Date(0) + (60 * 1000) * i,
            end: +new Date(0) + (60 * 1000) * (i+1) - 60,
            count: 0
        });
        GoalsAgainstBins.push({
            start: +new Date(0) + (60 * 1000) * i,
            end: +new Date(0) + (60 * 1000) * (i+1) - 60,
            count: 0
        });
    }

    function addToGoalsForBins(whichBin, t, p) {

        // If t is "false", this was a shootout, so just add to the last bin.
        if (t == "false") {

          whichBin[whichBin.length-1].count++;

        } else {

          var secInPer = 20 * 60;
          var splitTime = t.split(':');
          var minToSec = splitTime[0] * 60;
          var secondsIn = +minToSec + +splitTime[1] + (p * secInPer);
          var milSecIn = +new Date(secondsIn * 1000);

          for (var i=0; i<whichBin.length; i++) {

              var bin = whichBin[i];
              var s = bin.start;
              var e = bin.end;

              if (milSecIn >= s && milSecIn <= e) {
                  bin.count++;
              }
          }
        }
    }

    for (var i=0; i<data.games.length; i++) {

        var periods = data.games[i].goals;

        // Yuck, nested loops...
        for (var j=0; j<periods.length; j++) {

            var goals = periods[j];

            // Really??
            for (var k=0; k<goals.length; k++) {

                var g = goals[k];

                if (g.team == data.team.toUpperCase()) {
                    addToGoalsForBins(GoalsForBins, g.time, j);
                } else {
                    addToGoalsForBins(GoalsAgainstBins, g.time, j);
                }
            }
        }
    }

    for (var i=0; i<GoalsForBins.length; i++) {
        GoalsDiffBins[i].count = GoalsForBins[i].count - GoalsAgainstBins[i].count;

        // Make goals against negative.
        GoalsAgainstBins[i].count *= -1;

        GoalsForTotal += GoalsForBins[i].count;
        GoalsAgainstTotal += GoalsAgainstBins[i].count;
        GoalsDiffTotal += GoalsAgainstBins[i].count;
    }

    forMax = d3.max(GoalsForBins, function(d) { return d.count; });
    AgainstMax = d3.min(GoalsAgainstBins, function(d) { return d.count; });
    AgainstMin = d3.min(GoalsAgainstBins, function(d) { return d.count; });
    yMax = Math.max(forMax, AgainstMax);

    if (yMax > globalYMax) {
        globalYMax = yMax;
    }
    globalYMin = AgainstMin;
    return [
      GoalsForBins, GoalsAgainstBins, GoalsDiffBins,
      GoalsForTotal, GoalsAgainstTotal, GoalsDiffTotal
    ];
}

function init(data) {

    for(var i=0; i<data.length; i++) {

        if (forChart && !showingAll) {

          forChart.update(data[i].goalsForData);
          forChart.cleanUp();

          goalsForDiv.innerHTML = '+' + data[i].goalsFor;

          diffChart.update(data[i].goalsDiffData);
          diffChart.cleanUp();

          var diffClass = (data[i].goalsDiff > 0) ? 'positive' : 'negative';
          goalsDiffDiv.className = 'value ' + diffClass;
          goalsDiffDiv.innerHTML = (diffClass == 'positive' ? '+' : '') + data[i].goalsDiff;

          againstChart.update(data[i].goalsAgainstData);
          againstChart.cleanUp();

          goalsAgainstDiv.innerHTML = data[i].goalsAgainst;

          teamNameDiv.textContent = teamNameText + ' Goal Distribution';

        } else {

          var forDivWrap = document.createElement('div');
          forDivWrap.className = 'stat-wrap for';

          var forStat = document.createElement('div');
          forStat.className = 'stat';
          forStat.innerHTML = '<h3>Goals For</h3><span class="value positive">+' + data[i].goalsFor + '</span>';

          var forDiv = document.createElement('div');
          forDiv.className = 'goals-for goals';

          var teamName = document.createElement('div');
          teamName.className = 'team-name';
          teamName.textContent = document.querySelector('option[value="' + data[i].team + '"]').innerHTML + ' Goal Distribution';

          var diffDivWrap = document.createElement('div');
          diffDivWrap.className = 'stat-wrap diff';

          var diffStat = document.createElement('div');
          diffStat.className = 'stat';
          var diffClass = (data[i].goalsDiff > 0) ? 'positive' : 'negative';
          diffStat.innerHTML = '<h3>Goal Difference</h3><span class="value ' + diffClass + '">' + data[i].goalsDiff + '</span>';

          var diffDiv = document.createElement('div');
          diffDiv.className = 'goals-diff goals';

          var againstDivWrap = document.createElement('div');
          againstDivWrap.className = 'stat-wrap against';

          var againstStat = document.createElement('div');
          againstStat.className = 'stat';
          againstStat.innerHTML = '<h3 class="chart-title">Goals Against</h3><span class="value negative">' + data[i].goalsAgainst + '</span>';

          var againstDiv = document.createElement('div');
          againstDiv.className = 'goals-against goals';

          var row = document.createElement('div');

          row.className = 'row ' + data[i].team.toLowerCase();

          forDivWrap.appendChild(forStat);
          forDivWrap.appendChild(forDiv);
          diffDivWrap.appendChild(diffStat);
          diffDivWrap.appendChild(diffDiv);
          againstDivWrap.appendChild(againstStat);
          againstDivWrap.appendChild(againstDiv);

          row.appendChild(teamName);

          // Append wraps for data vis
          row.appendChild(forDivWrap);
          row.appendChild(diffDivWrap);
          row.appendChild(againstDivWrap);

          document.querySelector('.wrap').appendChild(row);

          teamNameDiv = document.querySelector('.team-name');
          chartTitle = document.querySelector('.chart-title');
          goalsForDiv = document.querySelector('.for span');
          goalsDiffDiv = document.querySelector('.diff span');
          goalsAgainstDiv = document.querySelector('.against span');

          forChart = Chart();
          d3.select('.' + data[i].team.toLowerCase() + ' .goals-for')
              .datum(data[i].goalsForData)
              .call(forChart);
          forChart.removeXaxis();
          forChart.margin({
            top: 30,
            right: 1,
            bottom: 5,
            left: 30
          });
          forChart.cleanUp();
          forChart.setToolTipTop(24);

          diffChart = new Chart();
          d3.select('.' + data[i].team.toLowerCase() + ' .goals-diff')
              .datum(data[i].goalsDiffData)
              .call(diffChart);
          diffChart.removePeriodLabels();
          diffChart.removeXaxis();
          diffChart.margin({
            top: 5,
            right: 1,
            bottom: 5,
            left: 30
          });
          diffChart.cleanUp();

          againstChart = new Chart();
          d3.select('.' + data[i].team.toLowerCase() + ' .goals-against')
              .datum(data[i].goalsAgainstData)
              .call(againstChart);
          againstChart.removePeriodLabels();
          againstChart.margin({
            top: 5,
            right: 1,
            bottom: 20,
            left: 30
          });
          againstChart.cleanUp();

      }

    }
}

// Input setup
var teamSelector = document.querySelector('select');
var wrap = document.querySelector('.wrap');
teamSelector.addEventListener('change', function(e) {

  globalYMax = 0;
  globalYMin = 0;

  teamNameText = this.querySelector('option[value="'+this.value+'"]').innerHTML;
  var team = this.value;

  showTeam(team);

});

showTeam('det');
