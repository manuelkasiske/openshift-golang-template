package main

import (
	"github.com/robfig/cron"
)

func createCronJob(command func()) {
	scheduler := cron.New()
	scheduler.AddFunc("0 00 12 ? * MON-FRI", command)
	scheduler.Start()
}
