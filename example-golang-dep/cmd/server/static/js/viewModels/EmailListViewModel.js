require('jquery');
var ko = require('knockout');

function Email(data) {
    'use strict';
    this.email = ko.observable(data.email);
    this.uuid = ko.observable(data.uuid);
}

function EmailListViewModel() {
    'use strict';
    // Data
    var self = this;
    self.emails = ko.observableArray([]);
    self.newEmailText = ko.observable();
    self.team = ko.observable("1");
    self.shouldShowMessage = ko.observable(false);
    self.shouldShowErrorMessage = ko.observable(false);
    self.shouldShowDeleteMessage = ko.observable(false);
    self.shouldShowDeleteErrorMessage = ko.observable(false);

    $.getJSON("/json/subscribers", function (allData) {
        var mappedEmails = $.map(allData, function (item) {
            return new Email(item)
        });
        self.emails(mappedEmails);
    });

    // Operations
    self.addEmail = function (uuid) {
        self.emails.push(new Email({email: this.newEmailText(), uuid: uuid}));
        self.newEmailText("");
    };

    self.removeEmail = function (email) {
        self.emails.destroy(email)
    };


    self.remove = function (email) {
        $.ajax({
            type: "DELETE",
            url: "/json/subscribers" + '/' + email.uuid(),
            success: function () {
                self.emails.destroy(email);
                self.shouldShowDeleteMessage(true);
                self.shouldShowDeleteErrorMessage(false);

                self.shouldShowMessage(false);
                self.shouldShowErrorMessage(false);
            },
            error: function () {
                self.shouldShowDeleteMessage(false);
                self.shouldShowDeleteErrorMessage(true);

                self.shouldShowMessage(false);
                self.shouldShowErrorMessage(false);
            }
        });
    };

    self.save = function () {
        $.ajax("/json/subscribers", {
            data: JSON.stringify({email: self.newEmailText(), teamId: parseInt(self.team())}),
            type: "POST", contentType: "application/json",
            success: function (result) {
                self.shouldShowMessage(true);
                self.shouldShowErrorMessage(false);
                self.addEmail(result.uuid);

                self.shouldShowDeleteMessage(false);
                self.shouldShowDeleteErrorMessage(false);
            },
            error: function (result) {
                self.shouldShowMessage(false);
                self.shouldShowErrorMessage(true);

                self.shouldShowDeleteMessage(false);
                self.shouldShowDeleteErrorMessage(false);
            }
        });
    };
}

module.exports = {
    EmailListViewModel: EmailListViewModel
};
