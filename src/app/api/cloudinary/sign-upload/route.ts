import { NextResponse } from "next/server";
import { getCurrentAuthenticatedUser } from "@/server/auth/authentication-service";
import { generateUploadSignature } from "@/server/media/cloudinary";

export async function POST() {
  const user = await getCurrentAuthenticatedUser();

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "No autenticado o usuario inactivo." },
      { status: 401 }
    );
  }

  if (user.role !== "AUTHOR" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para subir archivos multimedia." },
      { status: 403 }
    );
  }

  try {
    const signatureData = generateUploadSignature();
    return NextResponse.json(signatureData, { status: 200 });
  } catch (err: unknown) {
    console.error("Error al generar firma de subida:", err);
    return NextResponse.json(
      { error: "Error en el servidor al generar la firma de subida." },
      { status: 500 }
    );
  }
}
