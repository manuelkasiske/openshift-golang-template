package main

import (
	"fmt"
	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/fasthttp"
	"github.com/labstack/echo/middleware"
	"gopkg.in/pg.v4"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

type (
	JSONTime time.Time

	Mood struct {
		Value int `json:"mood"`
	}

	Subscription struct {
		Email string `json:"email"`
		TeamId int64 `json:"teamId"`
	}

	UserCreation struct {
		Email string `json:"email"`
		Password string `json:"password"`
	}

	Login struct {
		Email string `json:"email"`
		Password string `json:"password"`
	}

	TeamCreation struct {
		Name string  `json:"name"`
		EmailCron string `json:"emailCron"`
		UserId int64 `json:"userId"`
	}

	JsonResponse struct {
		StatusCode int    `json:"statusCode"`
		Text       string `json:"text"`
	}

	MoodFeedback struct {
		Mood string `json:"mood"`
	}

	DailyMoodsJson struct {
		Date  JSONTime  `json:"date"`
		Moods []float64 `json:"moods"`
	}

	Authentication struct {
		Token  string  `json:"token"`
	}
)

func (t JSONTime) MarshalJSON() ([]byte, error) {
	stamp := fmt.Sprintf("\"%s\"", time.Time(t).Format("02-01-2006"))
	return []byte(stamp), nil
}

func (subscription *Subscription) isValid() bool {
	return subscription.Email != ""
}

func (userCreation *UserCreation) isValid() bool {
	return userCreation.Email != "" && userCreation.Password != ""
}

func (teamCreation *TeamCreation) isValid() bool {
	return teamCreation.Name != "" && teamCreation.UserId != 0 && teamCreation.EmailCron != ""
}

func (login *Login) isValid() bool {
	return login.Email != "" && login.Password != ""
}

var adminUser = os.Getenv("ADMIN_USER")
var adminPassword = os.Getenv("ADMIN_PASSWORD")
var newRelicKey = os.Getenv("NEW_RELIC_KEY")

func main() {
	postgresDatabase := createDatabase()
	defer postgresDatabase.Close()

	runMigrations()

	createCronJob(triggerMail())

	server := initServer()

	bind := getBind()
	log.Println("Starting server on bind " + bind + ".")
	server.Run(fasthttp.New(bind))
}

func getBind() string {
	if os.Getenv("OPENSHIFT_GO_PORT") != "" {
		return fmt.Sprintf("%s:%s", os.Getenv("OPENSHIFT_GO_IP"), os.Getenv("OPENSHIFT_GO_PORT"))
	} else {
		return ":8081"
	}
}

func initServer() (server *echo.Echo) {
	server = echo.New()

	InitNewRelicAgent(newRelicKey, "HardMood-Live", true)
	server.Use(middleware.Logger(), NewRelicHandler(), middleware.Recover())
	server.SetHTTPErrorHandler(jsonErrorHandler)

	group := server.Group("/admin", middleware.BasicAuth(isAdmin))
	group.Get("/subscribers", getAdminSubscriber)

	server.GET("/json/subscribers", getSubscribers)
	server.DELETE("/json/subscribers/:id", deleteSubscribersByUuid)
	server.POST("/json/subscribers", postSubscriber)
	server.GET("/json/moods/:id/:limit", getDailyMoods)
	server.POST("/json/moods/:id", postDailyMoods)
	server.POST("/json/users", postUser)
	server.POST("/json/users/login", postLoginUser)
	server.POST("/json/teams", postTeam)

	server.File("/", "public/index.html")
	server.File("/googlef6a1c30cc4b3aa6e.html", "public/googlef6a1c30cc4b3aa6e.html")
	server.File("/login", "public/login.html")
	server.File("/evaluation", "public/evaluation.html")
	server.File("/moods/:key", "public/moodForm.html")
	server.Static("static", "static")

	return server
}

func isAdmin(user string, password string) bool {
	return user == adminUser && password == adminPassword
}

func getAdminSubscriber(context echo.Context) error {
	return context.File("public/manageSubscriber.html")
}

func jsonErrorHandler(error error, context echo.Context) {
	log.Printf("Error during http request to %s caused error '%s'\n", context.Path(), error.Error())
	statusCode := http.StatusInternalServerError
	text := http.StatusText(statusCode)

	if httpError, ok := error.(*echo.HTTPError); ok {
		statusCode = httpError.Code
		text = httpError.Message
	}

	if !context.Response().Committed() {
		if strings.Contains(text, "invalid basic-auth authorization header=") {
			context.Response().Header().Set(echo.HeaderWWWAuthenticate, "Basic realm=Restricted")
			context.NoContent(echo.ErrUnauthorized.Code)
		} else {
			context.JSON(statusCode, JsonResponse{statusCode, text})
		}
	}
}

func getDailyMoods(context echo.Context) error {
	teamId := context.Param("id")
	limit, _ := strconv.Atoi(context.Param("limit"))
	dailyMoods, databaseError := getAllDailyMoods(teamId, limit)

	if databaseError != nil {
		return databaseError
	} else {
		dailyMoods = reverse(dailyMoods)
		dailyMoodsJson := []DailyMoodsJson{}
		for _, dailyMood := range dailyMoods {
			dailyMoodsJson = append(dailyMoodsJson, *dailyMood.ToJsonModel())
		}

		return context.JSON(http.StatusOK, dailyMoodsJson)
	}
}

func reverse(moods []DailyMoods) []DailyMoods {
	for i, j := 0, len(moods)-1; i < j; i, j = i+1, j-1 {
		moods[i], moods[j] = moods[j], moods[i]
	}
	return moods
}

func postDailyMoods(context echo.Context) error {
	key := context.Param("id")
	moodFeedback := new(MoodFeedback)

	if jsonError := context.Bind(moodFeedback); jsonError != nil {
		return jsonError
	} else {
		if feedbackIdentifier := getFeedbackIdentifier(key); feedbackIdentifier != nil {

			if databaseError := updateDailyMoods(feedbackIdentifier.DailyMoodsId, moodFeedback); databaseError != nil {
				return databaseError
			} else {
				return context.JSON(http.StatusCreated, JsonResponse{http.StatusCreated, "Thank you!"})
			}
		} else {
			return echo.NewHTTPError(http.StatusNotFound, "Did you vote already? Mood with key '"+key+"' not found!")
		}
	}
}

func getSubscribers(context echo.Context) error {
	subscribers, databaseError := getAllSubscribers()

	if databaseError != nil {
		return databaseError
	} else {
		return context.JSON(http.StatusOK, subscribers)
	}
}

func deleteSubscribersByUuid(context echo.Context) error {
	id, _ := strconv.Atoi(context.Param("id"))
	databaseError := deleteSubscriberById(int64(id))

	if databaseError != nil {
		if databaseError == pg.ErrNoRows {
			return echo.NewHTTPError(http.StatusNotFound, fmt.Sprintf("User with id '%d' not found!", id))
		} else {
			return databaseError
		}
	} else {
		return context.NoContent(http.StatusNoContent)
	}
}

func postSubscriber(context echo.Context) error {
	subscription := new(Subscription)

	if jsonError := context.Bind(subscription); jsonError != nil {
		return jsonError
	} else if subscription.isValid() {
		subscriber, databaseError := saveSubscriber(subscription)

		if databaseError != nil {
			return databaseError
		} else {
			return context.JSON(http.StatusCreated, subscriber)
		}
	} else {
		return echo.NewHTTPError(http.StatusBadRequest, "Email field was empty!")
	}
}

//http -v --json POST :8081/json/users password=John email=john@example.org
func postUser(context echo.Context) error {
	userCreation := new(UserCreation)

	if jsonError := context.Bind(userCreation); jsonError != nil {
		return jsonError
	} else if userCreation.isValid() {
		user, databaseError := saveUser(userCreation)

		if databaseError != nil {
			return databaseError
		} else {
			return context.JSON(http.StatusCreated, user)
		}
	} else {
		return echo.NewHTTPError(http.StatusBadRequest, "Email field or password field was empty!")
	}
}

//http -v --json POST :8081/json/users/login password=John email=john@example.org
func postLoginUser(context echo.Context) error {
	login := new(Login)

	if jsonError := context.Bind(login); jsonError != nil {
		return jsonError
	} else if login.isValid() {
		if isCorrectLogin(login) {
			authentication := new(Authentication)
			authentication.Token = "123abc"
			return context.JSON(http.StatusCreated, authentication)
		} else {
			return echo.NewHTTPError(http.StatusUnauthorized, "Invalid credentials!")
		}
	} else {
		return echo.NewHTTPError(http.StatusBadRequest, "Email field or password field was empty!")
	}
}

//http -v --json POST :8081/json/teams name=Team2 emailCron="* * * * * ?" userId:=1
func postTeam(context echo.Context) error {
	teamCreation := new(TeamCreation)

	if jsonError := context.Bind(teamCreation); jsonError != nil {
		return jsonError
	} else if teamCreation.isValid() {
		team, databaseError := saveTeam(teamCreation)

		if databaseError != nil {
			return databaseError
		} else {
			return context.JSON(http.StatusCreated, team)
		}
	} else {
		return echo.NewHTTPError(http.StatusBadRequest, "Name field, email cron field or user id field was empty!")
	}
}
