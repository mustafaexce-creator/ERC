import dotenv from 'dotenv';
dotenv.config();
import TelegramBot from 'node-telegram-bot-api';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// In-memory conversation state
const state = {};

bot.on('message', async (msg) => {
    const chatId = msg.chat.id.toString();
    if (chatId !== TELEGRAM_CHAT_ID) return; // Silently ignore

    const text = msg.text || '';
    if (text === '/cancel') {
        delete state[chatId];
        bot.sendMessage(chatId, "❌ Cancelled. Send /newtask whenever you’re ready.");
        return;
    }

    if (text === '/status') {
        const { data: tasks } = await supabase.from('tasks').select('status, team_id');
        const { data: teams } = await supabase.from('teams').select('id, name');
        const total = tasks?.length || 0;
        const pending = tasks?.filter(t => t.status === 'In Review').length || 0;
        const today = new Date().toISOString().split('T')[0];
        const { data: approvedSubs } = await supabase.from('submissions').select('status, submitted_at').eq('status', 'Approved').gte('submitted_at', today);
        const approvedToday = approvedSubs?.length || 0;

        let teamStats = '';
        if (teams && tasks) {
            teams.forEach(team => {
                const count = tasks.filter(t => t.team_id === team.id).length;
                teamStats += `\n- ${team.name}: ${count}`;
            });
        }

        bot.sendMessage(chatId, `📊 *Status*\nTotal Tasks: ${total}\nPending Review: ${pending}\nApproved Today: ${approvedToday}\nPer Team Tasks:${teamStats}`, { parse_mode: 'Markdown' });
        return;
    }

    if (text === '/newtask') {
        state[chatId] = { step: 1 };
        bot.sendMessage(chatId, "📋 Let’s create a new task! What is the task title?");
        return;
    }

    const userState = state[chatId];
    if (!userState) return;

    if (userState.step === 1) {
        userState.title = text;
        userState.step = 2;
        bot.sendMessage(chatId, "✏️ Got it. Now write a short description for this task.");
    } else if (userState.step === 2) {
        userState.description = text;
        userState.step = 3;
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Graphic Design', callback_data: 'Graphic Design' }, { text: 'Content Writing', callback_data: 'Content Writing' }],
                    [{ text: 'Video Editing', callback_data: 'Video Editing' }, { text: 'Photography', callback_data: 'Photography' }],
                    [{ text: 'Voice Over', callback_data: 'Voice Over' }, { text: 'Creativity', callback_data: 'Creativity' }]
                ]
            }
        };
        bot.sendMessage(chatId, "🏷 Choose a team:", options);
    }
});

import http from 'http';

bot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id.toString();
    if (chatId !== TELEGRAM_CHAT_ID) return;
    const userState = state[chatId];
    if (!userState) return;

    if (userState.step === 3) {
        userState.teamName = query.data;

        // insert task directly
        const { data: teamData } = await supabase.from('teams').select('id').eq('name', userState.teamName).single();
        if (teamData) {
            await supabase.from('tasks').insert([{
                title: userState.title,
                description: userState.description,
                team_id: teamData.id,
                status: 'Open',
                created_at: new Date().toISOString()
            }]);

            bot.sendMessage(chatId, `✅ Task created successfully!\n📋 Title: ${userState.title}\n📝 Description: ${userState.description}\n🏷 Team: ${userState.teamName}`);
        } else {
            bot.sendMessage(chatId, "❌ Error finding team in database.");
        }
        delete state[chatId];
        bot.answerCallbackQuery(query.id);
    }
});

// Create a dummy HTTP server so Render doesn't shut the bot down
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Telegram bot is online and polling!\n');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Dummy web server started on port ${PORT}`);
    console.log('Bot is running...');
});
