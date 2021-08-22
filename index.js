const Discord = require("discord.js");
const config = require("./config.json");
const bot = new Discord.Client();

const Distube = require("distube");
const distube = new Distube(bot, { searchSongs: false, emitNewSongOnly: true});

var commands = "𝓗𝓮𝓻𝓮 𝓪𝓻𝓮 𝓶𝔂 𝓬𝓸𝓶𝓶𝓪𝓷𝓭𝓼:\n";
commands += "`$play [song]`: *play a song*\n";
commands += "`$pause`: *pause the current song*\n";
commands += "`$resume`: *resume playing the song*\n";
commands += "`$volume [int]`: *set the volume (0-100), leave blank to get current volume*\n";
commands += "`$stop`: *stop playing*\n";
commands += "`$skip`: *skip the current song*\n";
commands += "`$queue`: *see the queue of songs*\n";
commands += "`$mute`: *mute the bot*\n";
commands += "`$unmute`: *unmute the bot*\n";
commands += "`$jump [int]`: *jump to a song in the queue*\n"

let volume = 50;
let isMuted = false;


bot.on("ready", () => {
    console.log("ⓑⓞⓝⓙⓞⓤⓡ");

    bot.user.setActivity("$help", {type:"PLAYING"});
})

bot.on("message", msg => {

    if (msg.author.bot) return;
    if (!msg.content.startsWith(config.prefix)) return;

    const args = msg.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift();

    if (msg.member.roles.cache.some(r => r.name == "DJ")) {
        if (command == "help") {
            return msg.channel.send(commands)
        }
      
        if (command == "play") {
            if (!msg.member.voice.channel) return msg.channel.send("Please join a voice channel and try again!");
            if (!args[0]) return msg.channel.send("What would you like to play?");
            distube.play(msg, args.join(" "));
    
            return;
        }

        if (command == "pause") {
            if (!msg.member.voice.channel) return msg.channel.send("Please join a voice channel and try again!");
            distube.pause(msg);

            return msg.channel.send("⏸️ Pausing song...");
        }

        if (command == "resume") {
            if (!msg.member.voice.channel) return msg.channel.send("Please join a voice channel and try again!");
            distube.resume(msg);

            return msg.channel.send("▶️ Resuming song...");
        }

        if (command == "volume") {
            if (!msg.member.voice.channel) return msg.channel.send("Please join a voice channel and try again!");
            if (!args[0]) {
                if (!isMuted) {
                    return msg.channel.send(`Current Volume \`${volume}%\``);
                } else {
                    return msg.channel.send("Bot is muted")
                }
                
            }

            distube.setVolume(msg, args.join(" "));
            volume = parseInt(args.join(" "))
            
            return msg.channel.send(`🔊 Volume set to \`${args[0]}%\``)
        }

        if (command == "mute") {
            if (!msg.member.voice.channel) return msg.channel.send("Please join a voice channel and try again!");
            distube.setVolume(msg, 0);
            isMuted = true;
            
            return msg.channel.send("🔇 Song muted");
        }

        if (command == "unmute") {
            if (!msg.member.voice.channel) return msg.channel.send("Please join a voice channel and try again!");
            distube.setVolume(msg, volume);
            isMuted = false;
            
            return msg.channel.send(`🔊 Volume set to \`${volume}%\``);
        }
    
        if (command == "stop") {
            const person = msg.guild.members.cache.get(bot.user.id);
            if (!msg.member.voice.channel) return msg.channel.send("Please join a voice channel and try again!");
            if (person.voice.channel != msg.member.voice.channel) return msg.channel.send("Join the channel the bot is in first!");
            distube.stop(msg);
    
            return msg.channel.send("⏹️ Stopping song...");
        }
    
        if (command == "skip") {
            if (!msg.member.voice.channel) return msg.channel.send("Please join a voice channel and try again!");
            distube.skip(msg);
    
            return msg.channel.send("⏭️ Skipping song...");
        }

        if (command == "queue") {
            if (!msg.member.voice.channel) return msg.channel.send("Please join a voice channel and try again!");
            let queue = distube.getQueue(msg);
            return msg.channel.send('Current queue:\n' + queue.songs.map((song, id) => `**${id + 1}**. ${song.name} - \`${song.formattedDuration}\``).slice(0, 10).join("\n"));
        }

        if (command == "jump") {
            if (!msg.member.voice.channel) return msg.channel.send("Please join a voice channel and try again!");
            let queue = distube.getQueue(msg);
            if (!args[0]) return msg.channel.send('Which song do you want to jump to?\n' + queue.songs.map((song, id) => `**${id + 1}**. ${song.name} - \`${song.formattedDuration}\``).slice(0, 10).join("\n"));
      
            distube.jump(msg, parseInt(args[0])-1);

            return msg.channel.send("⏩ Jumping to your song...");
        }

    } else {
        return msg.reply("You can't use this command! Please ask an admin for the *DJ* role.");
    }

    
});

// Queue status template
const status = (queue) => `Volume: \`${queue.volume}%\` | Loop: \`${queue.repeatMode ? queue.repeatMode == 2 ? "All Queue" : "This Song" : "Off"}\` | Autoplay: \`${queue.autoplay ? "On" : "Off"}\``;

// DisTube event listeners, more in the documentation page
distube
    .on("playSong", (msg, queue, song) => msg.channel.send(
        `🎵 Playing \`${song.name}\` - \`${song.formattedDuration}\`\nRequested by: ${song.user}\n${status(queue)}`
    ))
    .on("addSong", (msg, queue, song) => msg.channel.send(
        `Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`
    ))
    .on("playList", (msg, queue, playlist, song) => msg.channel.send(
        `Play \`${playlist.name}\` playlist (${playlist.songs.length} songs).\nRequested by: ${song.user}\nNow playing \`${song.name}\` - \`${song.formattedDuration}\`\n${status(queue)}`
    ))
    .on("addList", (msg, queue, playlist) => msg.channel.send(
        `Added \`${playlist.name}\` playlist (${playlist.songs.length} songs) to queue\n${status(queue)}`
    ))
    // DisTubeOptions.searchSongs = true
    .on("searchResult", (msg, result) => {
        let i = 0;
        msg.channel.send(`**Choose an option from below**\n${result.map(song => `**${++i}**. ${song.name} - \`${song.formattedDuration}\``).join("\n")}\n*Enter anything else or wait 60 seconds to cancel*`);
    })
    // DisTubeOptions.searchSongs = true
    .on("searchCancel", (msg) => msg.channel.send(`Searching canceled`))
    .on("error", (msg, e) => {
        console.error(e)
        msg.channel.send("An error encountered: " + e);
    });

bot.login(config.token);