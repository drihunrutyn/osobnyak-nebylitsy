import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

export function useRoster() {
  const cache=useQueryClient();
  const state=useQuery(orpc.roster.state.queryOptions({refetchInterval:15000,retry:1}));
  const refresh=()=>cache.invalidateQueries({queryKey:orpc.roster.key()});
  const saveProfile=useMutation(orpc.roster.saveProfile.mutationOptions({onSuccess:refresh}));
  const claim=useMutation(orpc.roster.claim.mutationOptions({onSuccess:refresh}));
  return {state,saveProfile,claim};
}
export function useRosterAdmin() {
  const cache=useQueryClient();
  const state=useQuery(orpc.rosterAdmin.list.queryOptions({refetchInterval:30000,retry:false}));
  const refresh=async()=>{await cache.invalidateQueries({queryKey:orpc.rosterAdmin.key()});await cache.invalidateQueries({queryKey:orpc.roster.key()});};
  const savePerson=useMutation(orpc.rosterAdmin.savePerson.mutationOptions({onSuccess:refresh}));
  const saveItem=useMutation(orpc.rosterAdmin.saveItem.mutationOptions({onSuccess:refresh}));
  const assign=useMutation(orpc.rosterAdmin.assign.mutationOptions({onSuccess:refresh}));
  const publish=useMutation(orpc.rosterAdmin.publish.mutationOptions({onSuccess:refresh}));
  return {state,savePerson,saveItem,assign,publish};
}