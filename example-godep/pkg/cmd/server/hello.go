package server

import (
	"net/http"

	"github.com/manuelkasiske/openshift-golang-template/example-godep/pkg/fake"
)

// hello provides HTTP endpoint for "Hello" method
func hello(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte(fake.Hello()))
}
