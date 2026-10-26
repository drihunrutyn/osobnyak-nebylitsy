# App template

Runable copies this Bun and Turborepo project into each new sandbox.

The root package commands are the external contract:

- `bun run dev` starts the web app.
- `bun run dev:desktop` and `bun run dev:mobile` start platform clients.
- `bun run build` builds every package.
- `bun run start` starts or restarts the production server.
- `bun run stop` stops the production server.
- `bun run lint` and `bun run typecheck` validate the project.
- The `db:generate`, `db:migrate`, and `db:push` commands manage the database.

Deployment tools depend on these command names. Their implementations may change, but the names must remain stable.

The web package owns the API, database, and shared web interface. The mobile package is an Expo client. The desktop package is an Electron shell around the web app. Services use the fixed ports defined in `__ports.cjs`, and the web health endpoint is `/api/health`.

Secrets belong in the root `.env` file. Browser values must use the `VITE_` prefix. Commands prefixed with `internal:` are for template maintenance.

## Особняк Небылицы — участие и кабинет

- Анонимные голоса «ЗА» остаются в `event_votes`, отдельно от именных анкет. Идентификатор браузера не подтверждает личность; проверки по имени, ФИО, почте или коду нет.
- Ниже голосования — анкета, где обязательно только имя. Дата начала работы, подпись на бейдже и шутка необязательны. Начало работы и стаж не публикуются.
- Новые роли и реквизит выбираются только после сохранения имени. Старые анонимные отметки сохранены и показаны в `/admin` как история.
- В существующем `/admin` организатор редактирует участников и каталог, назначает и утверждает ответственных, экспортирует анкеты и печатает выбранные бейджи. На бейдже — имя, «смотрящий» либо «АДминЬ» и шутка, без роли.
- «Опубликовать / обновить список» создаёт публичный снимок только утверждённых активных назначений. Последующие правки не меняют снимок до повторной публикации. «Скрыть с сайта» убирает его.
- Архив сохраняет историю, но исключает участника или пункт из новых заявок и новых публикаций.

### Добавочная миграция

Перед первым развёртыванием этой версии на существующей базе выполните из корня:

```sh
bun --env-file=.env migrations/add-roster.ts
```

Скрипт создаёт четыре таблицы `roster_*` и начальный каталог из 7 ролей и 10 предметов. Он не изменяет старые таблицы и не переносит анонимные отметки в именные. Повторный запуск не перезаписывает существующие пункты. Секреты базы берутся только из окружения; для Render используются уже настроенные Environment Variables.

Развёртывание: существующий Docker Web Service Render автоматически собирает ветку `main`. `bun run build` и `bun run lint` — проверки перед отправкой изменений. В этой установке добавочная миграция уже выполнена.
