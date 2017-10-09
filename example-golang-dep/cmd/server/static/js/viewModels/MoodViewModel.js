var ko = require('knockout');
var MoodChart = require('chart');
var PieChart = require('chart');
var MoodChartInstance;
var PieChartInstance;

function getNumberOfValuesInRange(values, includeStart, excludeEnd) {
    'use strict';

    if (values !== null) {
        return values.filter(function(value) {
            return value >= includeStart && value < excludeEnd
        }).length
    } else {
        return 0
    }
}

function Mood(data) {
    'use strict';

    this.date =         ko.observable(data.date.replace(/\-/g, '.'));
    this.veryUnhappy =  ko.observable(getNumberOfValuesInRange(data.moods, -2.0, -1.5));
    this.unhappy =      ko.observable(getNumberOfValuesInRange(data.moods, -1.5, -0.5));
    this.neutral =      ko.observable(getNumberOfValuesInRange(data.moods, -0.5, 0.5));
    this.happy =        ko.observable(getNumberOfValuesInRange(data.moods, 0.5, 1.5));
    this.veryHappy =    ko.observable(getNumberOfValuesInRange(data.moods, 1.5, 2.1));
    this.numberValues = ko.observable(data.moods)
}

function MoodViewModel() {
    'use strict';

    // Data
    var self = this;

    self.initialize = function() {
        //Define custom line chart type
        MoodChart.types.Line.extend({
            name: "LineAlt",
            initialize: function (data) {
                MoodChart.types.Line.prototype.initialize.apply(this, arguments);

                this.originalClear = this.clear;
                this.clear = function () {
                    this.originalClear();
                    var lengthPerPoint = this.datasets[0].points[1].x - this.datasets[0].points[0].x;
                    var heightStart = this.scale.endPoint;
                    var heightPerLine = (this.scale.startPoint - heightStart) / 4;
                    var numberOfPoints = this.datasets[0].points.length;
                    var startPoint = this.datasets[0].points[0].x;

                    this.chart.ctx.fillStyle = 'rgba(255,24,24,0.8)'; // red
                    this.chart.ctx.fillRect(startPoint, heightStart, lengthPerPoint * numberOfPoints, heightPerLine / 2);
                    this.chart.ctx.fillStyle = 'rgba(255, 153, 0,0.8)'; // orange
                    this.chart.ctx.fillRect(startPoint, heightStart + heightPerLine * 0.5, lengthPerPoint * numberOfPoints,
                        heightPerLine);
                    this.chart.ctx.fillStyle = 'rgba(255, 255, 255,0.8)'; // white
                    this.chart.ctx.fillRect(startPoint, heightStart + heightPerLine * 1.5, lengthPerPoint * numberOfPoints,
                        heightPerLine);
                    this.chart.ctx.fillStyle = 'rgba(51, 153, 255,0.8)'; // blue
                    this.chart.ctx.fillRect(startPoint, heightStart + heightPerLine * 2.5, lengthPerPoint * numberOfPoints,
                        heightPerLine);
                    this.chart.ctx.fillStyle = 'rgba(91, 194, 54,0.8)'; // green
                    this.chart.ctx.fillRect(startPoint, heightStart + heightPerLine * 3.5, lengthPerPoint * numberOfPoints,
                        heightPerLine / 2);
                }
            }
        });
    }

    self.moods = ko.observableArray([]);
    self.newMoodText = ko.observable();
    self.extendedData = ko.observable(false);

    self.getData = function() {
        var url = "/json/moods/1/30"
        if(self.extendedData()) {
            url = "/json/moods/1/60"
        }

        $.getJSON(url, function (allData) {
            allData = allData.filter(function(data) { return data.moods !== null && data.moods.length > 0 })
            var mappedMoods = $.map(allData, function (item) {
                return new Mood(item)
            });
            updateMoodChart(mappedMoods);
            updatePieChart(mappedMoods);
            self.moods(mappedMoods.reverse());

        });
        return true;
    }

    self.initialize();
    self.getData();


    function updateMoodChart(mappedMoods) {
        var xAxisLabels = $.map(mappedMoods, function (mood) {
            return mood.date()
        });
        var yAxisValues = $.map(mappedMoods, function (mood) {
            var moodCount = mood.numberValues().length;
            var moodSum = mood.numberValues().reduce( function(previousValue, currentValue) {
                return currentValue + previousValue;
            }, 0);

            return moodSum === 0 ? 0 : (Math.round((moodSum / moodCount) * 100) / 100);
        });

	    var yMaxAxisValues = $.map(mappedMoods, function (mood) {
            var moodCount = mood.numberValues().length;
            var moodSum = mood.numberValues().reduce( function(previousValue, currentValue) {
                return currentValue > previousValue ? currentValue : previousValue;
            }, -2);
            return moodSum;
        });
        var yMinAxisValues = $.map(mappedMoods, function (mood) {
            var moodCount = mood.numberValues().length;
            var moodSum = mood.numberValues().reduce( function(previousValue, currentValue) {
                return currentValue < previousValue ? currentValue : previousValue;
            }, 2);
            return moodSum;
        });
        var data = {
            labels: xAxisLabels,
            datasets: [
	        {
                label: "Maximum",
                fillColor: "rgba(0,133,0,0.1)",
                strokeColor: "rgba(0,133,0,1)",
                pointColor: "rgba(0,133,0,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: yMaxAxisValues
            },
	        {
                label: "Average",
                fillColor: "rgba(0,0,0,0.1)",
                strokeColor: "rgba(0,0,0,1)",
                pointColor: "rgba(0,0,0,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: yAxisValues
            },
            {
                label: "Minimum",
                fillColor: "rgba(133,0,0,0.1)",
                strokeColor: "rgba(133,0,0,1)",
                pointColor: "rgba(133,0,0,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: yMinAxisValues
            }]
        };

        var options = {
            scaleOverride: true,
            scaleSteps: 4,
            scaleStepWidth: 1,
            scaleStartValue: -2,
            scaleLineColor: "rgba(0,0,0,.5)",
            responsive: true
        };


//      We have to draw the chart 2 times even if its initially there. If the chart get new data and has to be redrawn
//      the whole canvas has to be removed from dom and has to be added new to avoid flackering of chart lines.
//      Chart.js holds the data by itself. MoodChartInstance.destroy(); has to be called to refresh chart.js model.
//      After drawing the new canvas the automatically responsive method get lost. Therefore we need an own resize handler.

        var ctx = document.getElementById("moodChart").getContext("2d");
        MoodChartInstance = new MoodChart(ctx).LineAlt(data, options);

//      While this doesn't remove the unnecessary reference from the Chart.js internal list, it prevents Chart.js
//      from triggering an (unnecessary) error causing resize for an instance that doesn't exist in the DOM.
//      See: http://stackoverflow.com/questions/32009333/chartjs-removing-redrawing-canvas-graph-not-responsive

        MoodChartInstance.options.responsive = false;
        MoodChartInstance.destroy();
        document.getElementById("moodChart").remove();


        document.getElementById("moodChartWrapper").innerHTML = '<canvas id="moodChart"></canvas>';
        var ctx2 = document.getElementById("moodChart").getContext("2d");
        MoodChartInstance = new MoodChart(ctx2).LineAlt(data, options);

        MoodChart.helpers.addEvent(window, "resize", (function () {
            var timeout;
            return function () {
                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    MoodChartInstance.resize(MoodChartInstance.render, true);
                    MoodChartInstance.draw();
                }, 50);

            };
        })());

        MoodChartInstance.draw();

    }

    function countValues(values) {
        var count = 0;
        for (var i = 0; i < values.length; i++) {
            count += values[i];
        }
        return count;
    }

    function updatePieChart(mappedMoods) {

            var veryHappyValues = $.map(mappedMoods, function (mood) {
                return mood.veryHappy();
            });
            var veryHappyCount = countValues(veryHappyValues);

            var happyValues = $.map(mappedMoods, function (mood) {
                return mood.happy();
            });
            var happyCount = countValues(happyValues);

            var neutralValues = $.map(mappedMoods, function (mood) {
                return mood.neutral();
            });
            var neutralCount = countValues(neutralValues);

            var unhappyValues = $.map(mappedMoods, function (mood) {
                return mood.unhappy();
            });
            var unhappyCount = countValues(unhappyValues);

            var veryUnhappyValues = $.map(mappedMoods, function (mood) {
                return mood.veryUnhappy();
            });
            var veryUnhappyCount = countValues(veryUnhappyValues);

            var pieData = [
               {
                  value: veryHappyCount,
                  label: 'Very Happy',
                  color: 'rgba(91, 194, 54,0.8)'
               },
               {
                  value: happyCount,
                  label: 'Happy',
                  color: 'rgba(51, 153, 255,0.8)'
               },
               {
                  value: neutralCount,
                  label: 'Neutral',
                  color: 'rgba(208, 208, 219,0.8)'
               },
               {
                  value : unhappyCount,
                  label: 'Unhappy',
                  color: 'rgba(255, 153, 0,0.8)'
               },
               {
                  value : veryUnhappyCount,
                  label: 'Very Unhappy',
                  color: 'rgba(255,24,24,0.8)'
               }
            ];

            var options = {
                responsive: true
            };

    //      We have to draw the chart 2 times even if its initially there. If the chart get new data and has to be redrawn
    //      the whole canvas has to be removed from dom and has to be added new to avoid flackering of chart lines.
    //      Chart.js holds the data by itself. PieChartInstance.destroy(); has to be called to refresh chart.js model.
    //      After drawing the new canvas the automatically responsive method get lost. Therefore we need an own resize handler.

            var pieCartCtx = document.getElementById("pieChart").getContext("2d");
            PieChartInstance = new PieChart(pieCartCtx).Pie(pieData, options);

    //      While this doesn't remove the unnecessary reference from the Chart.js internal list, it prevents Chart.js
    //      from triggering an (unnecessary) error causing resize for an instance that doesn't exist in the DOM.
    //      See: http://stackoverflow.com/questions/32009333/chartjs-removing-redrawing-canvas-graph-not-responsive

            PieChartInstance.options.responsive = false;
            PieChartInstance.destroy();
            document.getElementById("pieChart").remove();


            document.getElementById("pieChartWrapper").innerHTML = '<canvas id="pieChart"></canvas>';
            var pieCartCtx2 = document.getElementById("pieChart").getContext("2d");
            PieChartInstance = new PieChart(pieCartCtx2).Pie(pieData, options);
//
            PieChart.helpers.addEvent(window, "resize", (function () {
                var timeout;
                return function () {
                    clearTimeout(timeout);
                    timeout = setTimeout(function () {
                        PieChartInstance.resize(PieChartInstance.render, true);
                    }, 50);
                };
            })());
        }

}
module.exports = {
    MoodViewModel: MoodViewModel
};
