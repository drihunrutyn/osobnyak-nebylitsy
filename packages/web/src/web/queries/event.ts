import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import type { RouterOutputs } from "@orpc/server";
import type { AppRouter } from "../../api";
type State = RouterOutputs<AppRouter>["event"]["state"];
const stateOptions = () => orpc.event.state.queryOptions({ refetchInterval: 15000, retry: 1 });
export function useParticipation() {
  const cache = useQueryClient();
  const state = useQuery(stateOptions());
  const invalidate = () => cache.invalidateQueries({ queryKey: stateOptions().queryKey });
  const vote = useMutation(orpc.event.vote.mutationOptions({ onSuccess: invalidate }));
  const role = useMutation(
    orpc.event.role.mutationOptions({
      onMutate: async (input) => {
        await cache.cancelQueries({ queryKey: stateOptions().queryKey });
        const previous = cache.getQueryData<State>(stateOptions().queryKey);
        cache.setQueryData<State>(stateOptions().queryKey, (old) =>
          old
            ? {
                ...old,
                roles: input.selected
                  ? [...new Set([...old.roles, input.role])]
                  : old.roles.filter((r) => r !== input.role),
              }
            : old,
        );
        return previous;
      },
      onError: (_error, _input, previous) => {
        if (previous) cache.setQueryData(stateOptions().queryKey, previous);
      },
      onSettled: invalidate,
    }),
  );
  const supply = useMutation(
    orpc.event.supply.mutationOptions({
      onMutate: async (input) => {
        await cache.cancelQueries({ queryKey: stateOptions().queryKey });
        const previous = cache.getQueryData<State>(stateOptions().queryKey);
        cache.setQueryData<State>(stateOptions().queryKey, (old) => {
          if (!old) return old;
          const selected = old.supplies.includes(input.item);
          const ready = old.ready
            .map((r) =>
              r.item === input.item
                ? {
                    ...r,
                    people:
                      r.people +
                      (input.selected && !selected ? 1 : !input.selected && selected ? -1 : 0),
                  }
                : r,
            )
            .filter((r) => r.people > 0);
          if (input.selected && !old.ready.some((r) => r.item === input.item))
            ready.push({ item: input.item, people: 1 });
          return {
            ...old,
            ready,
            supplies: input.selected
              ? [...new Set([...old.supplies, input.item])]
              : old.supplies.filter((i) => i !== input.item),
          };
        });
        return previous;
      },
      onError: (_error, _input, previous) => {
        if (previous) cache.setQueryData(stateOptions().queryKey, previous);
      },
      onSettled: invalidate,
    }),
  );
  const comment = useMutation(orpc.event.comment.mutationOptions({ onSuccess: invalidate }));
  return { state, vote, role, supply, comment };
}
export function useTrackingMutations() {
  const visit = useMutation(orpc.event.visit.mutationOptions());
  const track = useMutation(orpc.event.track.mutationOptions());
  const heartbeat = useMutation(orpc.event.heartbeat.mutationOptions());
  return { visit, track, heartbeat };
}
