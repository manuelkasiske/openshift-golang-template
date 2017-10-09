package main

import (
	"os"

	"github.com/manuelkasiske/openshift-golang-template/example-golang-dep/pkg/cmd/cli"
	"github.com/manuelkasiske/openshift-golang-template/example-golang-dep/pkg/cmd/server"
)

func main() {
	cli.EchoArgs()
	if err := server.Start(cli.GetPort()); err != nil {
		os.Exit(1)
	}
}
