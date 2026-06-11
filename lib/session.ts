import { cookies } from "next/headers";

export async function getParticipantId() {
  return (await cookies()).get("participantId")?.value;
}

export async function isAdmin() {
  return (await cookies()).get("admin")?.value === process.env.ADMIN_KEY;
}
