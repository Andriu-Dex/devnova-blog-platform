"use server";

import { requireAdmin } from "@/server/auth/authorization";
import { revalidatePath } from "next/cache";
import {
  createContactMessage,
  transitionMessageStatus
} from "@/server/contact/contact-service";

export type ContactFormState = { error: string; success: boolean };

export async function submitContactFormAction(state: ContactFormState, formData: FormData): Promise<ContactFormState> {
  try {
    const website = formData.get("website") as string;
    // Honeypot: si el campo oculto "website" tiene datos, asumimos que es un bot
    if (website) {
      // Retornar éxito falso para confundir al bot, sin persistir nada
      return { error: "", success: true };
    }

    const senderName = (formData.get("senderName") as string)?.trim() || "";
    const senderEmail = (formData.get("senderEmail") as string)?.trim() || "";
    const subject = (formData.get("subject") as string)?.trim() || "";
    const messageBody = formData.get("messageBody") as string || "";

    if (!senderName || senderName.length > 150) return { error: "Revisa los campos del formulario.", success: false };
    if (!senderEmail || senderEmail.length > 255 || !senderEmail.includes("@")) return { error: "Revisa los campos del formulario.", success: false };
    if (!subject || subject.length > 200) return { error: "Revisa los campos del formulario.", success: false };
    
    // Validamos el cuerpo (no lo alteramos destructivamente con trim() para mantener los saltos de línea intencionales)
    if (!messageBody.trim() || messageBody.length > 5000) return { error: "Revisa los campos del formulario.", success: false };

    await createContactMessage({
      senderName,
      senderEmail,
      subject,
      messageBody
    });

    // No revalidamos porque no hay caché pesada. La ruta es force-dynamic.
    return { error: "", success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("varios mensajes recientemente")) {
      return { error: err.message, success: false };
    }
    return { error: "No fue posible enviar el mensaje. Inténtalo nuevamente.", success: false };
  }
}

export async function markMessageReadAction(messageId: string) {
  const admin = await requireAdmin();
  await transitionMessageStatus(admin.id, messageId, "READ");
  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${messageId}`);
}

export async function archiveMessageAction(messageId: string) {
  const admin = await requireAdmin();
  await transitionMessageStatus(admin.id, messageId, "ARCHIVED");
  revalidatePath("/admin/messages");
  revalidatePath(`/admin/messages/${messageId}`);
}
