const DefaultAPIController = require(APP_ROOT + 'controllers/DefaultAPIController.js');

module.exports = class UpdateClientController extends DefaultAPIController
{
	constructor(requestParams) {
		super(requestParams);
	}

	run(response) {
		super.run(response);
		const clientID = this.requestParams[0];
		const clientModel = AppComponents.getComponent('clientModel');
		const client = clientModel.getClient(clientID);
		if (client) {
			// Клиент найден - проверим данные от http-клиента на корректность
			const reqObj = AppComponents.getComponent('app').requestBodyObj;
			const validationErrors = [];
			const clientCard = clientModel.validateCard(reqObj, validationErrors);
			if (validationErrors.length) {
				// Есть ошибки валидации
				response.statusCode = 422;
				response.write(JSON.stringify({ validationErrors }));
			}
			else {
				// Данные проверены - можно обновлять данные клиента
				clientModel.update(clientID, clientCard);
			}
		}
		else {
			// Клиент с таким ID не найден
			response.statusCode = 404;
			response.write(JSON.stringify({ 'message': 'Not Found' }));
		}
	}
}
