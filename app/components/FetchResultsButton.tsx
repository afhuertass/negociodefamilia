"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import { fetchLiveResultsAction } from "@/app/admin/actions"; // We need to move this

export function FetchResultsButton() {
  const [state, action, pending] = useActionState(fetchLiveResultsAction, null);

  if (state?.error) {
    toast.error("Error al sincronizar resultados", { description: state.error });
  } else if (state?.success) {
    toast.success("Resultados en vivo sincronizados");
  }

  return (
    <form action={action}>
      <button 
        disabled={pending}
        className="btn bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition hover:bg-sky-700"
      >
        {pending ? "Sincronizando..." : "Fetch resultados en vivo"}
      </button>
    </form>
  );
}
