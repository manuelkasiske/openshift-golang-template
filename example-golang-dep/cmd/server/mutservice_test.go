package main

import (
	"github.com/labstack/echo/engine/fasthttp"
	"log"
	"net"
	"os"
	"testing"
	"time"
)

func TestMain(m *testing.M) {
	startServer()
	waitForServerStart()
	os.Exit(m.Run())
}

func waitForServerStart() {
	counter := 0
	_, tcpError := net.Dial("tcp", "localhost:8081")

	for tcpError != nil && counter < 10 {
		log.Println("Waiting for server to start ", tcpError)
		counter = counter + 1
		time.Sleep(100) //ugly workaround to make sure that the server has enough time to start before tests are run
		_, tcpError = net.Dial("tcp", "localhost:8081")
	}

	if tcpError != nil {
		log.Fatalf("Could not start server %v", tcpError)
	} else {
		log.Println("Server started")
	}
}

func TestDummy(testing *testing.T) {
	assertEquals(true, true, "Some dummy testing", testing)
}
//func TestGetSubscribersStatusCode(testing *testing.T) {
//	response, responseError := http.DefaultClient.Get("http://localhost:8081/subscribers")
//
//	if responseError != nil {
//		testing.Errorf("GET /subcribers got response error: '%v'", responseError)
//	}
//
//	assertEquals(response.StatusCode, http.StatusOK, "GET /subcribers did return status code %v and not %v", testing)
//}
//
//func TestGetSubscribersBody(testing *testing.T) {
//	response, responseError := http.DefaultClient.Get("http://localhost:8081/subscribers")
//
//	if responseError != nil {
//		testing.Errorf("GET /subcribers got response error: '%v'", responseError)
//	}
//
//	defer response.Body.Close()
//	content, _ := ioutil.ReadAll(response.Body)
//
//	assertEquals(string(content), "[]", "GET /subcribers did return content %v and not %v", testing)
//}

func startServer() {
	server := initServer()
	http := fasthttp.New(":8081")
	go server.Run(http)
}

func assertEquals(actualValue interface{}, expectedValue interface{}, errorMessage string, testing *testing.T) {
	if actualValue != expectedValue {
		testing.Errorf(errorMessage, actualValue, expectedValue)
	}
}
