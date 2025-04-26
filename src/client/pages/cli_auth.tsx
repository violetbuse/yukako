import { HomeNavbarHorizontalPadding } from "@/client/components/home_navbar";
import { MainLayout } from "@/client/layouts/main"
import { OrganizationSwitcher, SignedIn, SignedOut, SignIn, useAuth } from "@clerk/clerk-react";
import { useSearchParams } from "wouter"
import { useState } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/client/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "@/client/components/ui/button";
import { toast } from "sonner"

export const AuthenticateCliPage = () => {

    const [params] = useSearchParams();
    const redirect = params.get('redirect');
    const code = params.get('code');

    const [code_input, set_code_input] = useState('');

    const code_match = code_input === code;

    const { getToken, orgId } = useAuth()

    const handle_login = async () => {
        const token = await getToken({
            skipCache: true,
            organizationId: orgId ?? undefined,
            template: "cli"
        })

        if (!token) {
            toast.error("Failed to login")
            return
        }

        console.log(token)

        const search_params = new URLSearchParams();
        search_params.set("code", token)

        const redirect_url = `${redirect}?${search_params.toString()}`

        window.location.href = redirect_url
    }

    return (
        <MainLayout>
            <div className="w-screen h-[90vh] flex items-center justify-center">
                <div>
                    <SignedIn>
                        <div className="flex flex-col gap-4 p-4 rounded-lg border border-accent">
                            <h1 className="text-lg font-semibold">Login to the Yukako CLI</h1>
                            <p className="text-sm text-muted-foreground ">Select the organization you want to login to, and enter the code you see in the terminal. Do not enter somebody else's code.</p>
                            <OrganizationSwitcher />
                            <div className="flex justify-center w-full">
                                <InputOTP maxLength={6} onChange={set_code_input} value={code_input} pattern={REGEXP_ONLY_DIGITS}>
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            {!code_match && code_input.length === 6 && (
                                <p className="text-red-500 text-sm">Invalid code</p>
                            )}
                            <Button disabled={!code_match} className="w-full" onClick={handle_login}>
                                Login
                            </Button>
                        </div>


                    </SignedIn>
                    <SignedOut>
                        <SignIn oauthFlow="popup" fallbackRedirectUrl={window.location.href} />
                    </SignedOut>
                </div>
            </div>
        </MainLayout>
    )
}
