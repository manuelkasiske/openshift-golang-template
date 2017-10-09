require('jquery');
require('bootstrap');

var ko = require('knockout');
var EmailListViewModel = require('viewModels/EmailListViewModel').EmailListViewModel;

ko.applyBindings(new EmailListViewModel());