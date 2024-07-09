const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { QueryType, useQueue } = require('discord-player');
const { YouTubeExtractor, YoutubeExtractor} = require('@discord-player/extractor')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproduce una canción desde YouTube.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('search')
                .setDescription('Busca una canción y la reproduce')
                .addStringOption(option =>
                    option.setName('searchterms').setDescription('Términos de búsqueda').setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('playlist')
                .setDescription('Reproduce una lista de reproducción de YouTube')
                .addStringOption(option => option.setName('url').setDescription('URL de la lista de reproducción').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('song')
                .setDescription('Reproduce una canción desde YouTube')
                .addStringOption(option => option.setName('url').setDescription('URL de la canción').setRequired(true))
        ),
    execute: async ({ client, interaction }) => {
        // Asegúrate de que el usuario esté en un canal de voz
        if (!interaction.member.voice.channel) {
            return interaction.reply('Necesitas estar en un canal de voz para reproducir una canción.');
        }

        // Obtener la cola de reproducción para el servidor
        let queue = useQueue(interaction.guild.id);

        // Si no hay cola, crear una
        if (!queue) {
            queue = await client.player.nodes.create(interaction.guild, {
                metadata: {
                    channel: interaction.channel
                }
            });

            // Conéctate al canal de voz
            try {
                if (!queue.connection) await queue.connect(interaction.member.voice.channel);
            } catch {
                queue.delete();
                return interaction.reply({ content: 'No pude unirme a tu canal de voz!', ephemeral: true });
            }
        }

        let embed = new EmbedBuilder();

        if (interaction.options.getSubcommand() === 'song') {
            const url = interaction.options.getString('url');
            await client.player.extractors.register(YoutubeExtractor, {});

            // Busca la canción usando discord-player
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: `ext:${YouTubeExtractor.identifier}`
            });
            if (result.tracks.length === 0) {
                return interaction.reply('No se encontraron resultados.');
            }

            const song = result.tracks[0];
            console.log(song)
            await queue.addTrack(song);
            embed
                .setDescription(`**[${song.title}](${song.url})** ha sido añadida a la cola`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duración: ${song.duration}` });

        } else if (interaction.options.getSubcommand() === 'playlist') {
            const url = interaction.options.getString('url');
            const result = await client.player.search(url, {
                requestedBy: interaction.user,
                searchEngine: QueryType.YOUTUBE_PLAYLIST
            });

            if (result.tracks.length === 0) {
                return interaction.reply(`No se encontraron listas de reproducción con ${url}`);
            }

            const playlist = result.playlist;
            await queue.addTracks(result.tracks);
            embed
                .setDescription(`**${result.tracks.length} canciones de [${playlist.title}](${playlist.url})** han sido añadidas a la cola`)
                .setThumbnail(playlist.thumbnail);

        } else if (interaction.options.getSubcommand() === 'search') {
            const searchTerms = interaction.options.getString('searchterms');
            const result = await client.player.search(searchTerms, {
                requestedBy: interaction.user,
                searchEngine: QueryType.AUTO
            });

            if (result.tracks.length === 0) {
                return interaction.reply('No se encontraron resultados.');
            }

            const song = result.tracks[0];
            await queue.addTrack(song);
            embed
                .setDescription(`**[${song.title}](${song.url})** ha sido añadida a la cola`)
                .setThumbnail(song.thumbnail)
                .setFooter({ text: `Duración: ${song.duration}` });
        }

        // Reproduce la canción
        if (!queue.playing) await queue.play();

        // Responde con el embed que contiene la información sobre la canción
        await interaction.reply({ embeds: [embed] });
    },
};
