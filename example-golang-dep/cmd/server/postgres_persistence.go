package main

import (
	"crypto/sha1"
	"encoding/hex"
	"fmt"
	"gopkg.in/pg.v4"
	"log"
	"os"
	"strings"
	"time"
)

type (
	FeedbackIdentifier struct {
		TableName struct{} `sql:"feedback_identifiers"`

		Id           int64
		Key          string
		DailyMoodsId int64
	}

	DailyMoods struct {
		TableName struct{} `json:"-" sql:"daily_moods"`

		Id    int64     `json:"-"`
		Date  time.Time `json:"date"`
		Moods []float64 `json:"moods" pg:",array"`
		TeamId int64     `json:"-"`
	}

	Subscriber struct {
		TableName struct{} `json:"-" sql:"subscribers"`

		Id    int64  `json:"uuid"`
		Email string `json:"email"`
		TeamId int64     `json:"-"`
	}

	User struct {
		TableName struct{} `json:"-" sql:"users"`

		Id    int64     `json:"uuid"`
		Email string    `json:"email"`
		Password string `json:"-"`
	}

	Team struct {
		TableName struct{} `json:"-" sql:"teams"`

		Id    int64      `json:"uuid"`
		Name string      `json:"name"`
		EmailCron string `json:"emailCron"`
	}

	TeamMember struct {
		TableName struct{} `json:"-" sql:"team_members"`

		Id    int64      `json:"uuid"`
		Admin  bool      `json:"admin"`
		TeamId int64     `json:"-"`
		UserId int64     `json:"-"`
	}
)

var database *pg.DB

func (dailyMoods *DailyMoods) ToJsonModel() (dailyMoodsJson *DailyMoodsJson) {
	dailyMoodsJson = new(DailyMoodsJson)
	dailyMoodsJson.Date = JSONTime(dailyMoods.Date)
	dailyMoodsJson.Moods = dailyMoods.Moods

	return dailyMoodsJson
}

func saveUser(userCreation *UserCreation) (user *User, databaseError error) {
	user = new(User)
	user.Email = userCreation.Email
	user.Password = createHash(userCreation.Email + userCreation.Password)
	databaseError = database.Create(user)

	//TODO: Find all existing subscribers with the email of the user and add this user as a team member

	return user, databaseError
}

func saveTeam(teamCreation *TeamCreation) (team *Team, databaseError error) {
	team = new(Team)
	team.Name = teamCreation.Name
	team.EmailCron = teamCreation.EmailCron

	databaseError = database.Create(team)

	if (databaseError == nil) {
		teamMember := new(TeamMember)
		teamMember.Admin = true
		teamMember.UserId = teamCreation.UserId
		teamMember.TeamId = team.Id

		databaseError = database.Create(teamMember)
	}

	return team, databaseError
}

func saveDailyMoods(date time.Time) (dailyMoods *DailyMoods, databaseError error) {
	dailyMoods = new(DailyMoods)
	checkError := database.Model(dailyMoods).Where("date = ?", date).Select()


	if checkError == pg.ErrNoRows {
		dailyMoods.Date = date
		dailyMoods.TeamId = 1
		databaseError = database.Create(dailyMoods)
	} else {
		log.Println("Daily moods for this day already exists.")
	}

	return dailyMoods, databaseError
}

func updateDailyMoods(dailyMoodsId int64, moodFeedback *MoodFeedback) (databaseError error) {
	_, databaseError = database.Exec("UPDATE daily_moods SET moods = array_append(moods, CAST (? as float)) WHERE id = ?;", moodFeedback.Mood, dailyMoodsId)
	return databaseError
}

func getAllDailyMoods(teamId string, limit int) (dailyMoods []DailyMoods, databaseError error) {
	databaseError = database.Model(&dailyMoods).Where("team_id = ?", teamId).Order("date DESC").Limit(limit).Select()

	return dailyMoods, databaseError
}

func saveSubscriber(subscription *Subscription) (subscriber *Subscriber, databaseError error) {
	subscriber = new(Subscriber)
	subscriber.Email = subscription.Email
	subscriber.TeamId = subscription.TeamId
	databaseError = database.Create(subscriber)

	return subscriber, databaseError
}

func deleteSubscriberById(id int64) (databaseError error) {
	subscriber := new(Subscriber)
	subscriber.Id = id
	databaseError = database.Delete(subscriber)

	return databaseError
}

func getAllSubscribers() (subscribers []Subscriber, databaseError error) {
	databaseError = database.Model(&subscribers).Select()
	return subscribers, databaseError
}

func getFeedbackIdentifier(key string) (feedbackIdentifier *FeedbackIdentifier) {
	database.Exec("SELECT daily_moods_id FROM feedback_identifiers WHERE key = ?", key)

	feedbackIdentifier = new(FeedbackIdentifier)
	databaseError := database.Model(feedbackIdentifier).Where("key = ?", key).Select()

	if databaseError != nil {
		return nil
	}

	databaseError = database.Delete(feedbackIdentifier)

	if databaseError != nil {
		log.Println("Could not delete identifier!")
	}

	return feedbackIdentifier
}

func saveFeedbackIdentifierAndCreateMailTasks(subscribers []Subscriber) (tasks []MailTask, databaseError error) {
	today := time.Now()
	todayAsString := today.Format("02-01-2006")

	dailyMoods, databaseError := saveDailyMoods(today)

	if databaseError != nil {
		log.Printf("Error during saving mood: %v", databaseError)
		return nil, databaseError
	}

	database.Exec("DELETE FROM feedback_identifiers;") // delete previous identifiers

	for _, subscriber := range subscribers {
		key := createKey(subscriber.Id, todayAsString)
		feedbackIdentifier := new(FeedbackIdentifier)
		feedbackIdentifier.Key = key
		feedbackIdentifier.DailyMoodsId = dailyMoods.Id

		databaseError = database.Create(feedbackIdentifier)

		if databaseError != nil {
			log.Printf("Error during saving feedbackIdentifier: %v", databaseError)
			return nil, databaseError
		}

		tasks = append(tasks, MailTask{subscriber.Email, key})
	}

	return tasks, databaseError
}

func isCorrectLogin(login *Login) bool {
	user := new(User)
	databaseError := database.Model(user).Where("email = ?", login.Email).Select()

	if databaseError == nil {
		givenPassword := createHash(login.Email + login.Password)
		return user.Password == givenPassword
	}

	return false
}

func createKey(id int64, dateString string) (key string) {
	source := strings.Join([]string{fmt.Sprintf("%d", id), dateString}, "-")
	return createHash(source)
}

func createHash(source string) (hash string) {
	hashCreator := sha1.New()
	hashCreator.Write([]byte(source))
	hash = hex.EncodeToString(hashCreator.Sum(nil))

	return hash
}

func createDatabase() *pg.DB {
	database = pg.Connect(&pg.Options{
		User:     getDbUser(),
		Password: getDbPassword(),
		Addr:     getDbAddr(),
		Database: getDbName(),
	})

	createSchema()

	return database
}

func createSchema() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS migrations (id bigserial primary key, name text, date date)`,
		`CREATE TABLE IF NOT EXISTS teams (id bigserial primary key, name text, email_cron text)`,
		`CREATE TABLE IF NOT EXISTS users (id bigserial primary key, email text, password text)`,
		`CREATE TABLE IF NOT EXISTS daily_moods (id bigserial primary key, date date, moods float[])`,
		`CREATE TABLE IF NOT EXISTS subscribers (id bigserial primary key, email text)`,
		`CREATE TABLE IF NOT EXISTS feedback_identifiers (id bigserial primary key, key varchar(100), daily_moods_id bigserial references daily_moods(id))`,
		`CREATE TABLE IF NOT EXISTS team_members (id bigserial primary key, admin BOOLEAN NOT NULL DEFAULT FALSE, team_id bigserial references teams(id), user_id bigserial references users(id))`,
	}

	for _, query := range queries {
		if _, queryError := database.Exec(query); queryError != nil {
			log.Fatal(queryError)
		}
	}

	return nil
}

func getDbAddr() string {
	host := "db"
	port := "5432"

	if os.Getenv("OPENSHIFT_POSTGRESQL_DB_HOST") != "" {
		host = os.Getenv("OPENSHIFT_POSTGRESQL_DB_HOST")
	}

	if os.Getenv("OPENSHIFT_POSTGRESQL_DB_PORT") != "" {
		port = os.Getenv("OPENSHIFT_POSTGRESQL_DB_PORT")
	}

	return strings.Join([]string{host, port}, ":")
}

func getDbUser() string {
	user := "postgres"

	if os.Getenv("POSTGRESQL_USER") != "" {
		user = os.Getenv("POSTGRESQL_USER")
	}

	return user
}

func getDbPassword() string {
	password := "postgres"

	if os.Getenv("POSTGRESQL_PASSWORD") != "" {
		password = os.Getenv("POSTGRESQL_PASSWORD")
	}

	return password
}

func getDbName() string {
	dbName := ""

	if os.Getenv("PGDATABASE") != "" {
		dbName = os.Getenv("PGDATABASE")
	}

	return dbName
}
