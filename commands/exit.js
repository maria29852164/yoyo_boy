const { SlashCommandBuilder } = require('@discordjs/builders');
const { useQueue } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('exit')
		.setDescription('Saca al bot del canal de voz.'),
	execute: async ({ client, interaction }) => {
		// Obtener la cola para el servidor
		const queue = useQueue(interaction.guild.id);

		// Verificar si la cola está vacía
		if (!queue || !queue.node.isPlaying()) {
			await interaction.reply('No hay canciones en la cola.');
			return;
		}

		// Destruir la cola y salir del canal de voz
		queue.delete();

		await interaction.reply('¿Por qué me haces esto?');
	},
};
