var casper = require('casper').create({verbose: true});
var fs = require('fs');
var scoreTable;

var data = {
    team: 'ari',
    games: []
};

var links = [];

function getTable() {

  var $ = jQuery;

  $('.ui-datepicker-trigger').click();

    var sumTable = $('.contentPad').eq(0).find('.summary');
    var rows = sumTable.find('tr');
    // Array of data per period [[1st], [2nd], [3rd], [OT], [SO]]
    var data = [[],[],[],[],[]];
    var period = -1;

    rows.each(function(d) {
      var $this = $(this);
      if ($this.hasClass('sub')) {
        period++;
      } else if (!$this.hasClass('none')) {
        data[period].push({
          'time': $this.find('.time').text(),
          'team': $this.find('.team').text()
        });
      }
    });

    if ($.trim($('.boxData .prd').text()).toUpperCase() == 'SO') {
      data[4] = [{
        'time': "false", // just for shootout
        'team': $('.final.selected .winner .team').text()
      }];
    } else {
      data[4] = [];
    }

    var year = $('.ui-datepicker-year').text();
    var date = $('#selectedDay').text() + ',' + year;

    return [date, data];
}

function getLinks() {
    var l = [];
    var a = $('.schedTbl').eq(0).find('a[href^="http://www.nhl.com/gamecenter/en/recap"]');
    a.each(function(d, i) {
      l.push(this.href.replace("recap", "boxscore"));
    });
    return l;
}


casper.start('http://www.nhl.com/ice/schedulebyseason.htm?season=20132014&gameType=2&team='+data.team+'&network=&venue=', function() {
    this.page.injectJs('https://code.jquery.com/jquery-2.1.3.min.js');
    console.log('Gathering links...');
    links = this.evaluate(getLinks);
    console.log('Found: ' + links.length + ' links');
});

casper.then(function() {

    var gameCnt = 0;
    console.log('Opening links...');

    this.each(links, function(self, link) {
        self.thenOpen(link, function() {
            this.echo('---------------------------------------');
            this.echo('Game count: ' + gameCnt);
            this.echo('Crawling...' + link);
            this.page.injectJs('https://code.jquery.com/jquery-2.1.3.min.js');
            var scoreTable = this.evaluate(getTable);
            //this.echo(scoreTable);
            data.games.push({
                'date': scoreTable[0],
                'goals': scoreTable[1]
            });
            this.echo('Retrieved: ' + scoreTable[0] + ', ' + scoreTable[1]);
            this.echo('---------------------------------------');
            gameCnt++;
        });
    });

});

var linkCnt = 0;

casper.then(function() {

/*    this.page.injectJs('https://code.jquery.com/jquery-2.1.3.min.js');
    scoreTable = this.evaluate(getTable);
    games.push({
        'date': scoreTable[0],
        'goals': scoreTable[1]
    });
*/
    var fileName = data.team.toLowerCase() + '-goals.json';
    console.log('Writing to file...');
    fs.write(fileName, JSON.stringify(data), 'w');
});

casper.run(function() {
    this.exit();
});
