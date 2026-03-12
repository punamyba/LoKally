import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/index.js";

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL ||
                    "http://localhost:5001/api/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email      = profile.emails?.[0]?.value;
        const googleId   = profile.id;
        const firstName  = profile.name?.givenName  || "";
        const lastName   = profile.name?.familyName || "";
        const avatar     = profile.photos?.[0]?.value || null;

        if (!email) {
          return done(new Error("No email from Google"), null);
        }

        // 1. Existing Google user?
        let user = await User.findOne({ where: { google_id: googleId } });

        if (user) {
          return done(null, user);
        }

        // 2. Email already registered (normal account)?
        user = await User.findOne({ where: { email } });

        if (user) {
          // Link Google to existing account
          await user.update({ google_id: googleId, avatar, is_verified: true });
          return done(null, user);
        }

        // 3. Brand new user — create
        user = await User.create({
          first_name:  firstName,
          last_name:   lastName,
          email,
          google_id:   googleId,
          avatar,
          is_verified: true,      // Google verified email already
          password:    null,
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Needed by passport (even though we use JWT, not sessions)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (e) {
    done(e, null);
  }
});

export default passport;