# Platform — Architecture Microservices

## Structure

```
platform/
  services/
    api-gateway/          ← point d'entrée unique (port 3000)
    auth-service/         ← (à venir)
    inventory-service/    ← (à venir)
    monitoring-service/   ← (à venir)
  shared/
    events/index.js       ← noms canoniques des events RabbitMQ
    utils/logger.js       ← logger JSON structuré
    utils/errors.js       ← format d'erreur standard
  docker-compose.yml
  .env.example
```

## Démarrage rapide

```bash
# 1. Copier et remplir les variables
cp .env.example .env

# 2. Lancer gateway + RabbitMQ
docker-compose up api-gateway rabbitmq

# 3. Vérifier
curl http://localhost:3000/health
# → { "status": "ok", "service": "api-gateway" }

# RabbitMQ Management UI
# → http://localhost:15672  (admin / admin)
```

## Ajouter un service

1. Créer `services/<nom>-service/` avec son propre `package.json` et `Dockerfile`
2. Décommenter son bloc dans `docker-compose.yml`
3. Décommenter sa base Postgres si nécessaire
4. Ajouter une entrée dans `services/api-gateway/src/config/routes.js`

## Communication inter-services

| Cas | Protocole |
|-----|-----------|
| Requête client → réponse immédiate | REST via gateway |
| Event cross-service (création, suppression) | RabbitMQ (noms dans shared/events/) |
| Vérification d'existence cross-service | REST interne (réseau Docker) |
