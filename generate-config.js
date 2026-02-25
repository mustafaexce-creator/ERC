import fs from 'fs';

const configContent = `
export const config = {
    MODERATOR_USERNAME: "${process.env.MODERATOR_USERNAME || "Mustafa"}",
    MODERATOR_PASSWORD: "${process.env.MODERATOR_PASSWORD || "2732006"}",
    SUPABASE_URL: "${process.env.SUPABASE_URL || ""}",
    SUPABASE_ANON_KEY: "${process.env.SUPABASE_ANON_KEY || ""}",
    TELEGRAM_BOT_TOKEN: "${process.env.TELEGRAM_BOT_TOKEN || ""}",
    TELEGRAM_CHAT_ID: "${process.env.TELEGRAM_CHAT_ID || "6100003184"}"
};
`;

try {
    fs.writeFileSync('config.js', configContent);
    console.log('Successfully generated config.js from environment variables.');
} catch (error) {
    console.error('Error generating config.js:', error);
    process.exit(1);
}
