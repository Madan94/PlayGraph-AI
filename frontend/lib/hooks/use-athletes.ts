"use client";

import { useCallback, useEffect, useState } from "react";
import { athletesApi, type Athlete } from "@/lib/api";

export function useAthletes() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    return athletesApi
      .list()
      .then((data) => {
        setAthletes(data.athletes);
        return data.athletes;
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : "Failed to load athletes";
        setError(message);
        setAthletes([]);
        return [] as Athlete[];
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { athletes, loading, error, reload };
}
