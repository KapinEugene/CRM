const searchDelay = 500;
const defaultContactType = 'Email';

class Clients {

	// Конструктор: инициализация модальных окон и событий, первоначальная загрузка списка клиентов
	constructor(params) {
		this.appendTableTo = params.appendTableTo; // селектор элемента, внутри которого будет создаваться таблица клиентов
		// Модальное окно подтверждения удаления клиента
		this.modalConfirmDelete = bootstrap.Modal.getOrCreateInstance('#modal-confirm-delete-client');
		// Модальное окно создания/редактирования клиента
		this.modalClientForm = bootstrap.Modal.getOrCreateInstance('#modal-client');

		// Массив объектов с данными клиентов
		this.clients = [];

		// Тип и порядок сортировки
		this.sortType = -1;
		this.sortOrder = 1;

		// Флаги, указывающие, идёт ли в данный момент получение, удаление или сохранение данных клиента/клиентов (запрос к серверу)
		this.fetchInProgress = false;
		this.deletionInProgress = false;
		this.savingInProgress = false;

		// Обработчки событий, предотвращающие закрытие модальных окон, пока идёт удаление или сохранение данных клиента (запрос к серверу)
		document.getElementById('modal-confirm-delete-client').addEventListener('hide.bs.modal', e => this.checkCanCloseModalDelete(e));
		document.getElementById('modal-client').addEventListener('hide.bs.modal', e => this.checkCanCloseModalSave(e));

		// Сброс атрибута disabled для всех атрибутов, у которых он может быть установлен:
		// это workaround для Firefox, который сохраняет у элементов значение атрибута disabled даже при перезагрузке страницы
		this.resetDisabledAttr();

		// Запуск обновления списка клиентов при изменения поискового запроса
		document.getElementById('search-input').addEventListener('input', this.searchDelay.bind(this));

		// Обработчики события input на текстовых полях формы создания/редактирования клиентов
		document.getElementById('modal-client-surname').addEventListener('input', e => {
			document.getElementById('modal-client-error').hidden = true;
			Utils.setElemInvalidState(e.target, false);
		});
		document.getElementById('modal-client-name').addEventListener('input', e => {
			document.getElementById('modal-client-error').hidden = true;
			Utils.setElemInvalidState(e.target, false);
		});
		document.getElementById('modal-client-lastname').addEventListener('input', e => {
			document.getElementById('modal-client-error').hidden = true;
			Utils.setElemInvalidState(e.target, false);
		});
		document.getElementById('modal-client-new-contact').addEventListener('input', e => {
			document.getElementById('modal-client-error').hidden = true;
			Utils.setElemInvalidState(e.target, false);
		});
		document.getElementById('modal-client-new-contact-type').addEventListener('change', e => {
			document.getElementById('modal-client-error').hidden = true;
		});

		// Событие отправки форм (подтверждения действия в модальных окнах)
		document.getElementById('modal-confirm-delete-client-form').addEventListener('submit', e => {
			e.preventDefault();
			this.delete();
		});
		document.getElementById('modal-client-form').addEventListener('submit', e => {
			e.preventDefault();
			this.save();
		});

		// Фокусировка на первом элементе формы создания/редактирования клиента при открытии формы
		document.getElementById('modal-client').addEventListener('shown.bs.modal', e => document.getElementById('modal-client-surname').focus());

		// Поисковый запрос
		this.searchTerm = document.getElementById('search-input').value;

		// Обновление списка клиентов при запуске приложения
		this.updateList();
	}

	// Обработчик события input для поисковой строки - подождать searchDelay мсек перед началом поиска
	searchDelay(e) {
		this.searchTerm = e.currentTarget.value;
		if (this.searchTimeoutID) {
			clearTimeout(this.searchTimeoutID);
		}
		this.searchTimeoutID = setTimeout(this.updateList.bind(this), searchDelay);
	}

	// Подготовить и показать модальное окно создания нового клиента
	showCreateClientWindow() {
		this.prepareClientForm();
		this.modalClientForm.show();
	}

	// Подготовить и показать модальное окно редактирования клиента из массива this.clients с указанным индексом
	showEditClientWindow(clientIndex) {
		this.prepareClientForm(this.clients[clientIndex]);
		this.modalClientForm.show();
	}

	// Подготовить и показать модальное окно подтверждения удаления клиента с указанным индексом
	showConfirmDeleteClientWindow(clientIndex) {
		const id = this.clients[clientIndex].id;
		document.getElementById('modal-confirm-delete-client-id').value = id;
		document.getElementById('modal-confirm-delete-client-error').hidden = true;
		this.modalConfirmDelete.show();
	}

	// Подготовить модальное окно создания/редактирования клиента
	prepareClientForm(client = null) {
		if (client) {
			// Подготавливаем форму редактирования клиента
			document.getElementById('modal-client-header').textContent = 'Редактирование клиента';
			document.getElementById('modal-client-confirm-btn').textContent = 'Сохранить';
			// Заполняем значениями поля ввода
			document.getElementById('modal-client-surname').value = client.surname;
			document.getElementById('modal-client-name').value = client.name;
			document.getElementById('modal-client-lastname').value = client.lastName;
			document.getElementById('modal-client-id').value = client.id;
			document.getElementById('modal-client-saving-msg').value = 'Сохраняем&hellip;';
			// Заполняем список контактов
			const contactsTBody = document.querySelector('#modal-client-contacts table tbody');
			contactsTBody.innerHTML = '';
			let num = 1;
			client.contacts.forEach(contact => {
				const trID = `client-contact-tr-${num}`;
				const tr = document.createElement('tr');
				tr.innerHTML = `<tr><td>${Utils.escapeHtml(contact.type)}</td><td>${Utils.wrapContact(contact.type, contact.value)}</td>` +
					`<td><button type="button" class="btn btn-sm btn-danger" aria-label="Удалить" onclick="document.getElementById('modal-client-error').hidden = true; document.getElementById('${trID}').remove()">X</button></td></tr>`;
				tr.setAttribute('id', trID);
				contactsTBody.append(tr);
				num++;
			});
		}
		else {
			// Подготавливаем форму создания клиента
			document.getElementById('modal-client-header').textContent = 'Новый клиент';
			document.getElementById('modal-client-confirm-btn').textContent = 'Создать';
			// Очищаем поля ввода
			document.getElementById('modal-client-surname').value = '';
			document.getElementById('modal-client-name').value = '';
			document.getElementById('modal-client-lastname').value = '';
			document.getElementById('modal-client-id').value = '';
			document.getElementById('modal-client-saving-msg').value = 'Создаём&hellip;';
			// Очищаем список контактов
			document.querySelector('#modal-client-contacts table tbody').innerHTML = '';
		}
		// Очищаем поля раздела "Новый контакт"
		document.getElementById('modal-client-new-contact-type').value = defaultContactType;
		document.getElementById('modal-client-new-contact').value = '';
		// Снимаем статус invalid для всех элементов формы
		Utils.setElemInvalidState('modal-client-name', false);
		Utils.setElemInvalidState('modal-client-surname', false);
		Utils.setElemInvalidState('modal-client-lastname', false);
		Utils.setElemInvalidState('modal-client-contacts', false, 'clients-invalid');
		Utils.setElemInvalidState('modal-client-new-contact', false);
		// Прячем ошибку
		document.getElementById('modal-client-error').hidden = true;
	}

	// Обработчик отправки формы модального окна подтверждения удаления клиента (удаление подтверждено)
	async delete() {
		let success = false;
		this.deletionInProgress = true;
		document.getElementById('modal-confirm-delete-client-error').hidden = true;
		// Установка атрибута disabled для кнопок модального окна подтверждения удаления клиента
		Utils.setElemDisabled('modal-confirm-delete-client-close-btn');
		Utils.setElemDisabled('modal-confirm-delete-client-cancel-btn');
		Utils.setElemDisabled('modal-confirm-delete-client-confirm-btn');
		const id = document.getElementById('modal-confirm-delete-client-id').value;
		// Спиннер внутри кнопки "Удалить"
		document.getElementById('modal-confirm-delete-client-confirm-btn').innerHTML =
			'<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;Удаляем&hellip;';
		try {
			await BackendAPI.delete(id);
			success = true;
		}
		catch (e) {
			// Показать ошибку удаления клиента
			document.getElementById('modal-confirm-delete-client-error').hidden = false;
		}
		this.deletionInProgress = false;
		// Возвращаем обычный вид кнопке "Удалить"
		document.getElementById('modal-confirm-delete-client-confirm-btn').innerHTML = 'Удалить';
		// Снятие атрибута disabled для кнопок модального окна подтверждения удаления клиента
		Utils.setElemDisabled('modal-confirm-delete-client-close-btn', false);
		Utils.setElemDisabled('modal-confirm-delete-client-cancel-btn', false);
		Utils.setElemDisabled('modal-confirm-delete-client-confirm-btn', false);
		if (success) {
			this.modalConfirmDelete.hide();
			await this.updateList();
		}
	}

	// Обработчик отправки формы "Добавить/Сохранить" модального окна создания/редактирования клиента
	async save() {
		let success = false;
		this.savingInProgress = true;
		document.getElementById('modal-client-error').hidden = true;
		// Установка атрибута disabled для кнопок модального окна создания/редактирования клиента
		Utils.setElemDisabled('modal-client-close-btn');
		Utils.setElemDisabled('modal-client-cancel-btn');
		Utils.setElemDisabled('modal-client-confirm-btn');
		Utils.setElemDisabled('modal-client-surname');
		Utils.setElemDisabled('modal-client-name');
		Utils.setElemDisabled('modal-client-lastname');
		document.querySelectorAll('#modal-client-contacts table tbody tr').forEach(tr => Utils.setElemDisabled(tr.children[2].children[0]));
		Utils.setElemDisabled('modal-client-new-contact-type');
		Utils.setElemDisabled('modal-client-new-contact');
		Utils.setElemDisabled('modal-client-contact-new-contact-add-btn');	
		// Спиннер внутри кнопки "Добавить/Сохранить"
		const savingMsg = document.getElementById('modal-client-saving-msg').value;
		document.getElementById('modal-client-confirm-btn').innerHTML =
			`<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;${savingMsg}`;
		// Заполняем данными объект клиента
		const clientData = {
			'surname': document.getElementById('modal-client-surname').value,
			'name': document.getElementById('modal-client-name').value,
			'lastName': document.getElementById('modal-client-lastname').value,
			'contacts': []
		}
		const contactsList = document.querySelectorAll('#modal-client-contacts table tbody tr');
		contactsList.forEach(tr => {
			clientData.contacts.push({
				'type': tr.children[0].textContent,
				'value': tr.children[1].textContent
			});
		});
		const id = document.getElementById('modal-client-id').value;
		if (id) {
			// Сохранение данных существующего клиента
			try {
				const errors = await BackendAPI.update(id, clientData);
				if (errors.length) {
					errors.forEach((err) => {
						switch (err.field) {
							case 'name':
								Utils.setElemInvalidState('modal-client-name');
								break;
							case 'surname':
								Utils.setElemInvalidState('modal-client-surname');
								break;
							case 'contacts':
								Utils.setElemInvalidState('modal-client-contacts', true, 'clients-invalid');
								break;
						}
					});
					document.querySelector('#modal-client-error div').textContent = 'Ошибка заполнения данных клиента!';
					document.getElementById('modal-client-error').hidden = false;
				}
				else {
					success = true;
				}
			}
			catch (e) {
				document.querySelector('#modal-client-error div').textContent = 'Ошибка сохранения данных клиента!';
				document.getElementById('modal-client-error').hidden = false;
			}
			// Возвращаем обычный вид кнопке "Добавить/Сохранить"
			document.getElementById('modal-client-confirm-btn').innerHTML = 'Сохранить';
		}
		else {
			// Новый клиент
			try {
				const errors = await BackendAPI.create(clientData);
				if (errors.length) {
					errors.forEach((err) => {
						switch (err.field) {
							case 'name':
								Utils.setElemInvalidState('modal-client-name');
								break;
							case 'surname':
								Utils.setElemInvalidState('modal-client-surname');
								break;
							case 'contacts':
								Utils.setElemInvalidState('modal-client-contacts', true, 'clients-invalid');
								break;
						}
					});
					document.querySelector('#modal-client-error div').textContent = 'Ошибка заполнения данных клиента!';
					document.getElementById('modal-client-error').hidden = false;
				}
				else {
					success = true;
				}
			}
			catch (e) {
				document.querySelector('#modal-client-error div').textContent = 'Ошибка сохранения данных клиента!';
				document.getElementById('modal-client-error').hidden = false;
			}
			// Возвращаем обычный вид кнопке "Добавить/Сохранить"
			document.getElementById('modal-client-confirm-btn').innerHTML = 'Создать';
		}
		this.savingInProgress = false;
		// Снятие атрибута disabled для кнопок модального окна создания/редактирования клиента
		Utils.setElemDisabled('modal-client-close-btn', false);
		Utils.setElemDisabled('modal-client-cancel-btn', false);
		Utils.setElemDisabled('modal-client-confirm-btn', false);
		Utils.setElemDisabled('modal-client-surname', false);
		Utils.setElemDisabled('modal-client-name', false);
		Utils.setElemDisabled('modal-client-lastname', false);
		document.querySelectorAll('#modal-client-contacts table tbody tr').forEach(tr => Utils.setElemDisabled(tr.children[2].children[0], false));
		Utils.setElemDisabled('modal-client-new-contact-type', false);
		Utils.setElemDisabled('modal-client-new-contact', false);
		Utils.setElemDisabled('modal-client-contact-new-contact-add-btn', false);
		document.getElementById('modal-client-surname').focus();
		if (success) {
			this.modalClientForm.hide();
			await this.updateList();
		}
	}

	// Пересортировать таблицу клиентов
	sortTable(newSortType = null) {
		if (newSortType !== null) {
			// Обновим режим и направление сортировки
			if (this.sortType === newSortType) {
				this.sortOrder *= -1;
			}
			else {
				this.sortOrder = 1;
			}
			this.sortType = newSortType;
		}
		switch (this.sortType) {
			case 0:
				this.clients.sort((a, b) => {
					let result = 0;
					const fullName1 = `${a.surname} ${a.name} ${a.lastName}`.trim();
					const fullName2 = `${b.surname} ${b.name} ${b.lastName}`.trim();
					if (fullName1 > fullName2) {
						result = 1;
					}
					else {
						result = -1;
					}
					return result * this.sortOrder;
				});
				break;
			case 1:
				this.clients.sort((a, b) => {
					let result = 0;
					if (a.createdAt > b.createdAt) {
						result = 1;
					}
					else {
						result = -1;
					}
					return result * this.sortOrder;
				});
				break;
			case 2:
				this.clients.sort((a, b) => {
					let result = 0;
					if (a.updatedAt > b.updatedAt) {
						result = 1;
					}
					else {
						result = -1;
					}
					return result * this.sortOrder;
				});
				break;
		}
		// Отрисовка таблицы
		this.buildTable();
	}

	// Функция, создающая таблицу со списком клиентов
	buildTable() {
		document.querySelector(this.appendTableTo).innerHTML = '';

		const clientsTable = document.createElement('table');
		clientsTable.classList.add('table', 'table-striped');
		// Заголовок таблицы
		const tHead = document.createElement('thead');
		const tHeadTR = document.createElement('tr');
		const thID = document.createElement('th');
		thID.textContent = 'id';
		const thContacts = document.createElement('th');
		thContacts.textContent = 'Контакты';
		const thActions = document.createElement('th');
		thActions.textContent = 'Действия';
		// Колонка "ФИО"
		const thName = document.createElement('th');
		thName.append(document.createElement('span'));
		thName.children[0].id = 'sort-col0';
		thName.children[0].textContent = 'Фамилия Имя Отчество';
		if (this.sortType === 0) {
			if (this.sortOrder === 1) {
				thName.children[0].classList.add('th-sortname-asc', 'th-sorted');
			}
			else {
				thName.children[0].classList.add('th-sortname-desc', 'th-sorted');
			}
		}
		else {
			thName.children[0].classList.add('th-sortname-asc');
		}
		// Колонка "Дата и время создания"
		const thCreated = document.createElement('th');
		thCreated.append(document.createElement('span'));
		thCreated.children[0].id = 'sort-col1';
		thCreated.children[0].textContent = 'Дата и время создания';
		if (this.sortType === 1) {
			if (this.sortOrder === 1) {
				thCreated.children[0].classList.add('th-sortable-asc', 'th-sorted');
			}
			else {
				thCreated.children[0].classList.add('th-sortable-desc', 'th-sorted');
			}
		}
		else {
			thCreated.children[0].classList.add('th-sortable-asc');
		}
		// Колонка "Последние изменения"
		const thUpdated = document.createElement('th');
		thUpdated.append(document.createElement('span'));
		thUpdated.children[0].id = 'sort-col2';
		thUpdated.children[0].textContent = 'Последние изменения';
		if (this.sortType === 2) {
			if (this.sortOrder === 1) {
				thUpdated.children[0].classList.add('th-sortable-asc', 'th-sorted');
			}
			else {
				thUpdated.children[0].classList.add('th-sortable-desc', 'th-sorted');
			}
		}
		else {
			thUpdated.children[0].classList.add('th-sortable-asc');
		}
		// Заполняем заголовок и привязываем его к таблице
		tHeadTR.append(
			thID,
			thName,
			thCreated,
			thUpdated,
			thContacts,
			thActions
		);
		tHead.append(tHeadTR);
		clientsTable.append(tHead);
		// Тело таблицы
		const tBody = document.createElement('tbody');
		// цикл по всем клиентам
		for (let i = 0; i < this.clients.length; i++) {
			// создаём строку таблицы
			const tbodyTr = document.createElement('tr');

			// поочередно добавляем все данные клиента
			for (let key = 0; key < 6; key++) {
				const tbodyTd = document.createElement('td');
				switch (key) {
					case 0:
						tbodyTd.classList.add('tbody_id', 'td_text');
						tbodyTd.textContent = this.clients[i].id.substr(-6);
						break;
					case 1:
						tbodyTd.classList.add('td_full-name');
						tbodyTd.textContent = `${this.clients[i].surname} ${this.clients[i].name} ${this.clients[i].lastName}`.trim();
						break;
					case 2:
						tbodyTd.classList.add('td_create');
						tbodyTd.textContent = Utils.formatTimestamp(this.clients[i].createdAt);
						break;
					case 3:
						tbodyTd.classList.add('td_change');
						tbodyTd.textContent = Utils.formatTimestamp(this.clients[i].updatedAt);
						break;
					case 4:
						tbodyTd.classList.add('td_contacts');
						this.clients[i].contacts.forEach(contact => {
							const iconImg = document.createElement('img');
							iconImg.classList.add('contact-icon');
							iconImg.setAttribute('src', `img/contacts/${Utils.getContactIconImg(contact.type)}.svg`);
							iconImg.setAttribute('alt', 'Icon');
							iconImg.setAttribute('title', `<b>${Utils.escapeHtml(contact.type)}:</b> ${Utils.escapeHtml(contact.value)}`);
							tbodyTd.append(iconImg);
						});
						break;
					case 5:
						tbodyTd.classList.add('td_actions');
						// ** кнопка изменить
						const btnChange = document.createElement('button');
						btnChange.classList.add('btn', 'btn-primary');
						btnChange.append('Изменить');
						btnChange.addEventListener('click', () => {
							app.clients.showEditClientWindow(i);
						});

						// ** кнопка удалить
						const btnDelete = document.createElement('button');
						btnDelete.classList.add('btn', 'btn-primary');
						btnDelete.append('Удалить');
						btnDelete.addEventListener('click', () => {
							app.clients.showConfirmDeleteClientWindow(i);
						});

						tbodyTd.append(btnChange);
						tbodyTd.append(' ');
						tbodyTd.append(btnDelete);
						break;
				}
				tbodyTr.append(tbodyTd);
			}
			tBody.append(tbodyTr);
		}
		clientsTable.append(tBody);
		// Привязка таблицы в дерево документа
		document.querySelector(this.appendTableTo).append(clientsTable);
		// Сортировка по кликам на заголовках столбцов
		document.getElementById('sort-col0').addEventListener('click', e => app.clients.sortTable(0));
		document.getElementById('sort-col1').addEventListener('click', e => app.clients.sortTable(1));
		document.getElementById('sort-col2').addEventListener('click', e => app.clients.sortTable(2));
		// Тултипы под иконками контактов
		Utils.setTooltips('.contact-icon', { placement: 'bottom', html: true });
	}

	// Получить с сервера массив клиентов, соотв. поисковому запросу, и обновить таблицу клиентов
	async updateList() {
		this.fetchInProgress = true;
		app.showSpinner();
		try {
			this.clients = await BackendAPI.getList(this.searchTerm);
			this.fetchInProgress = false;
			// Пересортировать и отрисовать таблицу клиентов
			this.sortTable();
			app.hideSpinner();
		}
		catch (e) {
			this.fetchInProgress = false;
			app.showError(`Не удалось получить список клиентов с сервера:<br />
${e.message}`, true);
		}
	}

	// Обработчик клика на кнопке "Добавить контакт" к списку контактов клиента в окне создания/редактирования клиента
	addContactToList() {
		document.getElementById('modal-client-error').hidden = true;
		const contact = document.getElementById('modal-client-new-contact').value.trim();
		if (contact === '') {
			Utils.setElemInvalidState('modal-client-new-contact');
			return;
		}
		const contactType = document.getElementById('modal-client-new-contact-type').value;
		const trID = `client-contact-tr-${document.querySelectorAll('#modal-client-contacts table tbody tr').length + 1}`;
		const contactsTBody = document.querySelector('#modal-client-contacts table tbody');
		const tr = document.createElement('tr');
		tr.innerHTML = `<tr><td>${Utils.escapeHtml(contactType)}</td><td>${Utils.wrapContact(contactType, contact)}</td>` +
			`<td><button type="button" class="btn btn-sm btn-danger" aria-label="Удалить" onclick="document.getElementById('modal-client-error').hidden = true; document.getElementById('${trID}').remove()">X</button></td></tr>`;
		tr.setAttribute('id', trID);
		contactsTBody.append(tr);
		document.getElementById('modal-client-new-contact').value = '';
		document.getElementById('modal-client-new-contact-type').value = defaultContactType;
	}

	// Проверить, можно ли закрыть окно подтверждения удаления клиента
	checkCanCloseModalDelete(e) {
		if (app.clients.deletionInProgress) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
		return true;
	}

	// Проверить, можно ли закрыть окно подтверждения удаления клиента
	checkCanCloseModalSave(e) {
		if (app.clients.savingInProgress) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
		return true;
	}

	// Сброс атрибута disabled для всех элементов, у которых он может быть установлен:
	// это workaround для Firefox, который сохраняет у элементов значение атрибута disabled даже при перезагрузке страницы
	resetDisabledAttr() {
		Utils.setElemDisabled('modal-confirm-delete-client-close-btn', false);
		Utils.setElemDisabled('modal-confirm-delete-client-cancel-btn', false);
		Utils.setElemDisabled('modal-confirm-delete-client-confirm-btn', false);
		Utils.setElemDisabled('modal-client-close-btn', false);
		Utils.setElemDisabled('modal-client-cancel-btn', false);
		Utils.setElemDisabled('modal-client-confirm-btn', false);
		Utils.setElemDisabled('modal-client-surname', false);
		Utils.setElemDisabled('modal-client-name', false);
		Utils.setElemDisabled('modal-client-lastname', false);
		document.querySelectorAll('#modal-client-contacts table tbody tr').forEach(tr => Utils.setElemDisabled(tr.children[2].children[0], false));
		Utils.setElemDisabled('modal-client-new-contact-type', false);
		Utils.setElemDisabled('modal-client-new-contact', false);
		Utils.setElemDisabled('modal-client-contact-new-contact-add-btn', false);	
	}
}
