// Абсолютный путь каталога /src приложения
global.APP_ROOT = process.main ? process.main.paths[0].split('node_modules')[0] : process.mainModule.paths[0].split('node_modules')[0];

// Менеджер компонентов приложения
global.AppComponents = require(APP_ROOT + 'utils/appComponents.js');

// Конфигурация приложения
AppComponents.registerComponent(
	'config',
	APP_ROOT + 'config'
);
// Модель клиента, использующая для хранения данных JSON-файл
AppComponents.registerComponent(
	'clientModel',
	APP_ROOT + 'models/ClientJSONModel.js'
);

const app = {
	'names': [
		[
			'Анастасия',
			'Вероника',
			'Галина',
			'Дарья',
			'Екатерина',
			'Жанна',
			'Зоя',
			'Ирина',
			'Ксения',
			'Лариса',
			'Марина',
			'Наталья',
			'Оксана',
			'Полина',
			'Раиса',
			'Светлана',
			'Татьяна',
			'Ульяна',
			'Юлия',
			'Яна'
		],
		[
			'Александр',
			'Борис',
			'Василий',
			'Галактион',
			'Даниил',
			'Евгений',
			'Иван',
			'Лев',
			'Матвей',
			'Николай',
			'Олег',
			'Павел',
			'Руслан',
			'Сергей',
			'Тарас',
			'Фёдор'
		]
	],
	'patronymics': [
		[
			'Александровна',
			'Борисовна',
			'Васильевна',
			'Галактионовна',
			'Данииловна',
			'Евгеньевна',
			'Ивановна',
			'Львовна',
			'Матвеевна',
			'Николаевна',
			'Олеговна',
			'Павловна',
		],
		[
			'Матвеевич',
			'Николаевич',
			'Олегович',
			'Павлович',
			'Русланович',
			'Сергееевич',
			'Тарасович',
			'Фёдорович',
			'Галактионович',
		]
	],
	'lastNames': [
		[
			'Иванова',
			'Петрова',
			'Сидорова',
			'Гаврилова',
			'Игнатова',
			'Пастухова',
			'Протопопова',
			'Тарасова',
			'Белкина',
		],
		[
			'Иванов',
			'Петров',
			'Протопопов',
			'Гаврилов',
			'Белкин',
			'Щекочихин-Крестовоздвиженский',
			'Ефимов',
			'Никифоров',
			'Пушкин',
			'Тарасов',
			'Ульянов',
		]
	],

	start() {
		this.config = AppComponents.getComponent('config');
		this.banner = '';
		const fs = require('fs');
		if (fs.existsSync(APP_ROOT + 'banner.txt')) {
			this.banner = fs.readFileSync(APP_ROOT + 'banner.txt', { encoding: 'utf8' });
		}
		console.log(`${this.banner}
Генерация случайной базы клиентов...
`);
		return this;
	},

	async generateClientsDB() {
		const clientsCount = this.getRandomInt(this.config.randomClientsMaxCount - this.config.randomClientsMinCount - 1) + 1 + Number(this.config.randomClientsMinCount);
		const clientModel = AppComponents.getComponent('clientModel');
		console.log(`Генерируем случайных клиентов: ${clientsCount}`);
		// Очищаем JSON-файл
		clientModel.clearDB();
		for (let i = 1; i <= clientsCount; i++) {
			const gender = this.getRandomInt(1);
			const newClient = {
				'name': this.names[gender][this.getRandomInt(this.names[gender].length - 1)],
				'lastName': this.patronymics[gender][this.getRandomInt(this.patronymics[gender].length - 1)],
				'surname': this.lastNames[gender][this.getRandomInt(this.lastNames[gender].length - 1)]
			}
			newClient.contacts = this.shuffleArray([...this.genPhones(), ...this.genEmails(), ...this.genVK(), ...this.genFB(), ...this.genOther()]);
			console.log(`${newClient.name} ${newClient.lastName} ${newClient.surname}`);
			newClient.contacts.forEach((contact) => {
				console.log(`	${contact.type}: ${contact.value}`);
			});
			clientModel.create(newClient);
			await this.delay();
		}
	},

	genPhones() {
		const phonesCount = this.getRandomInt(3) - 1;
		const result = [];
		if (phonesCount > 0) {
			for (let i = 1; i <= phonesCount; i++) {
				result.push({
					type: 'Телефон',
					value: `+7 9${this.getRandomString(9, '0123456789')}`
				});
			}
		}
		return result;
	},

	genEmails() {
		const emailsCount = this.getRandomInt(1);
		const result = [];
		if (emailsCount > 0) {
			for (let i = 1; i <= emailsCount; i++) {
				result.push({
					type: 'Email',
					value: this.getRandomString(5 + this.getRandomInt(6), 'qwertyuiopasdfghjklzxcvbnm0123456789') + '@' + ['mail.ru', 'yandex.ru', 'gmail.com'][this.getRandomInt(2)]
				});
			}
		}
		return result;
	},

	genVK() {
		if (this.getRandomInt(2) < 1) {
			return [
				{
					type: 'VK',
					value: 'https://vk.com/' + this.getRandomString(3 + this.getRandomInt(6), 'qwertyuiopasdfghjklzxcvbnm0123456789')
				}
			];
		}
		return [];
	},

	genFB() {
		if (this.getRandomInt(5) < 1) {
			return [
				{
					type: 'Facebook',
					value: 'https://facebook.com/' + this.getRandomString(3 + this.getRandomInt(6), 'qwertyuiopasdfghjklzxcvbnm0123456789')
				}
			];
		}
		return [];
	},

	genOther() {
		if (this.getRandomInt(6) < 1) {
			return [
				{
					type: 'Другое',
					value: this.getRandomString(12 + this.getRandomInt(12), 'йцукенгшщзхъфывапролджэячсмитьбюё ')
				}
			];
		}
		return [];
	},

	getRandomString(length, symbols) {
		let result = '';
		let i = 0;
		const symLen = symbols.length;
		while (i < length) {
			result += symbols.charAt(this.getRandomInt(symLen - 1));
			i++;
		}
		return result;
	},

	shuffleArray(array) {
		if (array.length < 2) {
			return array;
		}
		for (let i = array.length - 1; i > 0; i--) {
			const j = this.getRandomInt(i);
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	},

	getRandomInt(maxValue) {
		return Math.floor(Math.random() * (maxValue + 1));
	},

	async delay() {
		return new Promise(resolve => setTimeout(resolve, 20)); // 20 мс
	}
}

app.start().generateClientsDB();
