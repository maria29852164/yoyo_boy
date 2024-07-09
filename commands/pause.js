const { SlashCommandBuilder } = require('@discordjs/builders');
const { useQueue } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('Pausa la canción actual'),
	execute: async ({ client, interaction }) => {
		// Obtener la cola para el servidor
		const queue = useQueue(interaction.guild.id);

		// Verificar si la cola está vacía
		if (!queue || !queue.node.isPlaying()) {
			await interaction.reply('No hay canciones en la cola.');
			return;
		}

		// Pausar la canción actual
		queue.node.setPaused(true);

		await interaction.reply('El reproductor ha sido pausado.');
	},
};
