import Link from "next/link";
import { RansomTitle, XXFace } from "@ctt/ui";
import { AppShell } from "./_components/AppShell";

export default function NotFound() {
  return (
    <AppShell>
      <div className="notfound">
        <XXFace className="notfound-face" />
        <RansomTitle text="NOT IN THE CRATE" />
        <p className="muted">This one's not on the shelf. Maybe it was lent out.</p>
        <Link className="btn btn-accent" href="/">Back to the shelf</Link>
      </div>
    </AppShell>
  );
}
