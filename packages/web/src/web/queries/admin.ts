import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";
export function useAdminSession() {
  return useQuery(
    orpc.admin.me.queryOptions({ retry: false, staleTime: 0, refetchInterval: 60000 }),
  );
}
export function useAdminStats(from: string, to: string) {
  return useQuery(
    orpc.admin.stats.queryOptions({ input: { from, to }, retry: false, refetchInterval: 30000 }),
  );
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "../lib/auth";
import { saveAdminToken, clearAdminToken } from "../lib/identity";
export function useAdminLogin() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (input: { username: string; password: string }) => {
      const result = await authClient.signIn.username(input).catch(() => {
        throw new Error("Не удалось подключиться к сервису входа. Проверьте соединение.");
      });
      if (result.error || !result.data?.token)
        throw new Error(
          result.error?.status === 429
            ? "Слишком много попыток. Подождите 5 минут."
            : (result.error?.status ?? 0) >= 500
              ? "Сервис входа временно недоступен. Попробуйте позже."
              : "Неверный логин или пароль.",
        );
      saveAdminToken(result.data.token);
    },
    onSuccess: () => cache.invalidateQueries({ queryKey: orpc.admin.me.key() }),
  });
}
export function useAdminLogout() {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Не удалось завершить серверную сессию. Повторите выход.");
      clearAdminToken();
    },
    onSuccess: async () => {
      await cache.invalidateQueries({ queryKey: orpc.admin.me.key() });
      cache.removeQueries({ queryKey: orpc.admin.stats.key() });
    },
  });
}
