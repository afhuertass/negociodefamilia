"use client";

import { useState } from "react";
import Combobox from "@/app/components/Combobox";
import { enter } from "../entrar/actions";

export default function EntrarForm({
  participants,
  error,
}: {
  participants: { name: string }[];
  error?: string;
}) {
  const [isValid, setIsValid] = useState(false);

  return (
    <form action={enter} className="mt-6 space-y-4">
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          Código incorrecto para ese nombre.
        </p>
      )}
      <label className="block text-sm font-bold">
        Nombre
        <Combobox
          options={participants}
          onSelect={(name) => setIsValid(name !== "")}
        />
      </label>
      <label className="block text-sm font-bold">
        Código
        <input
          className="input mt-1"
          name="accessCode"
          placeholder="Ej: 1234"
          required
        />
      </label>
      <button className="btn w-full" disabled={!isValid}>
        Continuar
      </button>
    </form>
  );
}
