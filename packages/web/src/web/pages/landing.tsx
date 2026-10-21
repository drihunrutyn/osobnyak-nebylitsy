import { useEffect, useRef, useState, type ReactNode } from "react";
import { useParticipation } from "../queries/event";
import { useEventAnalytics } from "../hooks/use-event-analytics";
import { type ROLE_NAMES } from "../../shared/event";
import {
  ArrowUpRight,
  ArrowDown,
  Crown,
  Sparkles,
  Flame,
  Clock3,
  MapPin,
  Check,
  Menu,
  X,
  Wine,
  LockKeyhole,
  Leaf,
  ChevronRight,
  Send,
  Theater,
} from "lucide-react";
import {
  EVENT_DATE,
  ORG_CHAT,
  IMAGES,
  missions,
  zones,
  acts,
  roles,
  supplies,
  faqs,
} from "./content";

function Heading({
  number,
  tag,
  children,
  sub,
}: {
  number: string;
  tag: string;
  children: ReactNode;
  sub?: string;
}) {
  return (
    <div className="section-heading">
      <div className="eyebrow">
        <span>{number}</span>
        <i />
        {tag}
      </div>
      <h2>{children}</h2>
      {sub && <p>{sub}</p>}
    </div>
  );
}
function Countdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!EVENT_DATE) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const diff = EVENT_DATE ? Math.max(0, new Date(EVENT_DATE).getTime() - now) : null;
  const values =
    diff === null
      ? ["—", "—", "—"]
      : [
          Math.floor(diff / 86400000),
          Math.floor(diff / 3600000) % 24,
          Math.floor(diff / 60000) % 60,
        ];
  return (
    <div className="countdown">
      <span>
        ДО ОТКРЫТИЯ
        <br />
        ПЕРИМЕТРА
      </span>
      {values.map((value, i) => (
        <div key={i}>
          <b>{typeof value === "number" ? String(value).padStart(2, "0") : value}</b>
          <small>{["дней", "часов", "минут"][i]}</small>
        </div>
      ))}
      <small className="date-note">
        {EVENT_DATE ? "Скоро начнётся драма" : "Дату решим всем проектом"}
      </small>
    </div>
  );
}
function GalleryDialog({ image, onClose }: { image: string[]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);
  return (
    <dialog ref={dialog} className="lightbox" aria-label="Иллюстрация концепции" onCancel={onClose}>
      <button aria-label="Закрыть изображение" onClick={onClose}>
        <X size={28} />
      </button>
      <figure>
        <img src={image[0]} alt={image[2]} />
        <figcaption>{image[1]}</figcaption>
      </figure>
    </dialog>
  );
}
export default function Landing() {
  const [menu, setMenu] = useState(false);
  const [mission, setMission] = useState(-1);
  const [flip, setFlip] = useState(false);
  const participation = useParticipation();
  const trackAction = useEventAnalytics();
  const data = participation.state.data;
  const checked = data?.supplies ?? [];
  const votes = data?.votes ?? 0;
  const comments = data?.comments ?? [];
  const selectedRoles = data?.roles ?? [];
  const readyCount = data?.ready.length ?? 0;
  const unavailable = participation.state.isPending || participation.state.isError;
  const [complaint, setComplaint] = useState("");
  const [message, setMessage] = useState("");
  const [against, setAgainst] = useState(false);
  const [gallery, setGallery] = useState<number | null>(null);
  const [mermaidTop, setMermaidTop] = useState(40);
  async function save(action: Promise<unknown>, success: string) {
    try {
      await action;
      setMessage(success);
    } catch {
      setMessage("Не удалось сохранить. Проверьте соединение и попробуйте ещё раз.");
    }
  }
  function toggleRole(role: string, selected: boolean) {
    if (unavailable || participation.role.isPending) return;
    void save(
      participation.role.mutateAsync({ role: role as (typeof ROLE_NAMES)[number], selected }),
      "Выбор роли сохранён в общем сейфе.",
    );
  }
  const galleryItems = [
    [
      IMAGES.poster,
      "Главный герой сезона — пустой трон",
      "Афиша с троном, короной, берёзами и старинными рамами",
    ],
    [
      IMAGES.host,
      "Ведущий. Выгорание на максималках.",
      "Ведущий в бордовом халате и короне из мишуры",
    ],
    [IMAGES.lobnoe, "Старейшины проекта уже заняли места", "Русалка и леший в кругу Лобного места"],
    [
      IMAGES.feast,
      "Торт, который понимает тебя",
      "Праздничный стол и торт «Выгорание — не приговор»",
    ],
    [IMAGES.suitcase, "Социальный пакет изгнанного", "Чемодан, плед и чипсы перед ширмой"],
    [
      IMAGES.forest,
      "Периметр не выпускает. И красиво.",
      "Трон и круг стульев в лесу при тёплом свете гирлянд",
    ],
  ];
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.06 },
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    const onScroll = () =>
      setMermaidTop(
        25 + (window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight)) * 50,
      );
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  useEffect(() => {
    if (gallery === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGallery(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gallery]);
  function drawMission() {
    trackAction("mission");
    const offset = 1 + Math.floor(Math.random() * (missions.length - 1));
    setMission(
      mission < 0
        ? Math.floor(Math.random() * missions.length)
        : (mission + offset) % missions.length,
    );
    setFlip(false);
    requestAnimationFrame(() => setFlip(true));
  }
  const nav = [
    ["manifest", "На Лобное"],
    ["zones", "Зоны"],
    ["scenario", "Сценарий"],
    ["missions", "Миссии"],
    ["food", "Стол"],
    ["supplies", "Реквизит"],
  ];
  return (
    <>
      <a className="skip-link" href="#manifest">
        Перейти к содержанию
      </a>
      <header className="site-header">
        <a href="#top" className="brand">
          <Crown size={24} />
          <span>
            ОСОБНЯК
            <br />
            <strong>НЕБЫЛИЦЫ</strong>
          </span>
        </a>
        <nav aria-label="Главная навигация" className={menu ? "open" : ""}>
          {nav.map(([id, title]) => (
            <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>
              {title}
            </a>
          ))}
        </nav>
        <a href="#vote" className="nav-vote">
          Голосовать <ArrowUpRight size={15} />
        </a>
        <button
          className="menu-button"
          aria-label={menu ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={menu}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main>
        <section className="hero" id="top">
          <div className="hero-scene" style={{ backgroundImage: `url(${IMAGES.hero})` }} />
          <div className="garland" aria-hidden="true">
            {Array.from({ length: 18 }, (_, i) => (
              <i
                key={i}
                style={{
                  animationDelay: `${i * 0.31}s`,
                  top: `${13 + Math.sin((i / 17) * Math.PI) * 20}px`,
                }}
              />
            ))}
          </div>
          <div className="hero-content">
            <div className="hero-kicker">
              <span className="live-dot" /> ВНУТРЕННИЙ КОРПОРАТИВ · НИКАКИХ СЛУЧАЙНЫХ ГОСТЕЙ
            </div>
            <p className="hero-dom">ДОМ 2:</p>
            <h1>
              ОСОБНЯК
              <br />
              НЕБЫЛИЦЫ
            </h1>
            <div className="season">
              <i />
              СЕЗОН «ВЫГОРАНИЕ»
              <i />
            </div>
            <p className="tagline">
              Они просто хотели закрыть смену.
              <br />
              Но периметр не выпускает.
            </p>
            <div className="hero-meta">
              <span>
                <MapPin size={15} /> Санкт-Петербург · наш особняк
              </span>
              <span>
                <Clock3 size={15} /> Дата — на голосовании
              </span>
            </div>
            <div className="hero-actions">
              <a className="button gold" href="#vote">
                ГОЛОСОВАТЬ ЗА <ArrowUpRight size={18} />
              </a>
              <a className="button ghost" href="#scenario">
                Я УЖЕ БОЮСЬ (НО ИДУ)
              </a>
            </div>
            <Countdown />
          </div>
          <div className="hero-bottom">
            <span>4 АДМИНА · 10–15 СМОТРИТЕЛЕЙ · ОДИН ГИГАНТСКИЙ ВЫПУСК</span>
            <a href="#manifest">
              ВНУТРИ ПЕРИМЕТРА <ArrowDown size={16} />
            </a>
            <span>НИ ОДНА КУКЛА НЕ ПОСТРАДАЕТ*</span>
          </div>
        </section>
        <div className="ticker" aria-hidden="true">
          <span>МНЕ ТЯЖЕЛО ОБ ЭТОМ ГОВОРИТЬ</span>
          <b>✦</b>
          <span>НО Я ХОЧУ ТОРТ</span>
          <b>✦</b>
          <span>ВСЕ ОСТАЮТСЯ НА ПРОЕКТЕ</span>
          <b>✦</b>
          <span>ПЕРИМЕТР СЛЫШИТ ВСЁ</span>
        </div>
        <section id="manifest" className="section container reveal">
          <div className="manifest-layout">
            <Heading number="01" tag="КОНЦЕПЦИЯ СЕЗОНА">
              Дорогие участники
              <br />
              проекта…
            </Heading>
            <div className="manifest-copy">
              <p className="lead">
                Это не очередной корпоратив.
                <br />
                Это <em>один гигантский выпуск.</em>
              </p>
              <p>
                Музей-вымысел становится реалити-шоу. А мы — его главными героями. Наконец можно
                высказать всё, что накопилось, сожрать тонну еды и шуточно изгнать друг друга за
                периметр.
              </p>
              <p>
                Говорим с придыханием, паузами и драмой. «Я хочу сказать, что…» — и вот ты уже
                звезда сезона, а не человек, который сегодня объяснял гостю, что русалка не
                настоящая.
              </p>
            </div>
          </div>
          <div className="principles">
            {[
              [
                Flame,
                "Полумрак вместо света",
                "Чтобы не видеть дедлайны. Только свечи, гирлянды и наш внутренний огонь.",
              ],
              [
                Theater,
                "Куклы — участники",
                "Русалка на проекте 300 лет. Без выходных. Ей тоже есть что сказать.",
              ],
              [
                Crown,
                "Чёрное золото и пластик",
                "Барокко, мох и нафталинный китч. Всё, что мы любим, — в одном кадре.",
              ],
              [
                Sparkles,
                "Контролируемое безумие",
                "Строгий сценарий. Нестрогий пафос. Никаких настоящих конфликтов.",
              ],
            ].map(([Icon, title, text], i) => {
              const I = Icon as typeof Flame;
              return (
                <article key={i}>
                  <I size={25} />
                  <h3>{title as string}</h3>
                  <p>{text as string}</p>
                </article>
              );
            })}
          </div>
          <div className="therapy">
            <span className="handwritten">
              Это терапия,
              <br />а не обязаловка.
            </span>
            <p>
              Посмеяться над тем, что болит.
              <br />
              Обожраться при свечах.
              <br />
              <strong>Всё добровольно. Молчание на Лобном — тоже высказывание.</strong>
            </p>
            <span className="therapy-star" aria-hidden="true">
              ✦
            </span>
          </div>
        </section>
        <section id="zones" className="section container reveal">
          <Heading
            number="02"
            tag="КАРТА ПЕРИМЕТРА"
            sub="Шесть зон. Одна территория, где можно наконец выдохнуть."
          >
            Где будет происходить
            <br />
            всё это безобразие
          </Heading>
          <div className="zones-grid">
            {zones.map((zone, i) => (
              <article className="zone-card" key={zone.name}>
                <div className="zone-image">
                  <img
                    src={zone.image}
                    alt={zone.name + " — иллюстрация оформления"}
                    loading="lazy"
                  />
                  <span>ЗОНА 0{i + 1}</span>
                </div>
                <div className="zone-copy">
                  <h3>{zone.name}</h3>
                  <p>{zone.desc}</p>
                  <details>
                    <summary>
                      Как оформим <ChevronRight size={15} />
                    </summary>
                    <p>{zone.decor}</p>
                  </details>
                  <div className="cardboard">{zone.sign}</div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="scenario" className="section scenario-section">
          <div className="container reveal">
            <div className="heading-row">
              <Heading number="03" tag="СЦЕНАРИЙ ВЕЧЕРА">
                Один вечер.
                <br />
                <em>Пять актов драмы.</em>
              </Heading>
              <span className="duration">
                <Clock3 size={18} /> ≈ 3–3,5 часа
                <br />
                <small>включая еду и эмоциональные паузы</small>
              </span>
            </div>
            <div className="timeline">
              {acts.map((act, i) => (
                <div key={act.title}>
                  <details className="act" open={i === 0}>
                    <summary>
                      <span className="act-number">0{i + 1}</span>
                      <div>
                        <span className="eyebrow">
                          АКТ {i + 1} · {act.time}
                        </span>
                        <h3>{act.title}</h3>
                      </div>
                      <span className="act-plus">+</span>
                    </summary>
                    <div className="act-content">
                      <blockquote>«{act.quote}»</blockquote>
                      {act.parts.map(([title, text]) => (
                        <div className="act-part" key={title}>
                          <h4>{title}</h4>
                          <p>{text}</p>
                        </div>
                      ))}
                      <div className="chips">
                        <span>РЕКВИЗИТ АКТА</span>
                        {act.props.map((prop) => (
                          <b key={prop}>{prop}</b>
                        ))}
                      </div>
                    </div>
                  </details>
                  {i === 1 && (
                    <div className="food-break">
                      <Wine size={24} />
                      <div>
                        <b>АНТРАКТ · ВТОРОЙ ЗАХОД ЕДЫ</b>
                        <p>20 минут · горячее, мясо, гарниры. Ешь, как будто завтра опять смена.</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="roles" className="section container reveal">
          <div className="heading-row">
            <Heading
              number="04"
              tag="КАСТИНГ ОТКРЫТ"
              sub="У каждого своя роль. У всех — право на добавку."
            >
              В главных ролях —<br />
              вообще-то мы
            </Heading>
            <a className="text-link" href="#vote">
              Занять роль <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="roles-grid">
            {roles.map(([name, costume, task], i) => (
              <article key={name}>
                <span className="role-num">РОЛЬ 0{i + 1}</span>
                <h3>{name}</h3>
                <span className="costume">{costume}</span>
                <p>{task}</p>
                <a
                  href="#vote"
                  onClick={() => {
                    if (!selectedRoles.includes(name)) toggleRole(name, true);
                  }}
                >
                  Хочу эту роль <ArrowUpRight size={15} />
                </a>
              </article>
            ))}
          </div>
        </section>
        <section id="code" className="section container reveal">
          <div className="code-frame">
            <span className="eyebrow">05 / КОДЕКС ПРОЕКТА</span>
            <Crown size={30} />
            <h2>
              Ругаемся.
              <br />
              <em>Но цивилизованно.</em>
            </h2>
            <p className="lead">
              Никакой реальной ругани.
              <br />
              Все конфликты — гипербола и пародия.
            </p>
            <p>
              Если хочется высказаться по-настоящему — можно начать с «мне тяжело, я на Лобном, я
              хочу сказать». Но боль не обязана становиться комедией. Дослушаем, не обесценим, не
              запишем без согласия.
            </p>
            <div className="code-rules">
              <span>
                <Check size={18} /> Всё добровольно.
                <br />
                Молчание — тоже позиция.
              </span>
              <span>
                <Flame size={18} /> Свет — гирлянды и LED-свечи.
                <br />
                Не поджигаем реквизит.
              </span>
              <span>
                <Theater size={18} /> Куклы — коллеги.
                <br />
                Здороваемся и советуемся.
              </span>
            </div>
          </div>
        </section>
        <section id="missions" className="section mission-section">
          <div className="container mission-layout reveal">
            <div>
              <Heading number="06" tag="СЕКРЕТНЫЕ МИССИИ">
                У всех есть тайна.
                <br />
                <em>У тебя — карточка.</em>
              </Heading>
              <p>
                На входе каждый получает секретное задание. Выполняй незаметно. Или настолько
                драматично, чтобы никто не понял.
              </p>
              <button className="button gold" onClick={drawMission}>
                <Sparkles size={18} /> ВЫТЯНУТЬ МИССИЮ <span className="demo-small">ДЕМО</span>
              </button>
              <p className="footnote">
                Настоящие карточки выдадут на входе.
                <br />
                Эта — просто примерить маску.
              </p>
            </div>
            <div
              className={`mission-card ornate ${flip ? "flipped" : ""}`}
              key={mission}
              aria-live="polite"
            >
              <span className="eyebrow">ОСОБНЯК НЕБЫЛИЦЫ · СТРОГО СЕКРЕТНО</span>
              <LockKeyhole size={36} />
              <span className="handwritten">
                {mission < 0
                  ? "Твоя миссия ждёт"
                  : `Миссия № ${String(mission + 1).padStart(2, "0")}`}
              </span>
              <p>
                {mission < 0
                  ? "Не рассказывай никому. Даже русалке. Она всё передаёт лешему."
                  : missions[mission]}
              </p>
              <div className="mission-seal">
                ДОМ 2<br />
                СЕЗОН «ВЫГОРАНИЕ»
              </div>
            </div>
          </div>
        </section>
        <section id="food" className="section container reveal">
          <div className="food-layout">
            <div className="food-photo ornate">
              <img
                src={IMAGES.feast}
                alt="Тёмный праздничный стол при свечах с тортом «Выгорание — не приговор»"
                loading="lazy"
              />
              <span className="cardboard">ЕДА НЕ ВЫГОРАЕТ</span>
            </div>
            <div>
              <Heading number="07" tag="МУЗЕЙНАЯ ОПИСЬ СЪЕДОБНОГО">
                Мне тяжело об этом
                <br />
                говорить, но…
                <br />
                <em>будет еда.</em>
              </Heading>
              <p className="footnote">Шведский стол / фуршет · бюджетно, щедро, при свечах</p>
              <div className="food-list">
                {[
                  [
                    "I",
                    "Закуски",
                    "Канапе, сырная и мясная нарезка, оливье в стаканчиках, брускетты.",
                  ],
                  ["II", "Горячее", "Запечённое мясо или курица, картофель, овощи гриль."],
                  ["III", "Сладкое", "Торт «ВЫГОРАНИЕ — НЕ ПРИГОВОР». Или «ДОМ 2: СЕЗОН ЗАКРЫТ»."],
                  [
                    "IV",
                    "Напитки",
                    "Шампанское / вино, лимонады, чай. «Слёзы смотрителя» — игристое с лимоном; есть безалкогольная версия.",
                  ],
                  [
                    "V",
                    "Священный реквизит",
                    "Чипсы, сухарики и семечки в мисках. Как на настоящем Лобном.",
                  ],
                ].map(([n, title, text]) => (
                  <div key={n}>
                    <span>{n}</span>
                    <div>
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="vegetarian">
                <Leaf size={17} /> Вегетарианские опции предусмотрены. Голодным не уйдёт никто.
              </p>
            </div>
          </div>
        </section>
        <section id="supplies" className="section supplies-section">
          <div className="container reveal">
            <div className="heading-row">
              <Heading number="08" tag="РЕКВИЗИТ И БЮДЖЕТ">
                Большая драма.
                <br />
                Маленькая смета.
              </Heading>
              <div className="supplies-counter">
                <b>
                  {unavailable ? "—" : readyCount}
                  <span> / 10</span>
                </b>
                <small>СОБРАНО ДЛЯ ПРОЕКТА</small>
              </div>
            </div>
            <progress
              className="progress"
              aria-label="Собранный реквизит"
              value={readyCount}
              max={10}
            />
            <div className="checklist">
              {supplies.map((supply, i) => (
                <label key={supply} className={checked.includes(i) ? "is-checked" : ""}>
                  <input
                    type="checkbox"
                    aria-label={supply}
                    checked={checked.includes(i)}
                    disabled={unavailable || participation.supply.isPending}
                    onChange={() =>
                      void save(
                        participation.supply.mutateAsync({
                          item: i,
                          selected: !checked.includes(i),
                        }),
                        "Реквизит сохранён. Организаторы увидят вашу отметку.",
                      )
                    }
                  />
                  <span>{supply}</span>
                  <small>
                    {checked.includes(i)
                      ? "Я ПРИНЕСУ"
                      : data?.ready.some((r) => r.item === i)
                        ? "УЖЕ ОБЕЩАЛИ"
                        : "НУЖНО"}
                  </small>
                </label>
              ))}
            </div>
            <div className="budget">
              <div>
                <span className="eyebrow">ОБЩИЙ БЮДЖЕТ РЕКВИЗИТА · ПРЕДВАРИТЕЛЬНО</span>
                <strong>
                  1 500–3 000 ₽ <small>+ еда</small>
                </strong>
              </div>
              <p>
                Складываемся всем периметром.
                <br />
                <span>Отметьте, что принесёте вы. Счётчик учитывает весь периметр.</span>
              </p>
            </div>
            {participation.supply.isPending && (
              <output className="data-notice">Сохраняем ваше обещание…</output>
            )}
            {participation.supply.isError && (
              <output className="data-notice">
                Отметка не сохранена. Проверьте соединение и попробуйте ещё раз.
              </output>
            )}
          </div>
        </section>
        <section id="gallery" className="section container reveal">
          <Heading
            number="09"
            tag="ГАЛЕРЕЯ РЕФЕРЕНСОВ"
            sub="Примерно так это будет выглядеть вживую. Иллюстрации концепции, не обещание точного декора."
          >
            Пафос можно
            <br />
            <em>потрогать глазами.</em>
          </Heading>
          <div className="gallery-grid">
            {galleryItems.map(([src, caption, alt], i) => (
              <figure key={src}>
                <button onClick={() => setGallery(i)} aria-label={`Увеличить: ${caption}`}>
                  <img src={src} alt={alt} loading="lazy" />
                  <span>
                    <ArrowUpRight size={20} />
                  </span>
                </button>
                <figcaption>
                  <span>0{i + 1}</span>
                  {caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
        <section id="vote" className="section vote-section">
          <div className="container reveal">
            <div className="vote-layout">
              <div className="vote-intro">
                <Heading number="10" tag="ФИНАЛ СЕЗОНА ЗАВИСИТ ОТ ТЕБЯ">
                  Голосование открыто.
                  <br />
                  <em>
                    Отпираться
                    <br />
                    бессмысленно.
                  </em>
                </Heading>
                <p>
                  Хочешь этот вечер? Опусти свой голос в сейф.
                  <br />
                  Периметр слышит всё.
                </p>
                <div className="vote-image">
                  <img
                    src={IMAGES.votes}
                    alt="Старинный сундук с записками для голосования"
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="vote-form">
                <div className="vote-count">
                  <span>
                    ГОЛОСОВ «ЗА»<small>ОБЩИЙ СЕЙФ ПРОЕКТА</small>
                  </span>
                  <strong aria-live="polite">
                    {unavailable ? "—" : String(votes).padStart(2, "0")}
                  </strong>
                </div>
                <div className="vote-buttons">
                  <button
                    className="button gold"
                    disabled={unavailable || participation.vote.isPending || data?.voted}
                    onClick={() => {
                      void save(
                        participation.vote.mutateAsync({}),
                        "Периметр слышит всё. Голос учтён.",
                      );
                    }}
                  >
                    {participation.vote.isPending
                      ? "СОХРАНЯЕМ…"
                      : data?.voted
                        ? "ВАШ ГОЛОС УЧТЁН"
                        : "ЗА. Я НА ПРОЕКТЕ"}{" "}
                    <Check size={18} />
                  </button>
                  <button
                    className="button against"
                    onClick={() => {
                      setAgainst(!against);
                      trackAction("against");
                    }}
                    aria-expanded={against}
                  >
                    ПРОТИВ
                  </button>
                </div>
                {against && (
                  <output className="against-note">
                    Кнопка в отпуске до конца сезона. Это шутка: участие добровольное, отказ можно
                    сообщить организаторам.
                  </output>
                )}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (complaint.trim() && !participation.comment.isPending) {
                      try {
                        await participation.comment.mutateAsync({ text: complaint.trim() });
                        setComplaint("");
                        setMessage("Претензия в сейфе. Её видите только вы и администратор.");
                      } catch {
                        setMessage(
                          "Не удалось сохранить записку. Попробуйте позже; лимит — 10 записок в час.",
                        );
                      }
                    }
                  }}
                >
                  <label htmlFor="complaint" className="field-label">
                    АНОНИМНАЯ ПРЕТЕНЗИЯ НА ЛОБНОЕ
                  </label>
                  <textarea
                    id="complaint"
                    aria-label="Анонимная претензия на Лобное"
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder="Мне тяжело об этом говорить, но…"
                    maxLength={600}
                    rows={3}
                    required
                  />
                  <div className="submit-row">
                    <span>
                      {participation.comment.isPending
                        ? "Сохраняем записку…"
                        : "Без имён. Без реальной ругани."}
                    </span>
                    <button
                      type="submit"
                      disabled={unavailable || participation.comment.isPending}
                      aria-label="Отправить претензию в сейф"
                    >
                      <Send size={19} />
                    </button>
                  </div>
                </form>
                <fieldset>
                  <legend>ХОЧУ РОЛЬ</legend>
                  <div className="role-options">
                    {roles.map(([role]) => (
                      <label key={role}>
                        <input
                          type="checkbox"
                          aria-label={role}
                          checked={selectedRoles.includes(role)}
                          disabled={unavailable || participation.role.isPending}
                          onChange={() => toggleRole(role, !selectedRoles.includes(role))}
                        />
                        <span>{role}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <a href="#supplies" className="text-link">
                  Принесу реквизит — отметить в списке <ArrowUpRight size={16} />
                </a>
                <output className="form-status">
                  {participation.role.isPending
                    ? "Сохраняем выбранную роль…"
                    : message ||
                      (selectedRoles.length
                        ? "Роли сохранены в общем сейфе."
                        : "Твой голос пока ждёт своего звёздного часа.")}
                </output>
                <p className="demo-disclaimer">
                  Общий серверный сбор: один голос на браузер. Роли, реквизит и записки доступны
                  организатору; чужие записки здесь не публикуются. Для статистики учитываются
                  посещения и действия без имён. Уникальный браузер — не подтверждённый человек.
                  Старое демо не перенесено.
                </p>
                {participation.state.isPending && (
                  <p className="data-notice">Загружаем общий сейф…</p>
                )}
                {participation.state.isError && (
                  <div className="data-notice">
                    <p>Общий сейф недоступен. Голоса не теряем: пока не отправляем.</p>
                    <button
                      className="text-link"
                      onClick={() => void participation.state.refetch()}
                    >
                      Попробовать снова
                    </button>
                  </div>
                )}
              </div>
            </div>
            {comments.length > 0 && (
              <div className="comments">
                <span className="eyebrow">ВАШИ ЗАПИСКИ В СЕЙФЕ · БЕЗ ИМЁН</span>
                {comments.map((comment, i) => (
                  <blockquote key={i}>«{comment}»</blockquote>
                ))}
              </div>
            )}
          </div>
        </section>
        <section id="faq" className="section container reveal">
          <div className="faq-layout">
            <Heading number="11" tag="ВОПРОСЫ С ПЕРИМЕТРА">
              Я хочу сказать,
              <br />
              что у меня
              <br />
              <em>есть вопросы.</em>
            </Heading>
            <div className="faq-list">
              {faqs.map(([q, a]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <span>+</span>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer>
        <div className="container">
          <Crown size={30} />
          <h2>
            Финал сезона близко.
            <br />
            <em>Периметр слышит всё.</em>
          </h2>
          {ORG_CHAT ? (
            <a className="text-link" href={ORG_CHAT} target="_blank" rel="noreferrer">
              Орг-чат проекта <ArrowUpRight size={17} />
            </a>
          ) : (
            <span className="footer-contact">Орг-чат проекта · ссылку добавят организаторы</span>
          )}
          <div className="billing">
            В ГЛАВНЫХ РОЛЯХ: 4 АДМИНА И 10–15 СМОТРИТЕЛЕЙ
            <br />
            РЕЖИССЁР: УСТАЛОСТЬ · ОПЕРАТОР: ТОЖЕ УСТАЛ
            <br />
            ПРОДЮСЕР: ГОСТЬ, КОТОРЫЙ СПРОСИЛ, МОЖНО ЛИ ПОТРОГАТЬ ЯЗЫКОМ
          </div>
          <div className="footer-bottom">
            <span>ОСОБНЯК НЕБЫЛИЦЫ · САНКТ-ПЕТЕРБУРГ</span>
            <span>* Куклы уже видели и не такое.</span>
            <a href="/admin">КАБИНЕТ ОРГАНИЗАТОРА</a>
            <a href="#top">К НАЧАЛУ ↑</a>
          </div>
        </div>
      </footer>
      <div className="mermaid" style={{ top: `${mermaidTop}%` }} aria-hidden="true">
        <svg viewBox="0 0 50 110">
          <path d="M27 2c-12 0-16 16-6 22l-8 20 5 14c8 12 19 26 2 37-8-3-16-1-19 9 10 7 21 5 24-1 15-8 21-19 10-36L28 45l8-14-6-9c9-6 6-20-3-20Z" />
        </svg>
      </div>
      {gallery !== null && (
        <GalleryDialog image={galleryItems[gallery]} onClose={() => setGallery(null)} />
      )}
    </>
  );
}
