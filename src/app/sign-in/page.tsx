import { Suspense } from "react";
import SignInCard from "./sign-in-card";

export default function SignInPage() {
    return(
        <Suspense>
            <SignInCard />
        </Suspense>
    )
}