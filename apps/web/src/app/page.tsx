import { Button } from "@zenncore/web/components/button";
import Image from "next/image";
import Banner from "@/public/images/banner.png";
import Logo from "@/public/images/logo.png";
import Background from "@/public/images/background.png";
import { ArrowRightIcon } from "@zenncore/icons";

export default () => {
  return (
    <main className="size-full items-center md:p-12 p-6 relative flex flex-col gap-12 pb-0 max-h-[100dvh] mb-auto">
      <div
        className="absolute inset-0 size-full opacity-50 -z-30"
        id="title/background"
        style={{
          backgroundImage: `repeating-linear-gradient(
                to right,
                transparent,
                transparent 60px,
                var(--color-background) 60px,
                var(--color-background) 61px
              )`,
          maskImage:
            "radial-gradient(ellipse 80% 40% at center, var(--color-primary-dimmed) 30%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 40% at center, var(--color-primary-dimmed) 30%, transparent 70%)",
        }}
      />
      <Image
        src={Background}
        alt="Logo"
        width={1000}
        className="absolute top-0 -z-10 -translate-y-1/2 left-1/2 aspect-auto w-screen max-w-[1000px] -translate-x-1/2"
      />
      <div className="flex flex-col gap-1 text-white w-fit mx-auto relative">
        <h1 className="text-5xl md:text-6xl font-semibold  tracking-tight flex items-center gap-2">
          <Image src={Logo} alt="Logo" width={140} height={100} /> Instincts
        </h1>
        <h3 className="font-body text-xl text-center font-bold md:leading-2 leading-1 pl-1 tracking-tight">
          What if Wolt could read your mind?
        </h3>
      </div>
      <section className="flex-1 relative w-full flex items-end justify-center text-white">
        <Image
          src={Banner}
          alt="Banner"
          blurDataURL={Banner.blurDataURL}
          className="h-full w-auto absolute -z-20 aspect-auto"
        />
        <div className="h-full bg-gradient-to-t from-background-dimmed to-background-dimmed/0 absolute bottom-0 inset-x-0 -z-10" />

        <div className="flex flex-col gap-4 items-center md:p-12 p-6 text-white">
          <h1 className="font-semibold flex items-center gap-2 md:text-7xl sm:text-5xl text-4xl text-center">
            <Image src={Logo} alt="Logo" width={140} height={100} /> Instincts
          </h1>
          <p className="md:text-xl sm:text-base text-sm text-center font-medium">
            Experience the future of food delivery, install the app and let us
            know what you think.
          </p>
          <button
            type="button"
            className="rounded-full border border-white flex gap-4 items-center p-0.5 text-white bg-primary font-semibold px-4 py-2 flex items-center justify-center hover:bg-primary-rich transition-all duration-300 active:scale-95"
          >
            Install App <ArrowRightIcon className="w-4 h-4 fill-white" />
          </button>
        </div>
      </section>
    </main>
  );
};
