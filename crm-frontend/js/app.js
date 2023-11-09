const app = {
	// Подготовка модальных окон приложения и привязка событий
	initialize() {
		// Модальное окно со спиннером
		this.modalSpinner = bootstrap.Modal.getOrCreateInstance('#modal-spinner');
		// Модальное окно с ошибкой
		this.modalError = bootstrap.Modal.getOrCreateInstance('#modal-error');

		// Объект для работы с клиентами
		this.clients = new Clients({ appendTableTo: '#main-content' });

		// При закрытии модального окна с ошибкой пытаемся обновить список клиентов
		document.getElementById('modal-error').addEventListener('hidden.bs.modal', app.clients.updateList);

		// Обработчик события, предотвращающий закрытие модального окна спиннера, пока идёт получение данных с сервера
		document.getElementById('modal-spinner').addEventListener('hide.bs.modal', e => this.checkCanCloseModalSpinner(e));
	},

	// Показать модальное окно со спиннером (процесс загрузки списка клиентов)
	showSpinner() {
		this.modalSpinner.show();
	},

	// Скрыть модальное окно со спиннером
	hideSpinner() {
		this.modalSpinner.hide();
	},

	// Показать модальное окно с указанным текстом ошибки
	showError(errorMsg, htmlEnabled = false) {
		this.hideSpinner();
		if (htmlEnabled) {
			document.getElementById('modal-error-msg').innerHTML = errorMsg;
		}
		else {
			document.getElementById('modal-error-msg').textContent = Utils.escapeHtml(errorMsg);
		}
		this.modalError.show();
	},

	// Проверить, можно ли закрыть модальное окно спиннера
	checkCanCloseModalSpinner(e) {
		if (app.clients.fetchInProgress) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
		return true;
	}
}

document.addEventListener('DOMContentLoaded', () => {
	app.initialize();
});
