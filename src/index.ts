import { createCanvas, loadImage } from 'canvas';
// AttachmentBuilder will be imported below with discord.js
import { readFileSync, writeFileSync, existsSync } from 'fs';
const POINTS_FILE = './points.json';
let userPoints: Record<string, number> = {};

// Load points from file on startup
if (existsSync(POINTS_FILE)) {
  try {
    userPoints = JSON.parse(readFileSync(POINTS_FILE, 'utf8'));
  } catch {
    userPoints = {};
  }
}

function savePoints() {
  writeFileSync(POINTS_FILE, JSON.stringify(userPoints, null, 2));
}


import { config } from 'dotenv';
config();
import { Client, Events, GatewayIntentBits, REST, Routes, SlashCommandBuilder, AttachmentBuilder } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Remove slash command registration, use prefix-based commands

// Custom command definitions
import type { Message } from 'discord.js';
type Command = {
  description: string;
  args: string[];
  execute: (message: Message, args: string[]) => Promise<void> | void;
};

const customCommands: Record<string, Command> = {
  buy: {
    description: 'Buy cryptocurrency with your bot balance',
    args: ['crypto', 'amount', 'confirm'],
    execute: (message: Message, args: string[]) => {
      if (args.length < 3) {
        message.reply('Usage: /buy <crypto> <amount> <confirm>');
        return;
      }
      const [crypto, amount, confirm] = args;
      if (confirm !== 'confirm') {
        message.reply('Please type confirm as the last argument to proceed.');
        return;
      }
      message.reply(`Buying ${amount} ${crypto}... Transaction confirmed!`);
    },
  },
  // Add more custom commands here
};

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user?.tag}`);
  if (readyClient.user) {
    console.log(`Discord Client ID: ${readyClient.user.id}`);
  }
});

const PREFIX = '!';

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const [cmd, ...args] = message.content.slice(PREFIX.length).split(/\s+/);

  switch (cmd) {
    case 'resetpoint': {
      const userId = message.author.id;
      userPoints[userId] = 0;
      savePoints();
      await message.reply(`${message.author}\n> Point kamu sudah direset ke 0.`);
      break;
    }
    case 'checkpoint': {
      const userId = message.author.id;
      const points = userPoints[userId] || 0;
      await message.reply(`${message.author}\n> total point kamu: ${points}`);
      break;
    }
    case 'LB': {
      // Leaderboard logic
      const sorted = Object.entries(userPoints)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      let driverBoard = '';
      if (sorted.length === 0) {
        driverBoard = 'No data.';
      } else {
        for (const [userId, points] of sorted) {
          const userTag = `<@${userId}>`;
          driverBoard += `• ${userTag}: ${points} Mechanics Point\n`;
        }
      }

      // Text leaderboard with red line and logo
      const redLine = '┃'; // Unicode vertical bar
      let leaderboardText = `${redLine} **Sugeng Rawuh Leaderboard**\n`;
      if (sorted.length === 0) {
        leaderboardText += `${redLine} No data.`;
      } else {
        for (const [userId, points] of sorted) {
          const userTag = `<@${userId}>`;
          leaderboardText += `${redLine} ${userTag}: ${points} Point\n`;
        }
      }
      // Attach logo image (Sugeng Rawuh logo file should be in project root as SugengRawuhLogo.png)
      try {
        const logoAttachment = new AttachmentBuilder('SugengRawuhLogo.png', { name: 'logo.png' });
        await message.reply({ content: leaderboardText, files: [logoAttachment] });
      } catch {
        await message.reply(leaderboardText);
      }
      break;
    }
    case 'joblogs': {
      const [session_host, amount_of_customers, total_incomes] = args;
      if (!session_host || !amount_of_customers || !total_incomes || message.attachments.size === 0) {
        await message.reply('Usage: !joblogs <session_host> <amount_of_customers> <total_incomes> [photo attachment]');
        return;
      }
      const userId = message.author.id;
      userPoints[userId] = (userPoints[userId] || 0) + 1;
      savePoints();
      const photoUrl = message.attachments.first()?.url;
      await message.reply(
        `${message.author}\n> Job Log Submitted:\n> Session Host: ${session_host}\n> Total Customers : ${amount_of_customers}\n> Total Pemasukan : ${total_incomes}\n> Proof : ${photoUrl}\n> Point: 1 Point berhasil masuk ke inventory Point mu 🥳`
      );
      break;
    }
    default: {
      await message.reply('Unknown command.');
      break;
    }
  }
});
// ...existing code...
await client.login(process.env.DISCORD_BOT_TOKEN);