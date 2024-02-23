import Link from "next/link";
import { ArrowUpRight, DownloadIcon } from "lucide-react";

export default function Download() {
  return (
    <>
      <main className="relative flex flex-col grow min-h-screen items-center justify-between">
        <section className="relative flex w-full max-w-screen-xl p-16 gap-16">
          <div className="flex flex-col items-start w-full">
            <h1
              id="getting-started"
              className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-2"
            >
              Getting Started
            </h1>
            <p className="text-base lg:text-lg tracking-tight mb-4">
              Getting started with ODIM.
            </p>
            <h2
              id="requirements"
              className="text-xl lg:text-2xl font-extrabold tracking-tight mb-2"
            >
              Requirements
            </h2>
            <ul className="*:list-disc *:list-inside text-base lg:text-lg mb-4">
              <li>Android 12.0+</li>
              <li>A Wi-Fi connection.</li>
            </ul>
            <h2
              id="installation"
              className="text-xl lg:text-2xl font-extrabold tracking-tight mb-2"
            >
              Installation
            </h2>
            <p className="text-base lg:text-lg tracking-tight mb-2">
              First, download the latest APK and install it on your Android
              device.
            </p>
            <p className="text-base lg:text-lg tracking-tight mb-2">
              You may need to enable installation from unknown sources in your
              device settings. This setting allows you to install apps from
              sources other than the Google Play Store.
            </p>
            <ol className="*:list-decimal *:list-inside text-base lg:text-lg mb-4">
              <li>Open the &ldquo;Settings&rdquo; app on your device.</li>
              <li>
                Look for &ldquo;Security&rdquo; or &ldquo;Privacy&rdquo;
                settings (the exact name may vary depending on your device).
              </li>
              <li>
                Find the option called &ldquo;Unknown Sources&rdquo; and enable
                it.
              </li>
            </ol>
            <p className="text-base lg:text-lg tracking-tight mb-2">
              Next, locate and open the APK file you downloaded. Follow the
              instructions from the installer to complete the installation.
            </p>
            <p className="text-base lg:text-lg tracking-tight mb-4">
              Once the app is installed, a new app with an Android icon and the
              name ODIM will appear on your device&rsquo;s home page.
            </p>
            <h2
              id="capture-traces"
              className="text-xl lg:text-2xl font-extrabold tracking-tight mb-2"
            >
              Capturing Traces
            </h2>
            <h3 className="text-lg lg:text-xl font-bold tracking-tight mb-2">
              Preflight
            </h3>
            <p className="text-base lg:text-lg tracking-tight mb-2">
              Before capturing a trace, open the ODIM app on your device and
              enter a worker ID. Any value works for the worker ID, at is
              obsolete for now.
            </p>
            <p className="text-base lg:text-lg tracking-tight mb-2">
              Next, navigate to the Settings on your device and scroll down to
              &ldquo;Accessibility&rdquo;. Click on the tab and find the ODIM
              app. Toggle on and click on &ldquo;allow&rdquo; to start app
              recording. Some phones may notify you that you need to allow
              permissions for the app first. To do this, return to the
              &ldquo;Settings&rdquo; home and navigate to &ldquo;Apps&rdquo;.
              Find &ldquo;ODIM&rdquo; and give allow permissions.
            </p>
            <h3 className="text-lg lg:text-xl font-bold tracking-tight mb-2">
              Capture
            </h3>
            <p className="text-base lg:text-lg tracking-tight mb-2">
              To create a trace, launch the target app and perform a tap on the
              screen. This will communicate to the ODIM app to begin recording a
              trace. Keep interacting with the app as normal. ODIM will record
              your interaction in the background. To end a trace, press the
              &ldquo;Home&rdquo; button to tell the ODIM that the trace
              recording is finished. The app will continue recording
              interactions, but will save the recently recorded collection of
              screen and interactions as a trace. To stop ODIM from recording
              your interactions, simply navigate back to &ldquo;Settings&rdquo;
              &gt; &ldquo;Accessibility&rdquo; &gt; Toggle &ldquo;ODIM&rdquo;
              off. You can start/stop recording again in the ODIM Accessibility
              settings by toggling the button
              &ldquo;on&rdquo;/&ldquo;off&rdquo;.
            </p>
          </div>
          <aside className="sticky top-12 flex flex-col w-full max-w-xs">
            <Link
              href="https://mobileodimbucket155740-dev.s3.us-east-2.amazonaws.com/apk/odim-1.0.apk"
              className="px-3 py-2 bg-neutral-800 rounded-xl mb-2"
            >
              <span className="flex justify-between items-center text-base text-white font-medium">
                Download Latest (v1.0)
                <DownloadIcon size={20} className="ml-1 stroke-4" />
              </span>
            </Link>
            <Link href="/" className="px-3 py-2 bg-neutral-100 rounded-xl">
              <span className="flex justify-between items-center text-base text-neutral-900 font-medium">
                View Source
                <ArrowUpRight size={20} className="ml-1 stroke-4" />
              </span>
            </Link>
          </aside>
        </section>
      </main>
    </>
  );
}
