import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import DiscordProvider from "next-auth/providers/discord"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import dbConnect from "./mongodb"
import User from "@/models/user"

export const authOptions = {
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }),
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: "email", type: "text", placeholder: "jsmith" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }
                try {
                    await dbConnect()
                    const userdata = await User.findOne({ email: credentials.email }).select("+password");
                    if (!userdata || !userdata.password) {
                        return null
                    }
                    const passcheck = await bcrypt.compare(credentials.password, userdata.password);
                    if (!passcheck) {
                        return null
                    }
                    return {
                        id: userdata._id.toString(),
                        email: userdata.email,
                        firstName: userdata.firstName,
                        profileImage: userdata.profileImage,
                        authMethods: userdata.authMethods
                    };
                } catch (error) {
                    console.error("Credentials auth error:", error);
                    return null;
                }
            }
        })
    ],

    callbacks: {
        async signIn({ user, account, profile }) {
            // For OAuth providers only
            if (account?.provider === "credentials") {
                return true;
            }

            try {
                await dbConnect();
                const existingUser = await User.findOne({ email: user.email });
                const providerIdField = `${account.provider}Id`;

                if (existingUser) {
                    // Update existing user
                    existingUser[providerIdField] = account.providerAccountId;
                    if (!existingUser.authMethods.includes(account.provider)) {
                        existingUser.authMethods.push(account.provider);
                    }
                    if (!existingUser.firstName && user?.name) {
                        existingUser.firstName = user.name;
                    }
                    if (!existingUser.profileImage && user.image) {
                        existingUser.profileImage = user.image;
                    }
                    existingUser.lastLogin = new Date();
                    existingUser.isEmailVerified = true;
                    await existingUser.save();
                    user.id = existingUser._id.toString();
                } else {
                    // Create new user
                    const newUser = new User({
                        email: user.email,
                        firstName: profile?.name || user.name || "User",
                        lastName: "",
                        [providerIdField]: account.providerAccountId,
                        authMethods: [account.provider],
                        profileImage: profile?.image || user.image || null,
                        isEmailVerified: true,
                        lastLogin: new Date()
                    });
                    await newUser.save();
                    user.id = newUser._id.toString();
                }
                return true;
            } catch (error) {
                console.error("SignIn callback error:", error);
                return false;
            }
        },

        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.firstName = user.firstName;
                token.profileImage = user.profileImage;
                token.firstName = user.firstName;
                token.profileImage = user.profileImage;
                token.authMethods = user.authMethods;

                // Runtime Role Calculation (No DB)
                if (process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL) {
                    token.role = 'admin';
                } else {
                    token.role = 'customer';
                }
            }
            if (account) {
                token.provider = account.provider;
            }
            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.firstName = token.firstName;
                session.user.profileImage = token.profileImage;
                session.user.authMethods = token.authMethods;
                session.user.authMethods = token.authMethods;
                session.user.provider = token.provider;
                session.user.role = token.role;
            }
            return session;
        },

        // ADD THIS CALLBACK FOR REDIRECT
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        }
    },

    pages: {
        signIn: "/login",
        error: "/login"
    },

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60
    },

    // ADD THESE FOR BETTER OAUTH SUPPORT
    debug: process.env.NODE_ENV === 'development',
    secret: process.env.NEXTAUTH_SECRET
}