const db = require('../models/ClientPostgressModel')

class UserController {
    async createUser(req, res){
        console.log(req.body);
        const {name, lastName, surname, contacts} = req.body
        const result = await db.query(`INSERT INTO crm (name, "lastName", surname)
         values ($1, $2, $3) RETURNING id`, 
         [name, lastName, surname]);
        const id = result.rows[0].id;

        contacts.forEach(async function(contact) {
            await db.query(`INSERT INTO crm_contact (type, value, user_id)
              values ($1, $2, $3)`,
              [contact.type, contact.value, id]);
        });
        
        res.json({id, name, lastName, surname, contacts});
    }
    async getUsers(req, res){
        const users = await db.query('select crm.id as id, name, "lastName", surname, type, value FROM crm '
        + 'left join  crm_contact crm_c on crm.id = crm_c.user_id order by id');
        const usersList = [];
        let lastUserId = null;
        users.rows.forEach(row => {
            if (row.id === lastUserId) {
                usersList[usersList.length - 1].contacts.push({type: row.type, value: row.value});
            }
            else {
                usersList.push({id: new String(row.id), name: row.name, lastName: row.lastName, surname: row.surname,
                    contacts: row.type ? [{type: row.type, value: row.value}] : []});
                lastUserId = row.id;
            }
        });
        res.json(usersList)
    }
    async getOneUser(req, res){
        const id = req.params.id;
        const users = await db.query('select crm.id as id, name, "lastName", surname, type, value FROM crm ' 
        + `left join  crm_contact crm_c on crm.id = crm_c.user_id WHERE crm.id = $1`, 
         [id]);
         if (users.rows.length === 0) {
            // Не нашли клиента с указанным id
            res.sendStatus(404).json({message: 'Not found'});
            return;
         }
         const client = {
            id,
            name: users.rows[0].name,
            surname: users.rows[0].surname,
            lastName: users.rows[0].lastName,
            contacts: []
         }
         users.rows.forEach(row => {
            if (row.type) {
               client.contacts.push({type: row.type, value: row.value});
            }
         });
         res.json(client);
      }
    async updateUser(req, res){
        const id = req.params.id
        const {name, lastName, surname, contacts} = req.body
        const user = await db.query(`UPDATE crm set name = $1, "lastName" = $2, surname = $3 where id = $4 RETURNING id`, 
        [name, lastName, surname, id])
        
        contacts.forEach(async function(contact) {
            await db.query(`UPDATE crm_contact set type = $1, value = $2 where user_id = $3`,
              [contact.type, contact.value, id]);
        });
        
        res.json({id, name, lastName, surname, contacts});
    }
    async deleteUser(req, res){
      const id = req.params.id;
      const users = await db.query('select crm.id as id, name, "lastName", surname FROM crm WHERE crm.id = $1', 
         [id]);
      if (users.rows.length === 0) {
         // Не нашли клиента с указанным id
         res.sendStatus(404).json({message: 'Not found'});
         return;
      }
      const users_1 = await db.query('DELETE FROM crm_contact WHERE user_id = $1', 
         [id]);
      const users_2 = await db.query('DELETE FROM crm WHERE id = $1', 
         [id]);
   }
}

module.exports = new UserController()
