package main

import (
	"log"
	"os"
	"net/smtp"
)

type (
	MailTask struct {
		Email string
		Key   string
	}
)

var AppDns string = os.Getenv("OPENSHIFT_APP_DNS")

func sendMail(email string, text string) {

	from := "hardmood-team@gmx.de"
	pass := "piuwazca3IB4"
	to := email

	msg := "From: " + from + "\n" +
        "To: " + to + "\n" +
        "MIME-Version: 1.0" +  "\n" +
        "Content-type: text/html" + "\n" +
        "Subject: How is your mood today?\n\n" + text

	err := smtp.SendMail("mail.gmx.net:587",
		smtp.PlainAuth("", from, pass, "mail.gmx.net"),
		from, []string{to}, []byte(msg))

	if err != nil {
		log.Printf("smtp error: %s", err)
		return
	}
}

func triggerMail() func() {
	return func() {
		log.Println("Triggered mail sending!")
		//TODO: add team id!
		subscribers, triggerError := getAllSubscribers()

		if triggerError != nil {
			log.Printf("%s", triggerError)
		}

		mailTasks, triggerError := saveFeedbackIdentifierAndCreateMailTasks(subscribers)

		if triggerError != nil {
			log.Printf("%s", triggerError)
		}

		sendMails(mailTasks)
	}
}

func sendMails(tasks []MailTask) {
	for _, task := range tasks {
		sendMail(task.Email, getHtmlText(task.Key))
	}
}

func getHtmlText(key string) string {
	return `<html>
	<body>
	<h1>Select your mood</h1>
	<a href="https://` + AppDns + `/moods/` + key + `">Take me to the mood selection!</a>
	</body>
	</html>`
}
