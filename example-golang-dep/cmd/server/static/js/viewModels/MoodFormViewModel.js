var ko = require('knockout');
var DragDealer = require('dragdealer');
require('jquery');

ko.bindingHandlers.slider = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        "use strict";

        return new DragDealer(element,{
            x:      ko.unwrap(valueAccessor()),
            steps:  $(element).data("steps") || 0,
            snap:   $(element).data("snap") || false,
            handleClass: 'slider__handle',
            animationCallback: function(x) {
                bindingContext.$data.mood(parseFloat(x * 4).toFixed(2));
            }
        });

    }
};

function MoodForm() {
    'use strict';

    var self = this,
        moodLabels = {
            "0.0": "totally depressed",
            "0.5": "very unhappy",
            "1.0": "unhappy",
            "1.5": "slightly unhappy",
            "2.0": "don't know",
            "2.5": "slightly happy",
            "3.0": "happy",
            "3.5": "very happy",
            "4.0": "perfectly happy"
        };

    this.key = ko.observable(location.pathname.replace('/moods/', ''));
    this.moodUrl = ko.computed(function(){
        return '/json/moods/' + self.key()
    });
    this.hasError       = ko.observable(false);
    this.errorTitle     = ko.observable("");
    this.errorMessage   = ko.observable("");

    this.mood           = ko.observable(0.5);
    this.moodLabel      = ko.computed(function(){
        return moodLabels[parseFloat(self.mood()).toFixed(1)] || self.moodLabel();
    });
    this.moodClass      = ko.computed(function(){
       var moodClass = "slider slider--moods";
        if (self.mood() === "0.00") {
            moodClass = "slider slider--moods lowest";
        }
        if (self.mood() === "4.00") {
            moodClass = "slider slider--moods highest";
        }
        return moodClass;
    });

    function mapToValueRange(moodValue) {
        var values = [-2.0,-1.9,-1.8,-1.7,-1.6,-1.5,-1.4,-1.3,-1.2,-1.1,-1.0,-0.8,-0.7,-0.6,-0.5,-0.4,-0.3,-0.2,-0.1,
        0.0,0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2.0];

        var valueDiffs = values.map(function(value) {
            return {"value": value, "diff": Math.abs(value - moodValue)}
        });

        var valueRange = valueDiffs.reduce( function(previousValue, currentValue) {
            return previousValue.diff < currentValue.diff ? previousValue : currentValue;
        }, {"value":0, "diff":4});

        return valueRange.value;
    }

    this.doPost = function(vm, event) {
        var rawMoodValue = parseFloat(self.mood()) - 2.0;
        var data = {
            mood: mapToValueRange(rawMoodValue).toString()
        };

        event.preventDefault();

        $.ajax({
            url: self.moodUrl(),
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function(data) {
                console.log("success - redirect to evaluation");
                location.href="/evaluation";
            },
            error: function(response) {
                console.log(arguments);
                var rspJson = response.responseJSON;
                self.errorTitle("Voting failed!");
                self.errorMessage(rspJson.text);
                
                $('#alertBox').modal();
            }
        });
    };
}

module.exports = {
    MoodFormViewModel: MoodForm
};
