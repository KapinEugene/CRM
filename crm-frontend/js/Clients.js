class Clients {
	constructor() {
        this.clients = [];
        this.sortType = -1;
        this.sortOrder = 1;
	}

	getList() {
		return this.clients;
	}

   async updateList(searchTerm = '') {
      this.clients = await BackendAPI.getList(searchTerm);
      this.sort();
   }

	sort() {
		switch (this.sortType) {
			case 0:
				this.clients.sort((a, b) => {
					let result = 0;
					const fullName1 = (a.surname + ' ' + a.name + ' ' + a.lastName).trim();
					const fullName2 = (b.surname + ' ' + b.name + ' ' + b.lastName).trim();
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
	}

	getSortColClasses(sortColNum) {
		const classes = [];
		if (this.sortType === sortColNum) {
			if (this.sortOrder === 1) {
				classes.push('th-sortable-asc');
				if (sortColNum === 0) {
					classes.push('th-sortname-asc');
				}
			}
			else {
				classes.push('th-sortable-desc');
				if (sortColNum === 0) {
					classes.push('th-sortname-desc');
				}
			}
		}
		else {
			classes.push('th-sortable-asc');
			if (sortColNum === 0) {
				classes.push('th-sortname-asc');
			}
		}
		if (this.sortType === sortColNum) {
			classes.push('th-sorted');
		}
		return classes;
	}
}
