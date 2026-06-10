export const prerender = false;
import type { APIRoute } from "astro";
import { Resend } from "resend";

const resend = new Resend(import.meta.env.RESEND_API_KEY);

//Proteccion inyection
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Validacion básica de formato
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const POST: APIRoute = async ({ request }) => {
  let body;

  try {
    body = await request.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: "JSON inválido" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { nombre, email, mensaje } = body;

  //tipos, existencia y espacios en blanco
  if (
    typeof nombre !== "string" || !nombre.trim() ||
    typeof email !== "string" || !email.trim() ||
    typeof mensaje !== "string" || !mensaje.trim()
  ) {
    return new Response(
      JSON.stringify({ success: false, error: "Campos requeridos vacíos o inválidos" }),
      { status: 400 }
    );
  }

  //limitar desbordamiento
  if (nombre.length > 80 || email.length > 120 || mensaje.length > 3000) {
    return new Response(
      JSON.stringify({ success: false, error: "Los textos superan el límite permitido" }),
      { status: 400 }
    );
  }

  //valiadamos en el backend
  if (!isValidEmail(email)) {
    return new Response(
      JSON.stringify({ success: false, error: "El formato del email no es válido" }),
      { status: 400 }
    );
  }

  // XSS / HTML Injection antes de enviarlo
  const safeNombre = escapeHTML(nombre.trim());
  const safeEmail = escapeHTML(email.trim());
  const safeMensaje = escapeHTML(mensaje.trim());

  try {
    const { error } = await resend.emails.send({
      from: "Contacto desde formulario <formulario@asandev.com>",
      to: "info@asandev.com",
      subject: `Nuevo mensaje de ${safeNombre}`,
      html: `
        <h2>Nuevo contacto desde el portfolio</h2>
        <p><strong>Nombre:</strong> ${safeNombre}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <hr>
        <p style="white-space: pre-wrap;">${safeMensaje}</p>
      `,
    });

    if (error) {
      console.error("Error de Resend:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Error al procesar el envío" }),
        { status: 500 }
      );
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error("Server Error:", error);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
};