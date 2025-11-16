import { ArrowRightIcon } from "@zenncore/icons";
import Image from "next/image";
import Background from "@/public/images/background.png";
import Banner from "@/public/images/banner.png";
import Logo from "@/public/images/logo.png";

export default () => {
  return (
    <main className="relative mb-auto flex size-full max-h-[100dvh] flex-col items-center gap-12 p-6 pb-0 md:p-12">
      <div
        className="-z-30 absolute inset-0 size-full opacity-50"
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
        className="-z-10 -translate-y-1/2 -translate-x-1/2 absolute top-0 left-1/2 aspect-auto w-screen max-w-[1000px]"
      />
      <div className="relative mx-auto flex w-fit flex-col gap-1 text-white">
        <h1 className="flex items-center gap-2 font-semibold text-5xl tracking-tight md:text-6xl">
          <Image src={Logo} alt="Logo" width={140} height={100} /> Instincts
        </h1>
        <h3 className="pl-1 text-center font-body font-bold text-xl leading-1 tracking-tight md:leading-2">
          What if Wolt could read your mind?
        </h3>
      </div>
      <section className="relative flex w-full flex-1 items-end justify-center text-white">
        <Image
          src={Banner}
          alt="Banner"
          blurDataURL={Banner.blurDataURL}
          className="-z-20 absolute aspect-auto h-full w-auto"
        />
        <div className="-z-10 absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-background-dimmed to-background-dimmed/0" />

        <div className="flex flex-col items-center gap-4 p-6 text-white md:p-12">
          <h1 className="flex items-center gap-2 text-center font-semibold text-4xl sm:text-5xl md:text-7xl">
            <Image src={Logo} alt="Logo" width={140} height={100} /> Instincts
          </h1>
          <p className="text-center font-medium text-sm sm:text-base md:text-xl">
            Experience the future of food delivery, install the app and let us
            know what you think.
          </p>
          <button
            type="button"
            className="flex flex items-center items-center justify-center gap-4 rounded-full border border-white bg-primary p-0.5 px-4 py-2 font-semibold text-white transition-all duration-300 hover:bg-primary-rich active:scale-95"
          >
            Install App <ArrowRightIcon className="h-4 w-4 fill-white" />
          </button>
        </div>
      </section>
    </main>
  );
};
