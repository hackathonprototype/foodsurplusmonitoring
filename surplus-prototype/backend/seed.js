
const { Low, JSONFile } = require('lowdb');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');

async function seed(){
  const adapter = new JSONFile('db.json');
  const db = new Low(adapter);
  await db.read();
  db.data = db.data || { users: [], items: [], orders: [], events: [], ngoLogs: []};
  const users = [
    {id:nanoid(), name:'Canteen A', email:'canteen@campus', passwordHash: await bcrypt.hash('canteen123',8), role:'canteen'},
    {id:nanoid(), name:'Student One', email:'student1@campus', passwordHash: await bcrypt.hash('student123',8), role:'student'},
    {id:nanoid(), name:'Student Two', email:'student2@campus', passwordHash: await bcrypt.hash('student123',8), role:'student'},
    {id:nanoid(), name:'Organizer', email:'organizer@campus', passwordHash: await bcrypt.hash('organizer123',8), role:'organizer'},
    {id:nanoid(), name:'Local NGO', email:'ngo@local', passwordHash: await bcrypt.hash('ngo123',8), role:'ngo'}
  ];
  db.data.users = users;
  const now = new Date();
  const items = [
    {id:nanoid(), name:'Chicken Biryani', description:'Leftover biryani', quantity:5, originalPrice:120, discountedPrice:84, bestBefore:new Date(now.getTime()+10*60000).toISOString(), veg:false, location:'Canteen A', createdAt:new Date().toISOString(), status:'available', canteenId:users[0].id},
    {id:nanoid(), name:'Veg Sandwich', description:'Unsold sandwiches', quantity:3, originalPrice:60, discountedPrice:40, bestBefore:new Date(now.getTime()+5*60000).toISOString(), veg:true, location:'Canteen A', createdAt:new Date().toISOString(), status:'available', canteenId:users[0].id}
  ];
  db.data.items = items;
  db.data.orders = [];
  db.data.events = [{id:nanoid(), title:'Tech Talk', startTime:new Date(now.getTime()-3600000).toISOString(), endTime:new Date(now.getTime()+60000).toISOString(), organizerId:users[3].id, promptSent:false}];
  db.data.ngoLogs = [];
  await db.write();
  console.log('Seeded demo data. Users: ', users.map(u=>u.email));
}
seed();
