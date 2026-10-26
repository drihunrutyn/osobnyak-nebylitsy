import { useEffect, useState } from "react";
import { useRoster } from "../queries/roster";
import { BADGE_TITLES, tenure } from "../../shared/roster";

export function ParticipantForm() {
  const roster=useRoster();
  const p=roster.state.data?.profile;
  const [draft,setDraft]=useState({name:"",startedOn:"",badgeTitle:"смотрящий" as typeof BADGE_TITLES[number],joke:"Выгорание — не приговор"});
  const [message,setMessage]=useState("");
  useEffect(()=>{if(p)setDraft(p);},[p]);
  return <section id="participant-form" className="participant-card">
    <h3>Проголосовали? Представьтесь.</h3>
    <p>Только имя — без ФИО, кодов и почты. Голос «ЗА» и анкета учитываются отдельно.</p>
    <div className="named-count"><b>{roster.state.data?.total ?? "—"}</b><span>ИМЕННЫХ АНКЕТ</span></div>
    <form onSubmit={async e=>{e.preventDefault();try{await roster.saveProfile.mutateAsync(draft);setMessage("Имя сохранено. Теперь можно выбрать роли и реквизит.");}catch(error){setMessage(error instanceof Error?error.message:"Не удалось сохранить анкету");}}}>
      <label className="field-label" htmlFor="participant-name">ВАШЕ ИМЯ *</label>
      <input id="participant-name" autoComplete="name" aria-label="Ваше имя" required maxLength={60} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Например, Алёша" />
      <label className="field-label" htmlFor="participant-start">С КАКОГО ВРЕМЕНИ ВЫ РАБОТАЕТЕ В МУЗЕЕ? · НЕОБЯЗАТЕЛЬНО</label>
      <input id="participant-start" aria-label="Начало работы в музее" type="date" max={new Date().toISOString().slice(0,10)} value={draft.startedOn} onChange={e=>setDraft({...draft,startedOn:e.target.value})} />
      {draft.startedOn && <p>Стаж на проекте: {tenure(draft.startedOn)}</p>}
      <div className="profile-grid"><label>На бейдже<select aria-label="На бейдже" value={draft.badgeTitle} onChange={e=>setDraft({...draft,badgeTitle:e.target.value as typeof BADGE_TITLES[number]})}>{BADGE_TITLES.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Прикол на бейдже<input aria-label="Прикол на бейдже" maxLength={100} value={draft.joke} onChange={e=>setDraft({...draft,joke:e.target.value})} /></label></div>
      <p className="profile-note">Имя увидит организатор. В опубликованном списке ответственных — только имена и утверждённые назначения. Стаж и анкета публично не показываются.</p>
      <button className="button gold" disabled={roster.saveProfile.isPending || roster.state.isPending || roster.state.isError}>{roster.saveProfile.isPending?"СОХРАНЯЕМ…":p?"ОБНОВИТЬ АНКЕТУ":"СОХРАНИТЬ ИМЯ"}</button>
      <output className="form-status" aria-live="polite">{message}</output>
    </form>
  </section>;
}

export function PublicResponsibilities() {
  const {state}=useRoster();
  const p=state.data?.published;
  if(!p)return null;
  return <section className="section container" id="responsibilities"><span className="eyebrow">УТВЕРЖДЕНО ОРГАНИЗАТОРОМ</span><h2>Список ответственных</h2><p>Опубликовано {new Date(p.at).toLocaleDateString("ru-RU")}. Изменения заявок появляются здесь после повторной публикации организатором.</p>
    <div className="responsibility-list">{p.rows.length?p.rows.map((row,i)=><article key={i}><span>{row.kind==="role"?"РОЛЬ":"РЕКВИЗИТ"}</span><h3>{row.title}</h3><b>{row.names.join(", ")}</b></article>):<p>Назначения ещё не утверждены.</p>}</div>
    <strong className="cleanup-banner">Все помогают в уборке!</strong>
  </section>;
}