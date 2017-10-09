package main

import (
	"log"
	"gopkg.in/pg.v4"
)

type (
	MigrationFunc func() error
)

func runMigrations() {
	runMigration("addTeamsToSubscribersMigration", addTeamsToSubscribersMigration)
}

func runMigration(name string, migration MigrationFunc) {
	if isAlreadyMigrated(name) {
		log.Printf("Migration '%s' is already done!", name)
	} else {
		migrationError := database.RunInTransaction(func(transaction *pg.Tx) error {
			migrationError := migration()

			if migrationError == nil {
				database.Exec("INSERT INTO migrations (name, date) VALUES (?, now());", name)
				log.Printf("Migration '%s' was succesful!", name)
			}

			return migrationError
		})

		if migrationError != nil {
			log.Fatalf("Migration '%s' failed. Reason: %s", name, migrationError.Error())
		}
	}

}

func addTeamsToSubscribersMigration() (migrationError error) {
	queries := []string{
		`INSERT INTO teams (name, email_cron) VALUES ('WUB', '0 20 09 ? * MON-FRI');`,
		`INSERT INTO users (email, password) VALUES ('kasiske@neofonie.de', '` + createHash("kasiske@neofonie.detest") + `');`,
		`INSERT INTO users (email, password) VALUES ('karsten@neofonie.de', '` + createHash("karsten@neofonie.detest") + `');`,
		`INSERT INTO users (email, password) VALUES ('muecke@neofonie.de', '` + createHash("muecke@neofonie.detest") + `');`,
		`INSERT INTO team_members (admin, team_id, user_id) VALUES (TRUE, 1, 1);`,
		`INSERT INTO team_members (admin, team_id, user_id) VALUES (TRUE, 1, 2);`,
		`INSERT INTO team_members (admin, team_id, user_id) VALUES (TRUE, 1, 3);`,
		`ALTER TABLE subscribers ADD COLUMN team_id integer references teams(id) DEFAULT 1;`,
		`ALTER TABLE daily_moods ADD COLUMN team_id integer references teams(id) DEFAULT 1;`,
	}

	return database.RunInTransaction(func(transaction *pg.Tx) error {
		for _, query := range queries {
			if _, queryError := database.Exec(query); queryError != nil {
				log.Fatal(queryError)
			}
		}

		return nil
	});
}

func isAlreadyMigrated(name string) bool {
	result, _ := database.Exec("SELECT id FROM migrations WHERE name = ?", name)
	return result.Affected() == 1
}

