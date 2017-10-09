require('jquery');
require('bootstrap');

var ko = require('knockout');
var MoodFormViewModel = require('viewModels/MoodFormViewModel').MoodFormViewModel;

ko.applyBindings(new MoodFormViewModel());