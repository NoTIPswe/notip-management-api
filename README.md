# notip-management-api
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=NoTIPswe_notip-management-api&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=NoTIPswe_notip-management-api)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=NoTIPswe_notip-management-api&metric=coverage)](https://sonarcloud.io/summary/new_code?id=NoTIPswe_notip-management-api)

Servizio `NestJS` per la gestione tenant, utenti, gateway e configurazioni della piattaforma NoTIP.

## Requisiti

- `Node.js` e `npm`
- un database configurato per l'applicazione
- `Keycloak` raggiungibile, usato per autenticazione e impersonation
- per gli smoke test: `curl` e `jq`

## Avvio rapido

Installazione dipendenze:

```bash
npm install
```

Avvio in sviluppo:

```bash
npm run start:dev
```

Build produzione:

```bash
npm run build
npm run start:prod
```

## Quality checks

Lint:

```bash
npm run lint:check
```

Type check:

```bash
npm run typecheck
```

Test unitari:

```bash
npm test
```

Test e2e:

```bash
npm run test:e2e
```

## Endpoint utili

- `GET /` verifica base del servizio
- `GET /auth/me` ritorna il profilo autenticato
- `POST /auth/impersonate` esegue token exchange per `system_admin`
- `GET /admin/tenants` e `POST /admin/tenants` per gestione tenant
- `GET /admin/gateways` e `POST /admin/gateways` per gestione gateway lato admin
- `GET /gateways` per gateway del tenant corrente

Per una panoramica più ampia degli endpoint coperti lato integrazione, vedi lo script [scripts/test/smoke-all-endpoints.sh](/home/aless/notip-management-api/scripts/test/smoke-all-endpoints.sh).

## Smoke test degli endpoint

Il repository include lo script [scripts/test/smoke-all-endpoints.sh](/home/aless/notip-management-api/scripts/test/smoke-all-endpoints.sh), utile per una validazione rapida end-to-end dell'API contro un ambiente locale o condiviso.

Cosa verifica:

- autenticazione e `GET /auth/me`
- amministrazione tenant e gateway
- operazioni tenant su gateway, utenti, chiavi e soglie
- alerts, audit log, costi, API clients e command endpoints
- protezioni cross-tenant e blocchi in impersonation

Esecuzione:

```bash
bash scripts/test/smoke-all-endpoints.sh
```

Variabili supportate dallo script:

- `API_URL` default `http://localhost:3000`
- `KC_URL` default `http://localhost:8080`
- `REALM` default `notip`
- `CLIENT_ID`
- `CLIENT_SECRET`
- `SYS_USER`
- `SYS_PWD`
- `CURL_TIMEOUT`
- `CURL_CONNECT_TIMEOUT`
- `RUN_ID`

Esempio con override espliciti:

```bash
API_URL=http://localhost:3000 \
KC_URL=http://localhost:8080 \
CLIENT_ID=notip-mgmt-backend \
CLIENT_SECRET=your-secret \
bash scripts/test/smoke-all-endpoints.sh
```

Note operative:

- lo script crea fixture temporanee per tenant, utenti e gateway
- a fine esecuzione prova a fare cleanup delle risorse create
- richiede un ambiente coerente con Keycloak configurato e raggiungibile
- in caso di errore mostra lo status HTTP atteso/ricevuto e il body della risposta

## OpenAPI

Per rigenerare la specifica OpenAPI:

```bash
npm run generate:openapi
```

## Migrazioni

Generazione migration:

```bash
npm run migration:generate -- src/database/migrations/<nome-migration>
```

Esecuzione migration:

```bash
npm run migration:run
```

Rollback migration:

```bash
npm run migration:revert
```
