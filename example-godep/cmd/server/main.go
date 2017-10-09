package main

import (
	"os"

	"github.com/manuelkasiske/openshift-golang-template/example-godep/pkg/cmd/cli"
	"github.com/manuelkasiske/openshift-golang-template/example-godep/pkg/cmd/server"
)

func main() {
	cli.EchoArgs()
	if err := server.Start(cli.GetPort()); err != nil {
		os.Exit(1)
	}
}
