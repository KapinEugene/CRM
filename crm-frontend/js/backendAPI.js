const apiURI = 'http://localhost:8080/api/user';

class BackendAPI {
	static async getByID(id) {
		const uri = `${apiURI}/${encodeURIComponent(id)}`;
		const response = await fetch(uri);
		if (response.ok) {
			const client = await response.json();
			return client;
		}
		console.error(`Не удалось получить данные клиента с ID = ${id}`);
		return {};
	}

	static async getList(searchTerm = '') {
		const uri = `${apiURI}${searchTerm ? '?search=' + encodeURIComponent(searchTerm) : ''}`;
		const response = await fetch(uri);
		if (response.ok) {
			const clients = await response.json();
			console.log(clients);
			if (Array.isArray(clients)) {
				// Для каждого элемента массива clients преобразуем дату создания и обновления из строкового представления в timestamp
				clients.forEach(client => {
					const createdAt = Date.parse(client.createdAt);
					if (!Number.isNaN(createdAt)) {
						client.createdAt = createdAt;
					}
					else {
						client.createdAt = Date.now();
					}
					const updatedAt = Date.parse(client.updatedAt);
					if (!Number.isNaN(updatedAt)) {
						client.updatedAt = updatedAt;
					}
					else {
						client.updatedAt = Date.now();
					}
					client.id = new String(client.id);
				});
				return clients;
			}
			return [];
		}
		console.error(`Не удалось получить список клиентов`);
		return [];
	}

	static async update(id, client) {
		const uri = `${apiURI}/${encodeURIComponent(id)}`;
		const response = await fetch(uri, {
			'method': 'PATCH',
			'body': JSON.stringify(client)
		});
		// Ошибка валидации данных клиента
		if (response.status === 422) {
			const respBody = await response.json();
			return respBody.validationErrors;
		}
		return [];
	}

	static async delete(id) {
		const uri = `${apiURI}/${encodeURIComponent(id)}`;
		const response = await fetch(uri, {
			'method': 'DELETE'
		});
		if (!response.ok) {
			console.error(`Не удалось удалить клиента с ID = ${id}`);
		}
	}

	static async create(client) {
		const response = await fetch(apiURI, {
			'method': 'POST',
			'body': JSON.stringify(client)
		});
		// Ошибка валидации данных клиента
		if (response.status === 422) {
			const respBody = await response.json();
			return respBody.validationErrors;
		}
		return [];
	}
}
