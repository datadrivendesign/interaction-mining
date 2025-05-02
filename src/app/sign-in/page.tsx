import { Suspense } from "react";
import SignInCard from "./sign-in-card";

export default function SignInPage() {
    return(
        <Suspense>
            <SignInCard />
        </Suspense>
    )
}
// "use client";

// import { signIn } from "next-auth/react";
// import { Button } from "@/components/ui/button";
// import { Card, CardHeader, CardTitle } from "@/components/ui/card";
// import Image from "next/image";

// export default function SignInPage() {
//   const handleGoogleSignIn = async () => {
//     await signIn("google", { callbackUrl: "/" }); // or "/"
//   };

//   return (
//     <div className="flex w-dvw min-h-dvh justify-center items-start md:items-center p-8 md:p-16">
//       <Card className="w-full max-w-sm">
//         <CardHeader>
//           <CardTitle className="text-center text-2xl font-black">
//             Sign in to ODIM
//           </CardTitle>

//           <Button
//             className="flex grow justify-center items-center w-full rounded-lg px-4 py-2"
//             onClick={handleGoogleSignIn}
//           >
//             <span className="inline-flex items-center text-white dark:text-black font-medium">
//               <Image
//                 className="w-auto h-4 mr-4"
//                 src="/third-party-logos/g.webp"
//                 alt="Google logo"
//                 width={0}
//                 height={0}
//                 sizes="100vw"
//               />
//               Sign in with Google
//             </span>
//           </Button>

//           <Button
//             className="flex grow justify-center items-center w-full rounded-lg px-4 py-2"
//             disabled
//           >
//             <span className="inline-flex items-center text-white dark:text-black font-medium">
//               <Image
//                 className="w-auto h-4 mr-4 invert dark:invert-0"
//                 src="/third-party-logos/apple.svg"
//                 alt="Apple logo"
//                 width={0}
//                 height={0}
//                 sizes="100vw"
//               />
//               Sign in with Apple
//             </span>
//           </Button>
//         </CardHeader>
//       </Card>
//     </div>
//   );
// }
