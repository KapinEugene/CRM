const AppComponents = require("../../utils/appComponents");

const DefaultAPIController = require(APP_ROOT + 'controllers/DefaultAPIController.js');

module.exports = class CreateClientController extends DefaultAPIController
{
	constructor(requestParams) {
		super(requestParams);
		this.config = AppComponents.getComponent('config');
	}

	run(response) {
		super.run(response);
		const clientModel = AppComponents.getComponent('clientModel');
		const reqObj = AppComponents.getComponent('app').requestBodyObj;
		const validationErrors = [];
		const clientCard = clientModel.validateCard(reqObj, validationErrors);
		if (validationErrors.length) {
			// Есть ошибки валидации
			response.statusCode = 422;
			response.write(JSON.stringify({ validationErrors }));
		}
		else {
			// Данные проверены - можно создавать клиента
			const newClient = clientModel.create(clientCard);
			// Вернём ссылку на карточку клиента и саму карточку в теле ответа
			response.statusCode = 201;
			const uri = AppComponents.getComponent('router').matchedURI;
			response.setHeader('Location', `http://localhost:${this.config.port}${uri}/${newClient.id}`);
			response.write(JSON.stringify(newClient));
		}
	}
}
