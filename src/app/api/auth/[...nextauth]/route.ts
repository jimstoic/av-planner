import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const isDev = process.env.NODE_ENV === "development";

const providers: NextAuthOptions["providers"] = [
    // Add a mock credentials provider for local development
    ...(isDev ? [
        CredentialsProvider({
            name: "Local Dev Login",
            credentials: {
                email: { label: "Email", type: "text", placeholder: "test@fleeeet.com" },
            },
            async authorize(credentials) {
                // In dev, allow any @fleeeet.com email
                if (credentials?.email?.endsWith("@fleeeet.com")) {
                    return { id: "1", name: "Dev User", email: credentials.email };
                }
                return null;
            }
        })
    ] : []),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/drive",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        })
    );
}

const handler = NextAuth({
    providers,
    callbacks: {
        async signIn({ account, profile }) {
            if (account?.provider === "google") {
                // Restrict to @fleeeet.com domain
                return profile?.email?.endsWith("@fleeeet.com") || false;
            }
            return true;
        },
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            // @ts-ignore
            session.accessToken = token.accessToken;
            return session;
        },
    },
});

export { handler as GET, handler as POST };
