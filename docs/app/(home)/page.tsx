import Image from "next/image";
import Link from "next/link";
import { InstallTabs } from "@/components/install-tabs";

export default function HomePage() {
  return (
    <main className="flex flex-col flex-1">
      <section>
        <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28 flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
          <div className="flex flex-col gap-6 flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-5xl leading-none text-fd-primary">文</span>
              <h1 className="text-4xl font-bold tracking-tight text-fd-foreground">
                fumi
              </h1>
            </div>

            <p className="text-xl text-fd-muted-foreground leading-relaxed max-w-md">
              Modern, ultrafast, lightweight SMTP server. Composable middleware
              per phase. Type-safe.
            </p>

            <div className="flex gap-3">
              <Link
                href="/docs/getting-started"
                className="px-5 py-2.5 rounded-lg bg-fd-primary text-fd-primary-foreground font-medium text-sm hover:bg-fd-primary/90 transition-colors"
              >
                Get Started
              </Link>
              <a
                href="https://github.com/puiusabin/fumi"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg border border-fd-border text-fd-foreground font-medium text-sm hover:bg-fd-accent transition-colors"
              >
                GitHub
              </a>
            </div>

            <InstallTabs />
          </div>

          <div className="flex-1 w-full min-w-0 flex items-center justify-center">
            <Image
              src="/snippet.png"
              alt="Fumi code snippet"
              width={1024}
              height={768}
              className="w-full max-w-lg rounded-xl"
              priority
            />
          </div>
        </div>
      </section>
    </main>
  );
}
