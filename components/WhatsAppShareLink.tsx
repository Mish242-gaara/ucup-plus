import { MessageCircle } from "lucide-react";

export default function WhatsAppShareLink({ text }: { text: string }) {
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:underline"
    >
      <MessageCircle size={14} /> Partager sur WhatsApp
    </a>
  );
}
