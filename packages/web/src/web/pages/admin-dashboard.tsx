import { useState, type ReactNode } from "react";
import {
  Crown,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Download,
  Eye,
  Users,
  CheckCheck,
  Sparkles,
  LockKeyhole,
  BarChart3,
  MessageSquare,
  Package,
  Clock3,
} from "lucide-react";
import { useAdminSession, useAdminStats, useAdminLogin, useAdminLogout } from "../queries/admin";
import { supplies } from "./content";
import { RosterAdmin } from "../components/roster-admin";
import type { RouterOutputs } from "@orpc/server";
import type { AppRouter } from "../../api";

type Stats = RouterOutputs<AppRouter>["admin"]["stats"];
const sections: Record<string, string> = {
  top: "Афиша",
  manifest: "Концепция",
  zones: "Карта зон",
  scenario: "Сценарий",
  roles: "Роли",
  code: "Кодекс",
  missions: "Миссии",
  food: "Стол",
  supplies: "Реквизит",
  gallery: "Галерея",
  vote: "Голосование",
  faq: "Вопросы",
};
const actions: Record<string, string> = {
  mission: "Вытянуть миссию",
  gallery: "Увеличить фото",
  act: "Открыть / закрыть акт",
  cta: "Перейти к участию",
  against: "Кнопка «Против»",
};
const devices: Record<string, string> = {
  desktop: "Компьютер",
  mobile: "Телефон",
  tablet: "Планшет",
};
const date = (value: number) =>
  new Date(value).toLocaleString("ru-RU", {
    timeZone: "Europe/Moscow",
    dateStyle: "short",
    timeStyle: "short",
  });
const today = () => new Date(Date.now() + 3 * 3600000).toISOString().slice(0, 10);
const daysAgo = (days: number) =>
  new Date(Date.now() + 3 * 3600000 - days * 86400000).toISOString().slice(0, 10);
function Panel({
  title,
  note,
  children,
  id,
}: {
  title: string;
  note?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="admin-panel" id={id}>
      <div className="admin-panel-title">
        <h2>{title}</h2>
        {note && <span>{note}</span>}
      </div>
      {children}
    </section>
  );
}
function Bars({
  rows,
  names = {},
}: {
  rows: { label: string; count: number }[];
  names?: Record<string, string>;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return rows.length ? (
    <div className="metric-bars">
      {rows.map((row) => (
        <div key={row.label}>
          <div>
            <span>{names[row.label] || row.label}</span>
            <b>{row.count}</b>
          </div>
          <div className="metric-track">
            <i style={{ width: `${(row.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="admin-empty">Пока нет данных за этот период.</p>
  );
}
function csv(stats: Stats) {
  const rows: (string | number)[][] = [
    ["Раздел", "Показатель", "Значение"],
    ["Период", "Начало", stats.from],
    ["Период", "Конец", stats.to],
    ["Период", "Часовой пояс", "Europe/Moscow"],
  ];
  const labels: Record<string, string> = {
    visits: "Посещения",
    unique: "Уникальные браузеры",
    votes: "Голоса ЗА",
    conversion: "Конверсия, %",
    missions: "Выданные демо-миссии",
    comments: "Записки",
    rolePeople: "Браузеры с выбранной ролью",
    supplyItems: "Обещанные виды реквизита",
    averageSeconds: "Среднее активное время, сек",
  };
  Object.entries(stats.overview).forEach(([name, value]) =>
    rows.push(["Итоги", labels[name], value]),
  );
  stats.daily.forEach((d) => {
    rows.push(
      ["По дням", d.date + " / посещения", d.visits],
      ["По дням", d.date + " / браузеры", d.unique],
      ["По дням", d.date + " / голоса", d.votes],
    );
  });
  for (const [title, items, mapping] of [
    ["Источники", stats.sources, {}],
    ["Устройства", stats.devices, devices],
    ["Браузеры", stats.browsers, {}],
    ["Кампании", stats.campaigns, {}],
    ["Разделы", stats.sections, sections],
    ["Действия", stats.actions, actions],
    ["Роли", stats.roles, {}],
    ["Реквизит", stats.supplies, Object.fromEntries(supplies.map((name, i) => [String(i), name]))],
  ] as const)
    items.forEach((item) =>
      rows.push([title, (mapping as Record<string, string>)[item.label] || item.label, item.count]),
    );
  stats.comments.forEach((c) => rows.push(["Записки", date(c.createdAt), c.text]));
  // Защита от формул при открытии пользовательских записок в Excel.
  const cell = (value: string | number) => {
    let text = String(value);
    if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const blob = new Blob(["﻿" + rows.map((row) => row.map(cell).join(";")).join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `nebylitsy-analytics-${stats.from}-${stats.to}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const login = useAdminLogin();
  return (
    <main className="admin-login">
      <a href="/" className="admin-back">
        <ArrowLeft size={16} /> Вернуться в периметр
      </a>
      <div className="login-frame ornate">
        <Crown size={38} />
        <span className="eyebrow">КАБИНЕТ ОРГАНИЗАТОРА</span>
        <h1>
          За кулисами
          <br />
          <em>проекта.</em>
        </h1>
        <p>Метрики, голоса и весь наш контролируемый хаос. Вход только для администратора.</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await login.mutateAsync({ username: username.trim(), password });
              setPassword("");
            } catch {
              /* Ошибка отображается ниже. */
            }
          }}
        >
          <label htmlFor="admin-username">ЛОГИН</label>
          <input
            id="admin-username"
            aria-label="Логин администратора"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            maxLength={30}
          />
          <label htmlFor="admin-password">ПАРОЛЬ</label>
          <input
            id="admin-password"
            aria-label="Пароль администратора"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="button gold" disabled={login.isPending}>
            {login.isPending ? "ОТКРЫВАЕМ СЕЙФ…" : "ВОЙТИ В КАБИНЕТ"}
            <LockKeyhole size={16} />
          </button>
          {login.error && (
            <p className="admin-error" role="alert">
              {login.error.message}
            </p>
          )}
        </form>
        <span className="login-note">Закрытая регистрация · защищённая серверная сессия</span>
      </div>
    </main>
  );
}
function Dashboard({ name }: { name: string }) {
  const [range, setRange] = useState({ from: daysAgo(29), to: today() });
  const [draft, setDraft] = useState(range);
  const stats = useAdminStats(range.from, range.to);
  const logout = useAdminLogout();
  const data = stats.data;
  const presets = (days: number) => {
    const next = { from: daysAgo(days - 1), to: today() };
    setDraft(next);
    setRange(next);
  };
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="brand" href="/">
          <Crown size={27} />
          <span>
            ОСОБНЯК
            <br />
            <strong>НЕБЫЛИЦЫ</strong>
          </span>
        </a>
        <div className="admin-side-label">ЗА КУЛИСАМИ СЕЗОНА</div>
        <nav aria-label="Навигация кабинета">
          <a href="#admin-overview">
            <BarChart3 size={17} /> Обзор сезона
          </a>
          <a href="#admin-traffic">
            <Eye size={17} /> Посещения
          </a>
          <a href="#admin-engagement">
            <Sparkles size={17} /> Вовлечённость
          </a>
          <a href="#admin-participation">
            <Users size={17} /> Участники и роли
          </a>
          <a href="#admin-roster"><Users size={17} /> Анкеты / ответственные / бейджи</a>
          <a href="#admin-supplies">
            <Package size={17} /> Реквизит
          </a>
          <a href="#admin-comments">
            <MessageSquare size={17} /> Сейф претензий
          </a>
        </nav>
        <div className="admin-sidebar-bottom">
          <span>
            <LockKeyhole size={14} /> {name} · администратор
          </span>
          <a href="/">
            <ArrowLeft size={15} /> На сайт
          </a>
          <button disabled={logout.isPending} onClick={() => logout.mutate()}>
            <LogOut size={15} /> {logout.isPending ? "Выходим…" : "Выйти"}
          </button>
          {logout.error && <p className="admin-error">{logout.error.message}</p>}
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-page-header">
          <div>
            <span className="eyebrow">СЕЗОН «ВЫГОРАНИЕ» · КАБИНЕТ АДМИНИСТРАТОРА</span>
            <h1>
              Периметр <em>в цифрах.</em>
            </h1>
            <p>Без выдуманных метрик. Только то, что произошло на сайте.</p>
          </div>
          <a href="/" className="admin-mobile-back">
            <ArrowLeft size={16} /> На сайт
          </a>
        </header>
        <div className="admin-filters">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.from <= draft.to) setRange(draft);
            }}
          >
            <label>
              С{" "}
              <input
                aria-label="Дата начала"
                type="date"
                required
                value={draft.from}
                onChange={(e) => setDraft({ ...draft, from: e.target.value })}
              />
            </label>
            <label>
              ПО{" "}
              <input
                aria-label="Дата окончания"
                type="date"
                required
                value={draft.to}
                min={draft.from}
                onChange={(e) => setDraft({ ...draft, to: e.target.value })}
              />
            </label>
            <button className="button ghost" disabled={stats.isFetching}>
              ПРИМЕНИТЬ
            </button>
          </form>
          <div className="date-presets">
            <button onClick={() => presets(1)}>Сегодня</button>
            <button onClick={() => presets(7)}>7 дней</button>
            <button onClick={() => presets(30)}>30 дней</button>
            <button
              disabled={!data?.collectedSince}
              onClick={() => {
                if (data?.collectedSince) {
                  const next = {
                    from: new Date(data.collectedSince + 3 * 3600000).toISOString().slice(0, 10),
                    to: today(),
                  };
                  setDraft(next);
                  setRange(next);
                }
              }}
            >
              Всё время
            </button>
          </div>
          <div className="admin-tools">
            <button
              aria-label="Обновить аналитику"
              disabled={stats.isFetching}
              onClick={() => void stats.refetch()}
            >
              <RefreshCw size={16} className={stats.isFetching ? "spin" : ""} />
            </button>
            <button disabled={!data || stats.isFetching} onClick={() => data && csv(data)}>
              <Download size={15} /> CSV
            </button>
          </div>
        </div>
        <p className="admin-range-note">
          Часовой пояс — Москва. Автообновление каждые 30 секунд.{" "}
          {data && <>Данные на {date(data.refreshedAt)}.</>}
        </p>
        <RosterAdmin from={range.from} to={range.to} />
        {stats.isPending && <div className="admin-loading">Открываем сейф аналитики…</div>}
        {stats.isError && (
          <div className="admin-error" role="alert">
            Не удалось загрузить аналитику. Проверьте соединение или войдите заново.
            <button className="text-link" onClick={() => void stats.refetch()}>
              Повторить
            </button>
          </div>
        )}
        {data && !stats.isError && (
          <>
            <section id="admin-overview" className="admin-kpis">
              {[
                [Eye, "Посещения", data.overview.visits, "Загрузки страницы"],
                [Users, "Уникальные браузеры", data.overview.unique, "Не равно числу людей"],
                [CheckCheck, "Голоса «ЗА»", data.overview.votes, "Один голос на браузер"],
                [
                  BarChart3,
                  "Конверсия в голос",
                  `${data.overview.conversion.toFixed(1)}%`,
                  "Из посетителей периода",
                ],
                [Sparkles, "Миссии выданы", data.overview.missions, "Нажатия генератора"],
                [
                  Clock3,
                  "Активное время",
                  `${Math.floor(data.overview.averageSeconds / 60)}м ${data.overview.averageSeconds % 60}с`,
                  "Среднее по посещениям",
                ],
                [Users, "Выбрали роль", data.overview.rolePeople, "Браузеры с выбранной ролью"],
                [
                  MessageSquare,
                  "Записки в сейфе",
                  data.overview.comments,
                  "Видны только администратору",
                ],
              ].map(([Icon, title, value, note], i) => {
                const I = Icon as typeof Eye;
                return (
                  <article key={i}>
                    <div>
                      <span>{title as string}</span>
                      <I size={17} />
                    </div>
                    <strong>{value as string | number}</strong>
                    <small>{note as string}</small>
                  </article>
                );
              })}
            </section>
            <Panel title="Хроника сезона" note="Посещения / голоса · по дням" id="admin-traffic">
              {data.daily.length ? (
                <div className="daily-chart">
                  {data.daily.map((d) => {
                    const max = Math.max(1, ...data.daily.map((x) => Math.max(x.visits, x.votes)));
                    return (
                      <div
                        key={d.date}
                        title={`${d.date}: ${d.visits} посещений, ${d.unique} браузеров, ${d.votes} голосов`}
                      >
                        <div className="daily-bars">
                          <i
                            style={{
                              height: `${Math.max(d.visits ? 2 : 0, (d.visits / max) * 100)}%`,
                            }}
                          />
                          <b
                            style={{
                              height: `${Math.max(d.votes ? 2 : 0, (d.votes / max) * 100)}%`,
                            }}
                          />
                        </div>
                        <small>{d.date.slice(5).split("-").reverse().join(".")}</small>
                        <span>
                          {d.visits} / {d.votes}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="admin-empty">Первое посещение откроет сезон статистики.</p>
              )}
              <div className="chart-legend">
                <span>Посещения</span>
                <span>Голоса «ЗА»</span>
              </div>
            </Panel>
            <div className="admin-grid three">
              <Panel title="Откуда пришли" note="UTM source / referrer">
                <Bars rows={data.sources} />
              </Panel>
              <Panel title="Устройства">
                <Bars rows={data.devices} names={devices} />
              </Panel>
              <Panel title="Браузеры">
                <Bars rows={data.browsers} />
              </Panel>
            </div>
            <div className="admin-grid">
              <Panel title="Что смотрели" note="Раздел один раз за посещение" id="admin-engagement">
                <Bars rows={data.sections} names={sections} />
              </Panel>
              <Panel title="Что нажимали" note="Все зарегистрированные клики">
                <Bars rows={data.actions} names={actions} />
                <div className="admin-panel-divider" />
                <h3 className="admin-small-heading">UTM-кампании</h3>
                <Bars rows={data.campaigns} />
              </Panel>
            </div>
            <Panel
              title="История анонимного кастинга"
              note="Прежние заявки без имён; новые — в блоке выше"
              id="admin-participation"
            >
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Роль</th>
                      <th>Желающих</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      "Ведущий Лобного",
                      "«Ксюша» и «Оля»",
                      "Хранитель кукол",
                      "Оператор исповеди",
                      "Хранитель сейфа",
                      "Участник проекта",
                    ].map((role) => {
                      const count = data.roles.find((r) => r.label === role)?.count || 0;
                      return (
                        <tr key={role}>
                          <td>{role}</td>
                          <td>{count}</td>
                          <td>
                            <span className={count ? "admin-tag" : "admin-tag muted"}>
                              {count ? "Есть добровольцы" : "Открыт кастинг"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Panel>
            <Panel
              title="История анонимного реквизита"
              note={`${data.overview.supplyItems} из 10 видов обещано`}
              id="admin-supplies"
            >
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Реквизит</th>
                      <th>Обещали принести</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplies.map((item, i) => {
                      const count = data.supplies.find((r) => r.label === String(i))?.count || 0;
                      return (
                        <tr key={item}>
                          <td>{item}</td>
                          <td>{count}</td>
                          <td>
                            <span className={count ? "admin-tag" : "admin-tag muted"}>
                              {count ? "Обещано" : "Нужно найти"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="admin-explanation">
                Отметка означает обещание принести, а не фактическое наличие. Если человек снимет
                свою отметку, список обновится. Данные фильтруются по дате текущего обещания.
              </p>
            </Panel>
            <Panel
              title="Сейф анонимных претензий"
              note="Без имён · только для организатора"
              id="admin-comments"
            >
              {data.comments.length ? (
                <div className="admin-comments">
                  {data.comments.map((comment, i) => (
                    <article key={i}>
                      <span>
                        ЗАПИСКА {String(i + 1).padStart(2, "0")}{" "}
                        <time>{date(comment.createdAt)}</time>
                      </span>
                      <p>{comment.text}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="admin-empty">Сейф пока молчит. Возможно, все заняты тортом.</p>
              )}
            </Panel>
            <div className="admin-footnote">
              <LockKeyhole size={17} />
              <p>
                Сбор начался {data.collectedSince ? date(data.collectedSince) : "после подключения"}
                . Старое локальное демо не импортировано. Уникальность определяется браузером, не
                личностью. Активное время приблизительное, с шагом 15 секунд; короткие посещения
                могут иметь 0 секунд. Админ-кабинет не учитывается в посещениях. Роли и реквизит —
                текущие отметки, а не исторический журнал.
              </p>
            </div>
          </>
        )}
        {logout.error && <p className="admin-error">{logout.error.message}</p>}
        <button
          className="admin-mobile-logout"
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <LogOut size={16} /> Выйти из кабинета
        </button>
      </main>
    </div>
  );
}
export default function AdminPage() {
  const session = useAdminSession();
  if (session.isPending) return <main className="admin-loading">Проверяем доступ к кабинету…</main>;
  if (!session.data || session.isError) return <Login />;
  return <Dashboard name={session.data.name} />;
}
