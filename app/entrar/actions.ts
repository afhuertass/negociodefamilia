"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export async function enter(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const accessCode = String(formData.get("accessCode") || "").trim();
  if (!name || !accessCode) throw new Error("Nombre y código son requeridos");

  const participant = await prisma.participant.findUnique({ where: { name } });
  
  if (!participant || participant.accessCode !== accessCode) {
    redirect("/entrar?error=1");
  }

  (await cookies()).set("participantId", participant.id, { path: "/", httpOnly: true, sameSite: "lax" });
  redirect("/predicciones/grupos");
}
