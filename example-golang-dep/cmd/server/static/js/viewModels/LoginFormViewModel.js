var ko = require('knockout');

function LoginFormViewModel() {
    'use strict';
     var self = this;

     self.email = ko.observable();
     self.password = ko.observable();
     self.shouldShowErrorMessage = ko.observable(false);

     self.submitLogin = function() {

        $.ajax({
            url: "/json/users/login",
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({email: self.email(), password: self.password()}),
            success: function(data) {
                console.log("success - redirect to evaluation");
                location.href="/evaluation";
            },
            error: function(response) {
                console.log(arguments);
                self.shouldShowErrorMessage(true);
                $('#alertBox').modal();
            }
        });
     }

}

module.exports = {
    LoginFormViewModel: LoginFormViewModel
};