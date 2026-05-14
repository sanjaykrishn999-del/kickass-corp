require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource, 
  AudioPlayerStatus,
  VoiceConnectionStatus,
  StreamType
} = require('@discordjs/voice');

const path = require('path');
const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

require('opusscript');
require('libsodium-wrappers');

// Health check
const PORT = process.env.PORT || 8080;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('10 Bots - Nuclear Stacked');
}).listen(PORT);

const tokens = [
  process.env.TOKEN1, process.env.TOKEN2, process.env.TOKEN3, process.env.TOKEN4, process.env.TOKEN5,
  process.env.TOKEN6, process.env.TOKEN7, process.env.TOKEN8, process.env.TOKEN9, process.env.TOKEN10
].filter(t => t);

console.log(`Starting ${tokens.length} bots in NUCLEAR STACKED mode...`);

tokens.forEach((token, index) => {
  const botNum = index + 1;
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates
    ]
  });

  let connection;
  let player;

  client.on('ready', () => {
    console.log(`[Bot ${botNum}] ONLINE ✅`);
  });

  client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    // Check if user is Admin or Founder
    const isAdmin = message.member?.permissions.has('Administrator');
    const isFounder = message.guild.ownerId === message.author.id;

    if (!isAdmin && !isFounder) return;

    if (message.content === '!kacj') {
      const vc = message.member.voice.channel;
      if (!vc) return;
      
      setTimeout(async () => {
        try {
          if (connection && connection.state.status !== VoiceConnectionStatus.Destroyed) {
            connection.destroy();
          }
          connection = joinVoiceChannel({
            channelId: vc.id,
            guildId: message.guild.id,
            adapterCreator: client.guilds.cache.get(message.guild.id).voiceAdapterCreator, // <--- INDEPENDENT PIPELINE FOR EACH BOT
            selfDeaf: true,
            group: client.user.id
          });
          console.log(`[Bot ${botNum}] JOINED ✅`);
        } catch (err) {
          console.error(`[Bot ${botNum}] JOIN ERROR:`, err.message);
        }
      }, index * 2000);
    }

    if (message.content === '!kacst') {
      if (!connection) return;

      const audioPath = path.join(__dirname, 'mega_loud.mp3');
      if (fs.existsSync(audioPath)) {
        
        setTimeout(() => {
          // REDUCED LOAD PIPELINE: Lower volume and more compatible stream type
          const ffmpegProcess = spawn(ffmpegPath, [
            '-i', audioPath,
            '-af', 'volume=2.5', // Reduced from 5.0 to 2.5 for better Discord support
            '-f', 's16le',
            '-ar', '48000',
            '-ac', '2',
            'pipe:1'
          ]);

          ffmpegProcess.on('error', err => {
            console.error(`[Bot ${botNum}] FFmpeg Spawn Error:`, err.message);
          });

          const resource = createAudioResource(ffmpegProcess.stdout, {
            inputType: StreamType.Raw, // Raw PCM is most stable for Discord
            inlineVolume: false
          });

          if (!player) {
            player = createAudioPlayer({
              behaviors: {
                noSubscriber: 'play'
              }
            });

            player.on('error', error => {
              console.error(`[Bot ${botNum}] Player Error:`, error.message);
            });

            player.on(AudioPlayerStatus.Idle, () => {
              console.log(`[Bot ${botNum}] Finished playing.`);
            });
          }

          player.play(resource);
          connection.subscribe(player);
          console.log(`[Bot ${botNum}] PLAYING (Optimized Load) 🔊`);
        }, index * 200); // Increased stagger delay to 200ms to reduce CPU spike
      }
    }

    if (message.content === '!kacsp') { if (player) player.stop(); }
    if (message.content === '!kacds') { 
      if (connection && connection.state.status !== VoiceConnectionStatus.Destroyed) {
        connection.destroy();
      }
    }
  });

  client.login(token).catch(err => console.error(`[Bot ${botNum}] LOGIN FAILED`));
});
