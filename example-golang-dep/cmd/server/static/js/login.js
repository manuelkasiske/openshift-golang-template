require('jquery');
require('bootstrap');
var ko = require('knockout');
var LoginFormViewModel = require('viewModels/LoginFormViewModel').LoginFormViewModel;

ko.applyBindings(new LoginFormViewModel());
