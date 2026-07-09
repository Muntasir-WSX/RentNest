import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);

const envCandidates = [
    path.join(process.cwd(), ".env"),
    path.resolve(currentDir, "../../.env"),
];

const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));

dotenv.config({ path: envPath ?? envCandidates[0] });

export default {
    port: process.env.PORT || 5000,
    databaseUrl: process.env.DATABASE_URL,
    app_url : process.env.APP_URL,
    bycryptSaltRounds: process.env.BCRYPT_SALT_ROUNDS,
    jwt_access_secret: process.env.JWT_ACCESS_SECRET,
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
    jwt_access_expiration_in: process.env.JWT_ACCESS_EXPIRATION_IN,
    jwt_refresh_expiration_in: process.env.JWT_REFRESH_EXPIRATION_IN,
    stripe_secret_key: process.env.STRIPE_SECRET_KEY,

}