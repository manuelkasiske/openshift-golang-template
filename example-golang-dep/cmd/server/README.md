# Hard Mood

## Dev-Setup

- Docker + Docker Compose

### Setup Docker & Docker Compose
``` bash
curl -sSL https://get.docker.com/ | sh
curl -L https://github.com/docker/compose/releases/download/1.7.0/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

#check installation
docker --version
docker-compose --version
```

### Clone Project 
``` bash
git clone https://github.com/manuelkasiske/mutservice.git .
```

### Build Docker Container
```bash
cd /INSIDE/PROJECT/DIRECTORY
docker build -t moodservice .
```

### Running Docker-Go Containers
``` bash
docker-compose up

#Start server
docker exec -ti mood_app_1 bash #(adjust container name!)
cd mutservice
go build && ./mutservice

#Login to db image
docker exec -ti mood_db_1 bash #(adjust container name!)
```

### Restore database
```bash
sudo cp /INSIDE/PROJECT/DIRECTORY/hardmood.2016-05-12.backup.sql.gz ~/postgres && sudo gunzip ~/postgres/hardmood.2016-05-12.backup.sql.gz
docker exec -ti mood_db_1 bash #(adjust container name!)
dropdb -U postgres postgres && createdb -U postgres postgres && psql -U postgres postgres < /var/lib/postgresql/data/hardmood.2016-05-12.backup.sql
```

### Install node dependencies (once)
```bash
cd src
npm install
```

### build views + css + js
```bash
cd src
grunt
```

### Run The Service
``` bash
cd src
grunt startServer
```

## Test The Running Service

### Open Landing Page

http://localhost:8081/

### Run on openshift

    Cartridge-Definition for go1.6: https://cartreflect-claytondev.rhcloud.com/reflect?github=tobyjwebb/openshift-go-cart
    Add Postgres 9.2 support

    Copy file db to new cartridge
    scp app-mut.db xxx@mood-musca.rhcloud.com:/var/lib/openshift/xxx/app-root/data/app-mut.db

    rhc set-env ADMIN_PASSWORD=xxx --app $APP_NAME
    rhc set-env ADMIN_USER=yyy --app $APP_NAME
    rhc set-env MUT_MAILGUN_URL=url --app $APP_NAME
    rhc set-env MUT_BASIC_AUTH=basicauthhash --app $APP_NAME

### SQL backup on openshift

    NOW="$(date +"%Y-%m-%d")"
    FILENAME="$OPENSHIFT_DATA_DIR/$OPENSHIFT_APP_NAME.$NOW.backup.sql.gz"
    pg_dump $OPENSHIFT_APP_NAME | gzip > $FILENAME

---
emoticons from http://www.vecteezy.com/vector-art/89093-emoticon-icon-set