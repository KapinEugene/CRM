const searchDelay = 300;

const clients = new Clients();

async function updateClientsTable(searchTerm = '') {
	await clients.updateList(searchTerm);
	document.getElementById('clients-table-body').innerHTML = '';
	drawingTableOfClients(clients.getList());
}

function escapeHtml(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function getContactIconImg(contactType) {
	switch (contactType) {
		case 'Телефон':
			return 'phone';
		case 'Email':
			return 'mail';
		case 'VK':
			return 'vk';
		case 'Facebook':
			return 'fb';
		default:
			return 'human';
	}
}

function wrapContact(contactType, contact) {
	switch (contactType) {
		case 'Телефон':
			return `<a href="phone:${escapeHtml(contact)}">${escapeHtml(contact)}</a>`;
		case 'Email':
			return `<a href="mailto:${escapeHtml(contact)}">${escapeHtml(contact)}</a>`;
		case 'VK':
			return `<a href="${escapeHtml(contact)}">${escapeHtml(contact)}</a>`;
		case 'Facebook':
			return `<a href="${escapeHtml(contact)}">${escapeHtml(contact)}</a>`;
		default:
			return escapeHtml(contact);
	}
}

function setTooltips(query, options) {
	const elems = document.querySelectorAll(query);
	for (let i = 0; i < elems.length; i++) {
		new bootstrap.Tooltip(elems[i], options);
	}
}

function addContactToList(query, idPrefix) {
	const contact = document.getElementById(`${idPrefix}-contact-to-add`).value;
	const contactType = document.getElementById(`${idPrefix}-contact-type-to-add`).value;
	if (contact.trim() === '') {
		document.getElementById(`${idPrefix}-contact-to-add`).classList.add('is-invalid');
		return;
	}
	const tBody = document.querySelector(query);
	const tRows = document.querySelectorAll(query + ' tr');
	const newID = idPrefix + (tRows.length + 1);
	const tr = document.createElement('tr');
	document.getElementById(`div-${idPrefix}`).classList.remove('contacts-invalid');
	tr.innerHTML = `<tr><td>${escapeHtml(contactType)}</td><td>${wrapContact(contactType, contact)}</td>` +
		`<td><button type="button" class="btn btn-sm btn-danger" aria-label="Удалить" onclick="document.getElementById('${newID}').remove(); document.getElementById('div-${idPrefix}').classList.remove('contacts-invalid');">X</button></td></tr>`;
	tr.setAttribute('id', newID);
	tBody.append(tr);
	document.getElementById(`${idPrefix}-contact-type-to-add`).value = 'Email';
	document.getElementById(`${idPrefix}-contact-to-add`).value = '';
	document.getElementById(`${idPrefix}-contact-to-add`).classList.remove('is-invalid');
}

function fillContactsList(query, idPrefix, contacts) {
	const tBody = document.querySelector(query);
	tBody.innerHTML = '';
	let nextNum = 1;
	contacts.forEach((contact) => {
		const newID = `${idPrefix}${nextNum}`;
		const tr = document.createElement('tr');
		tr.innerHTML = `<tr><td>${escapeHtml(contact.type)}</td><td>${wrapContact(contact.type, contact.value)}</td>` +
			`<td><button type="button" class="btn btn-sm btn-danger" aria-label="Удалить" onclick="document.getElementById('${newID}').remove()">X</button></td></tr>`;
		tr.setAttribute('id', newID);
		tBody.append(tr);
		nextNum++;
	});
}

function sortTable(sortType) {
	if (clients.sortType === sortType) {
		clients.sortOrder *= -1;
	}
	else {
		clients.sortOrder = 1;
	}
	clients.sortType = sortType;
	clients.sort();
	document.getElementById('clients-table-body').innerHTML = '';
	drawingTableOfClients(clients.getList());
}

function removeIsInvalid(event) {
	event.target.classList.remove('is-invalid');
}

document.addEventListener('DOMContentLoaded', () => {
	updateClientsTable(document.getElementById('search-input').value);

	function search(e) {
		if (this.timeoutID) {
			clearTimeout(this.timeoutID);
		}
		this.timeoutID = setTimeout(updateClientsTable, searchDelay, e.currentTarget.value);
	}

	// Поиск
	document.getElementById('search-input').addEventListener('input', e => search(e));

	document.getElementById('sName').addEventListener('input', removeIsInvalid);
	document.getElementById('fName').addEventListener('input', removeIsInvalid);
	document.getElementById('sNameUpd').addEventListener('input', removeIsInvalid);
	document.getElementById('fNameUpd').addEventListener('input', removeIsInvalid);
	document.getElementById('contact-tr-create-contact-to-add').addEventListener('input', removeIsInvalid);
	document.getElementById('contact-tr-update-contact-to-add').addEventListener('input', removeIsInvalid);

	// Открытие модального окна создания клиента
	document.getElementById('addModal').addEventListener('show.bs.modal', (e) => {
		document.getElementById('sName').value = '';
		document.getElementById('fName').value = '';
		document.getElementById('pName').value = '';
		document.getElementById('contact-tr-create-contact-type-to-add').value = 'Email';
		document.getElementById('contact-tr-create-contact-to-add').value = '';
		document.querySelector('table#contacts-list-create-dialog tbody').innerHTML = '';
		document.getElementById('sName').classList.remove('is-invalid');
		document.getElementById('fName').classList.remove('is-invalid');
		document.getElementById('contact-tr-create-contact-to-add').classList.remove('is-invalid');
		document.getElementById('div-contact-tr-create').classList.remove('contacts-invalid');
	});

	// Открытие модального окна редактирования клиента
	document.getElementById('updModal').addEventListener('show.bs.modal', (e) => {
		document.getElementById('contact-tr-update-contact-type-to-add').value = 'Email';
		document.getElementById('contact-tr-update-contact-to-add').value = '';
		document.getElementById('sNameUpd').classList.remove('is-invalid');
		document.getElementById('fNameUpd').classList.remove('is-invalid');
		document.getElementById('contact-tr-update-contact-to-add').classList.remove('is-invalid');
		document.getElementById('div-contact-tr-update').classList.remove('contacts-invalid');
	});

	// Кнопка удаление клиента в модальном окне
	document.getElementById('confirm-delete-button').addEventListener('click', async () => {
		document.getElementById('cancel-delete-button').click();
		const id = document.getElementById('client-id-to-delete').value;
		if (id) {
			await BackendAPI.delete(id);
			await updateClientsTable(document.getElementById('search-input').value);
		}
	});

	// Кнопка "Сохранить" в модальном окне редактирования клиента
	document.getElementById('confirm-update-button').addEventListener('click', async () => {
		const id = document.getElementById('client-id-to-update').value;
		if (id) {
			const client = {
				'surname': document.getElementById('sNameUpd').value,
				'name': document.getElementById('fNameUpd').value,
				'lastName': document.getElementById('pNameUpd').value,
				'contacts': []
			}
			const contactsList = document.querySelectorAll('table#contacts-list-update-dialog tbody tr');
			contactsList.forEach(tr => {
				client.contacts.push({
					'type': tr.children[0].textContent,
					'value': tr.children[1].textContent
				});
			});
			const errors = await BackendAPI.update(id, client);
			if (errors.length) {
				errors.forEach((err) => {
					switch (err.field) {
						case 'name':
							document.getElementById('fNameUpd').classList.add('is-invalid');
							break;
						case 'surname':
							document.getElementById('sNameUpd').classList.add('is-invalid');
							break;
						case 'contacts':
							document.getElementById('div-contact-tr-update').classList.add('contacts-invalid');
							break;
					}
				});
			}
			else {
				document.getElementById('cancel-update-button').click();
				await updateClientsTable(document.getElementById('search-input').value);
			}
		}
	});

	// Кнопка "Создать" в модальном окне создания клиента
	document.getElementById('confirm-create-button').addEventListener('click', async () => {
		const client = {
			'surname': document.getElementById('sName').value,
			'name': document.getElementById('fName').value,
			'lastName': document.getElementById('pName').value,
			'contacts': []
		}
		const contactsList = document.querySelectorAll('table#contacts-list-create-dialog tbody tr');
		contactsList.forEach(tr => {
			client.contacts.push({
				'type': tr.children[0].textContent,
				'value': tr.children[1].textContent
			});
		});
		document.getElementById('fName').classList.remove('is-invalid');
		document.getElementById('sName').classList.remove('is-invalid');
		document.getElementById('div-contact-tr-create').classList.remove('contacts-invalid');
		const errors = await BackendAPI.create(client);
		if (errors.length) {
			errors.forEach((err) => {
				switch (err.field) {
					case 'name':
						document.getElementById('fName').classList.add('is-invalid');
						break;
					case 'surname':
						document.getElementById('sName').classList.add('is-invalid');
						break;
					case 'contacts':
						document.getElementById('div-contact-tr-create').classList.add('contacts-invalid');
						break;
				}
			});
		}
		else {
			document.getElementById('cancel-create-button').click();
			await updateClientsTable(document.getElementById('search-input').value);
		}
	});
});

function drawingTableOfClients(clientsList) {

	document.getElementById('sort-col0').classList.remove(...document.getElementById('sort-col0').classList);
	document.getElementById('sort-col0').classList.add(...clients.getSortColClasses(0));
   document.getElementById('sort-col1').classList.remove(...document.getElementById('sort-col1').classList);
	document.getElementById('sort-col1').classList.add(...clients.getSortColClasses(1));
   document.getElementById('sort-col2').classList.remove(...document.getElementById('sort-col2').classList);
	document.getElementById('sort-col2').classList.add(...clients.getSortColClasses(2));

	// цикл по всем клиентам
	for (let i = 0; i < clientsList.length; i++) {
		// создаём строку таблицы
		const tbodyTr = document.createElement('tr');

		// поочередно добавляем все данные клиента
		for (let key = 0; key < 6; key++) {
			const tbodyTd = document.createElement('td');
			switch (key) {
				case 0:
					tbodyTd.classList.add('tbody_id', 'td_text');
					tbodyTd.textContent = clientsList[i].id.substr(-6);
					break;
				case 1:
					tbodyTd.classList.add('td_full-name');
					tbodyTd.textContent = clientsList[i].surname + ' ' + clientsList[i].name;
					if (clientsList[i].lastName) {
						tbodyTd.textContent += ' ' + clientsList[i].lastName;
					}
					break;
				case 2:
					tbodyTd.classList.add('td_create');
					const date = new Date(clientsList[i].createdAt);
					tbodyTd.textContent = '';
					if (date.getDate() < 10) {
						tbodyTd.textContent = '0';
					}
					tbodyTd.textContent += `${date.getDate()}.`;
					if (date.getMonth() < 9) {
						tbodyTd.textContent += '0';
					}
					tbodyTd.textContent += `${date.getMonth() + 1}.${date.getFullYear()} `;

					const span = document.createElement('span');
					span.classList.add('td_text');
					span.textContent = `${date.getHours()}:`;
					if (date.getMinutes() < 10) {
						span.textContent += '0';
					}
					span.textContent += date.getMinutes();
					tbodyTd.append(span);
					break;
				case 3:
					tbodyTd.classList.add('td_change');
					const date2 = new Date(clientsList[i].updatedAt);
					tbodyTd.textContent = '';
					if (date2.getDate() < 10) {
						tbodyTd.textContent = '0';
					}
					tbodyTd.textContent += `${date2.getDate()}.`;
					if (date2.getMonth() < 9) {
						tbodyTd.textContent += '0';
					}
					tbodyTd.textContent += `${date2.getMonth() + 1}.${date2.getFullYear()} `;

					const span2 = document.createElement('span');
					span2.classList.add('td_text');
					span2.textContent = `${date2.getHours()}:`;
					if (date2.getMinutes() < 10) {
						span2.textContent += '0';
					}
					span2.textContent += date2.getMinutes();
					tbodyTd.append(span2);
					break;
				case 4:
					tbodyTd.classList.add('td_contacts');
					clientsList[i].contacts.forEach(contact => {
						const iconImg = document.createElement('img');
						iconImg.classList.add('contact-icon');
						iconImg.setAttribute('src', `img/contacts/${getContactIconImg(contact.type)}.svg`);
						iconImg.setAttribute('alt', 'Icon');
						iconImg.setAttribute('title', `<b>${escapeHtml(contact.type)}:</b> ${escapeHtml(contact.value)}`);
						tbodyTd.append(iconImg);
					});
					break;
				case 5:
					tbodyTd.classList.add('td_actions');
					// ** кнопка изменить
					const btnChange = document.createElement('button');
					btnChange.classList.add('btn', 'btn-primary');
					btnChange.setAttribute('data-bs-toggle', 'modal');
					btnChange.setAttribute('data-bs-target', '#updModal');
					btnChange.append('Изменить');
					btnChange.addEventListener('click', () => {
						const inputValue = document.querySelectorAll('.change-input');
						inputValue[0].value = clientsList[i].surname;
						inputValue[1].value = clientsList[i].name;
						inputValue[2].value = clientsList[i].lastName;
						document.getElementById('client-id-to-update').value = clientsList[i].id;
						fillContactsList('table#contacts-list-update-dialog tbody', 'contact-tr-update', clientsList[i].contacts);
					});

					// ** кнопка удалить
					const btnDelete = document.createElement('button');
					btnDelete.classList.add('btn', 'btn-primary');
					btnDelete.setAttribute('data-bs-toggle', 'modal');
					btnDelete.setAttribute('data-bs-target', '#delModal');
					btnDelete.append('Удалить');
					btnDelete.addEventListener('click', () => {
						// удалить клиента
						document.getElementById('client-id-to-delete').value = clientsList[i].id;
					});

					tbodyTd.append(btnChange);
					tbodyTd.append(' ');
					tbodyTd.append(btnDelete);
					break;
				default:
					break;
			}
			tbodyTr.append(tbodyTd);
		}

		// добавляем строку в таблицу
		const tableTbody = document.querySelector('.main__table_tbody');
		tableTbody.append(tbodyTr);
	}
	// Тултипы над иконками контактов
	setTooltips('.contact-icon', { placement: 'bottom', html: true });
}
