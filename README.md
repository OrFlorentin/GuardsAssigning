# Sudoku
Assign guards to shifts

## Requirements
- Python 3.8+
- Docker

## Local Setup
Clone this project:
```console
$ git clone https://github.com/OfirKP/GuardsAssigner.git
```

### Deployment
Run all containers (frontend, backend, mongodb, nginx) using _docker-compose_:
```console
$ docker-compose -f docker-compose.dev.yml up -V
```

Once all containers are up, you can insert mock data into the database via the following command:
```
# NOTE: this will remove all data from the database 
$ docker-compose -f docker-compose.dev.yml exec backend python /app/insert_mock_data.py
```

### Environment Variables
To configure to which db the backend server connects the backend server use an .env file.

It contains the following environment variables:
- `DB_CONNECTION_STRING`: The connection string of the database.
- `DB_NAME`: The name of the database.

