require('jquery');
require('bootstrap');
var ko = require('knockout');
var MoodViewModel = require('viewModels/MoodViewModel').MoodViewModel;

ko.applyBindings(new MoodViewModel());