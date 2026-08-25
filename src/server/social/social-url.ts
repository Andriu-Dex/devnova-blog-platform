export function validateSocialUrl(platformCode: string, urlStr: string): string {
  const trimmed = urlStr.trim();
  if (!trimmed) {
    throw new Error("La URL no puede estar vacía.");
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("La URL social no es válida.");
  }

  if (url.protocol !== "https:") {
    throw new Error("La URL debe ser segura (https://).");
  }

  if (platformCode === "GITHUB") {
    if (url.hostname !== "github.com" && !url.hostname.endsWith(".github.com")) {
      throw new Error("La URL no corresponde a la plataforma seleccionada.");
    }
  } else if (platformCode === "LINKEDIN") {
    if (url.hostname !== "linkedin.com" && !url.hostname.endsWith(".linkedin.com")) {
      throw new Error("La URL no corresponde a la plataforma seleccionada.");
    }
  } else if (platformCode === "INSTAGRAM") {
    if (url.hostname !== "instagram.com" && !url.hostname.endsWith(".instagram.com")) {
      throw new Error("La URL no corresponde a la plataforma seleccionada.");
    }
  } else if (platformCode === "FACEBOOK") {
    if (url.hostname !== "facebook.com" && !url.hostname.endsWith(".facebook.com")) {
      throw new Error("La URL no corresponde a la plataforma seleccionada.");
    }
  } else if (platformCode === "YOUTUBE") {
    if (url.hostname !== "youtube.com" && !url.hostname.endsWith(".youtube.com") && url.hostname !== "youtu.be") {
      throw new Error("La URL no corresponde a la plataforma seleccionada.");
    }
  } else {
    // Fail closed para cualquier código de plataforma desconocido
    throw new Error("La plataforma social no es compatible.");
  }

  return url.toString();
}

export function isValidSocialUrl(platformCode: string, urlStr: string): boolean {
  try {
    validateSocialUrl(platformCode, urlStr);
    return true;
  } catch {
    return false;
  }
}
