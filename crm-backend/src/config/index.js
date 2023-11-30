require('dotenv').config();

module.exports = Object.freeze({
	'port': process.env.PORT || 8080,
	'apiURIPrefix': process.env.API_URI_PREFIX || '/api/clients',
	'showResponsesInTerminal': (process.env.SHOW_RESPONSES_IN_TERMINAL === 'true') || false,
	'clientsJSONFilePath': require('path').normalize(APP_ROOT + '../storage/clientsDB.json'),
	'randomClientsMinCount': process.env.RANDOM_CLIENTS_MIN_COUNT || 10,
	'randomClientsMaxCount': process.env.RANDOM_CLIENTS_MAX_COUNT || 30
});
