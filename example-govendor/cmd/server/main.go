package main

import (
	"os"

	"github.com/manuelkasiske/openshift-golang-template/example-govendor/pkg/cmd/cli"
	"github.com/manuelkasiske/openshift-golang-template/example-govendor/pkg/cmd/server"
)

func main() {
	cli.EchoArgs()
	if err := server.Start(cli.GetPort()); err != nil {
		os.Exit(1)
	}
}
